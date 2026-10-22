import Tesseract from 'tesseract.js';

import { Food } from '@/data/food_and_cooking';

type OcrLine = {
  text: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
};

type FoodNameLine = OcrLine & {
  name: string,
};

export type FoodBagImageResult = {
  foodList: { name: string, num: number }[],
  rawText: string,
};

const OCR_IMAGE_WIDTH = 1080;
const FOOD_NUMBER_CROP_WIDTH = 180;
const FOOD_NUMBER_CROP_HEIGHT = 60;
const FOOD_NUMBER_CROP_SCALE = 5;

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function loadImage(source: Blob | string) {
  const objectUrl = typeof source == 'string' ? null : URL.createObjectURL(source);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('画像を読み込めませんでした。'));
      image.src = objectUrl ?? source;
    });
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }

  return image;
}

function createTextCanvas(sourceCanvas: HTMLCanvasElement) {
  const canvas = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(sourceCanvas, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  for(let index = 0; index < imageData.data.length; index += 4) {
    const red = imageData.data[index];
    const green = imageData.data[index + 1];
    const blue = imageData.data[index + 2];
    const brightness = red * 0.299 + green * 0.587 + blue * 0.114;
    const value = brightness < 180 ? 0 : 255;
    imageData.data[index] = value;
    imageData.data[index + 1] = value;
    imageData.data[index + 2] = value;
    imageData.data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

function flattenLines(blocks: Tesseract.Block[] | null): OcrLine[] {
  if (!blocks) return [];

  return blocks.flatMap(block => block.paragraphs)
    .flatMap(paragraph => paragraph.lines)
    .map(line => ({ text: line.text.trim(), ...line.bbox }))
    .filter(line => line.text);
}

function normalizeText(text: string) {
  return text.normalize('NFKC').replaceAll(/\s/g, '').replaceAll(/[×xX]/g, 'x');
}

function readFoodNumberText(text: string) {
  const match = normalizeText(text).replace(/^x+/, 'x').match(/^x?([0-9]{1,3})$/);
  return match ? Number(match[1]) : null;
}

function selectFoodNumber(sourceNum: number | null | undefined, croppedNum: number | null | undefined) {
  if (sourceNum == null) return croppedNum ?? null;
  if (croppedNum == null || sourceNum == croppedNum) return sourceNum;

  const sourceText = String(sourceNum);
  const croppedText = String(croppedNum);
  // 切り出しOCRは先頭または末尾の1桁を落とすことがある。その場合は、つながった文字列を
  // 認識できている元画像の値を優先する。桁数が逆転、または無関係な数字なら切り出しを採用する。
  if (sourceText.length == croppedText.length) return sourceNum;
  if (croppedText.length > sourceText.length) return croppedNum;
  return sourceText.startsWith(croppedText) || sourceText.endsWith(croppedText)
    ? sourceNum
    : croppedNum;
}

function levenshteinDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for(let leftIndex = 0; leftIndex < left.length; leftIndex++) {
    const current = [leftIndex + 1];
    for(let rightIndex = 0; rightIndex < right.length; rightIndex++) {
      current.push(Math.min(
        current[rightIndex] + 1,
        previous[rightIndex + 1] + 1,
        previous[rightIndex] + (left[leftIndex] == right[rightIndex] ? 0 : 1),
      ));
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous.at(-1)!;
}

function findFoodNameLine(lineList: OcrLine[]) {
  const combinedLineList = [...lineList];
  for(const first of lineList) {
    for(const second of lineList) {
      if (first == second) continue;
      const firstCenterX = (first.x0 + first.x1) / 2;
      const secondCenterX = (second.x0 + second.x1) / 2;
      if (second.y0 > first.y1 && second.y0 - first.y1 <= 35 && Math.abs(firstCenterX - secondCenterX) <= 40) {
        combinedLineList.push({
          text: `${first.text}${second.text}`,
          x0: Math.min(first.x0, second.x0), y0: first.y0,
          x1: Math.max(first.x1, second.x1), y1: second.y1,
        });
      }
    }
  }

  return combinedLineList.flatMap(line => {
    const text = normalizeText(line.text);
    const exactMatchList = Food.list.flatMap(food => {
      const name = normalizeText(food.name);
      const index = text.indexOf(name);
      if (index < 0) return [];

      // 横一列の複数名を1つの行として返すことがあるため、名前部分の横位置を文字数で近似する。
      // その後の数値切り出しでは、この位置を使って直上のバッジだけを読む。
      const width = line.x1 - line.x0;
      return [{
        ...line,
        x0: line.x0 + width * index / text.length,
        x1: line.x0 + width * (index + name.length) / text.length,
        name: food.name,
      }];
    });
    if (exactMatchList.length) return exactMatchList;

    const candidate = Food.list
      .map(food => ({ food, distance: levenshteinDistance(text, normalizeText(food.name)) }))
      .toSorted((left, right) => left.distance - right.distance)[0];
    // 食材名は短くても5文字ある。1文字だけの差に限定して、画面上の別テキストを食材にしない。
    return candidate && candidate.distance <= Math.max(1, Math.floor(candidate.food.name.length * 0.3))
      ? [{ ...line, name: candidate.food.name }]
      : [];
  }) as FoodNameLine[];
}

function createFoodNumberRegion(sourceCanvas: HTMLCanvasElement, line: FoodNameLine) {
  const centerX = (line.x0 + line.x1) / 2;
  return {
    // 数字バッジは食材名の中央付近にあるが、左端は名前よりも左へはみ出す。
    // 右寄せの切り出しでは x98 のような2桁の先頭を落としてしまうため、中央基準にする。
    x: Math.max(0, Math.min(sourceCanvas.width - FOOD_NUMBER_CROP_WIDTH, centerX - FOOD_NUMBER_CROP_WIDTH / 2)),
    // バッジの枠線・影を誤認しないよう、数字がある中央の帯だけをOCR対象にする。
    y: Math.max(0, line.y0 - FOOD_NUMBER_CROP_HEIGHT - 45),
    width: FOOD_NUMBER_CROP_WIDTH,
    height: Math.min(FOOD_NUMBER_CROP_HEIGHT, line.y0 - 45),
  };
}

function createFoodNumberCanvas(sourceCanvas: HTMLCanvasElement, nameLineList: FoodNameLine[]) {
  const padding = 24;
  const regionList = nameLineList.map(line => createFoodNumberRegion(sourceCanvas, line));
  const canvas = createCanvas(
    FOOD_NUMBER_CROP_WIDTH * FOOD_NUMBER_CROP_SCALE,
    regionList.reduce((sum, region) => sum + region.height * FOOD_NUMBER_CROP_SCALE + padding, 0),
  );
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const sectionList: { startY: number, endY: number }[] = [];
  let y = 0;
  for(const region of regionList) {
    const height = region.height * FOOD_NUMBER_CROP_SCALE;
    context.drawImage(sourceCanvas, region.x, region.y, region.width, region.height, 0, y, canvas.width, height);
    sectionList.push({ startY: y, endY: y + height });
    y += height + padding;
  }
  return { canvas: createTextCanvas(canvas), sectionList };
}

function createFoodNumberCrop(sourceCanvas: HTMLCanvasElement, nameLine: FoodNameLine) {
  const region = createFoodNumberRegion(sourceCanvas, nameLine);
  const canvas = createCanvas(
    region.width * FOOD_NUMBER_CROP_SCALE,
    region.height * FOOD_NUMBER_CROP_SCALE,
  );
  canvas.getContext('2d')!.drawImage(
    sourceCanvas,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return createTextCanvas(canvas);
}

function readFoodNumberFromCropped(
  nameLineList: FoodNameLine[],
  lineList: OcrLine[],
  sectionList: { startY: number, endY: number }[],
) {
  const numberList = new Map<string, number>();

  for(const [index, section] of sectionList.entries()) {
    const numberLineList = lineList
      .filter(line => {
        const centerY = (line.y0 + line.y1) / 2;
        return centerY >= section.startY && centerY <= section.endY;
      })
      .map(line => ({ ...line, text: normalizeText(line.text) }))
      .filter(line => /^[x0-9]+$/.test(line.text))
      .toSorted((left, right) => left.x0 - right.x0);
    if (!numberLineList.length) continue;

    // x98 のようなバッジを Tesseract が x9 と 8、または 9 と 8 に分割することがある。
    // 切り出し領域は1バッジに限定しているため、同じ高さの文字列を左順に結合してから数値化する。
    const text = numberLineList.map(line => line.text).join('');
    const num = readFoodNumberText(text);
    if (num != null) numberList.set(nameLineList[index].name, num);
  }
  return numberList;
}

function findFoodNumber(nameLine: FoodNameLine, numberLineList: OcrLine[]) {
  const nameCenterX = (nameLine.x0 + nameLine.x1) / 2;
  const nameHeight = nameLine.y1 - nameLine.y0;
  const nameWidth = nameLine.x1 - nameLine.x0;

  return numberLineList
    .flatMap(line => {
      const num = readFoodNumberText(line.text);
      if (num == null) return [];
      const centerX = (line.x0 + line.x1) / 2;
      const centerY = (line.y0 + line.y1) / 2;
      const isAboveName = centerY < nameLine.y0 - nameHeight * 0.25
        && centerY > nameLine.y0 - Math.max(220, nameHeight * 6);
      const isAtIconRightBottom = centerX >= nameCenterX - nameWidth * 0.1
        && centerX <= nameCenterX + Math.max(150, nameWidth * 0.7);
      return isAboveName && isAtIconRightBottom ? [{ line, num }] : [];
    })
    .toSorted((left, right) => {
      const leftDistance = Math.abs(left.line.y1 - nameLine.y0) + Math.abs((left.line.x0 + left.line.x1) / 2 - nameCenterX);
      const rightDistance = Math.abs(right.line.y1 - nameLine.y0) + Math.abs((right.line.x0 + right.line.x1) / 2 - nameCenterX);
      return leftDistance - rightDistance;
    })[0]?.num ?? null;
}

export default class FoodBagImageReader {
  #worker: Tesseract.Worker | null = null;

  async #getWorker(onProgress?: (status: string, progress: number) => void) {
    if (this.#worker) return this.#worker;

    const ocrAssetPath = new URL(`${import.meta.env.BASE_URL}ocr`, window.location.origin).href.replace(/\/$/, '');
    this.#worker = await Tesseract.createWorker('jpn', Tesseract.OEM.LSTM_ONLY, {
      workerPath: `${ocrAssetPath}/worker.min.js`,
      corePath: `${ocrAssetPath}/tesseract-core-lstm.wasm.js`,
      langPath: ocrAssetPath,
      gzip: false,
      logger: message => onProgress?.(message.status, message.progress),
    });
    await this.#worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT });
    return this.#worker;
  }

  async read(source: Blob | string, onProgress?: (status: string, progress: number) => void): Promise<FoodBagImageResult> {
    const image = await loadImage(source);
    const scale = OCR_IMAGE_WIDTH / image.naturalWidth;
    const sourceCanvas = createCanvas(OCR_IMAGE_WIDTH, Math.round(image.naturalHeight * scale));
    sourceCanvas.getContext('2d')!.drawImage(image, 0, 0, sourceCanvas.width, sourceCanvas.height);
    const worker = await this.#getWorker(onProgress);
    const [sourceResult, textResult] = await Promise.all([
      worker.recognize(sourceCanvas, {}, { text: true, blocks: true }),
      worker.recognize(createTextCanvas(sourceCanvas), {}, { text: true, blocks: true }),
    ]);
    const lineList = [
      ...flattenLines(sourceResult.data.blocks),
      ...flattenLines(textResult.data.blocks),
    ];
    const foodNameLineList = findFoodNameLine(lineList)
      // 同一名称が元画像・二値画像の両方から得られるため、最も下にある行だけを使う。
      .reduce((map, line) => {
        const current = map.get(line.name);
        if (!current || line.y0 > current.y0) map.set(line.name, line);
        return map;
      }, new Map<string, FoodNameLine>());
    const nameLineList = [...foodNameLineList.values()];
    const foodNumberCanvas = createFoodNumberCanvas(sourceCanvas, nameLineList);
    await worker.setParameters({
      tessedit_char_whitelist: 'xX×0123456789',
      tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
    });
    const foodNumberResult = await worker.recognize(foodNumberCanvas.canvas, {}, { blocks: true });
    const croppedNumberMap = readFoodNumberFromCropped(
      nameLineList,
      flattenLines(foodNumberResult.data.blocks),
      foodNumberCanvas.sectionList,
    );
    const missingNumberNameLineList = nameLineList.filter(line => !croppedNumberMap.has(line.name));
    if (missingNumberNameLineList.length) {
      await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_WORD });
      for(const nameLine of missingNumberNameLineList) {
        const result = await worker.recognize(createFoodNumberCrop(sourceCanvas, nameLine), {}, { text: true });
        const num = readFoodNumberText(result.data.text);
        if (num != null) croppedNumberMap.set(nameLine.name, num);
      }
    }
    const sourceNumberMap = new Map(
      nameLineList.flatMap(nameLine => {
        const num = findFoodNumber(nameLine, lineList);
        return num == null ? [] : [[nameLine.name, num] as const];
      }),
    );
    await worker.setParameters({ tessedit_char_whitelist: '', tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT });
    const foodList = nameLineList
      .flatMap(nameLine => {
        const num = selectFoodNumber(
          sourceNumberMap.get(nameLine.name),
          croppedNumberMap.get(nameLine.name),
        );
        return num == null ? [] : [{ name: nameLine.name, num, y: nameLine.y0, x: nameLine.x0 }];
      })
      // 同じ行でもOCR結果ごとに数pxの縦ずれがあるため、行の高さより十分小さい単位で丸めてから左順にする。
      .toSorted((left, right) => Math.round(left.y / 100) - Math.round(right.y / 100) || left.x - right.x)
      .map(({ name, num }) => ({ name, num }));

    return {
      foodList,
      rawText: `${sourceResult.data.text}\n${textResult.data.text}`,
    };
  }

  async terminate() {
    await this.#worker?.terminate();
    this.#worker = null;
  }
}
