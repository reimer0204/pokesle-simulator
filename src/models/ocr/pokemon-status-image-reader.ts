import Tesseract from 'tesseract.js';

import { Food } from '@/data/food_and_cooking';
import Nature from '@/data/nature';
import Pokemon from '@/data/pokemon';
import Skill from '@/data/skill';
import SubSkill from '@/data/sub-skill';
import type { PokemonType } from '@/type';

type OcrLine = {
  text: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  subSkillRarity?: number,
};

type ImageRegion = {
  x: number,
  y: number,
  width: number,
  height: number,
  occluded?: boolean,
};

type FoodRecognition = {
  name: string | null,
  num: number | null,
  region: ImageRegion,
  matchList: { name: string, score: number }[],
  empty: boolean,
};

export type PokemonStatusImageResult = {
  name: string | null,
  pokemonName: string | null,
  lv: number | null,
  helpTime: string | null,
  bag: number | null,
  foodList: (string | null)[],
  mainSkillName: string | null,
  mainSkillLv: number | null,
  subSkillList: string[],
  nature: string | null,
  rawText: string,
};

const OCR_IMAGE_WIDTH = 1080;
const FOOD_SEARCH_WIDTH = 360;

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

function drawImageToCanvas(image: CanvasImageSource, sourceWidth: number, sourceHeight: number) {
  // 小さい画像も基準幅へ拡大し、色付きのサブスキル枠にある細い文字をOCRが判別できる大きさに揃える。
  // 大きい画像は同じ基準幅へ縮小するため、端末の解像度に比例して処理負荷が増えることも防げる。
  const scale = OCR_IMAGE_WIDTH / sourceWidth;
  const canvas = createCanvas(Math.round(sourceWidth * scale), Math.round(sourceHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function createTextCanvas(sourceCanvas: HTMLCanvasElement, removeGreen = false) {
  const canvas = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(sourceCanvas, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  // ゲーム画面の文字は背景より暗いため、暗い画素だけを残すと色付きの枠やアイコンをOCR対象から概ね除外できる。
  for(let i = 0; i < data.length; i += 4) {
    const isGreenDecoration = removeGreen
      && data[i + 1] - data[i] >= 25
      && data[i + 1] - data[i + 2] >= 10;
    const brightness = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const value = !isGreenDecoration && brightness < 180 ? 0 : 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

function flattenLines(blocks: Tesseract.Block[] | null): OcrLine[] {
  if (!blocks) return [];

  return blocks.flatMap(block => block.paragraphs)
    .flatMap(paragraph => paragraph.lines)
    .map(line => ({
      text: line.text.trim(),
      x0: line.bbox.x0,
      y0: line.bbox.y0,
      x1: line.bbox.x1,
      y1: line.bbox.y1,
    }))
    .filter(line => line.text);
}

function setSubSkillRarity(lineList: OcrLine[], sourceCanvas: HTMLCanvasElement) {
  const context = sourceCanvas.getContext('2d', { willReadFrequently: true })!;
  const { data } = context.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

  for(const line of lineList) {
    let goldCount = 0;
    let blueCount = 0;
    let sampleCount = 0;
    const padding = 8;
    const minX = Math.max(0, Math.floor(line.x0 - padding));
    const maxX = Math.min(sourceCanvas.width - 1, Math.ceil(line.x1 + padding));
    const minY = Math.max(0, Math.floor(line.y0 - padding));
    const maxY = Math.min(sourceCanvas.height - 1, Math.ceil(line.y1 + padding));

    for(let y = minY; y <= maxY; y += 3) {
      for(let x = minX; x <= maxX; x += 3) {
        const index = (y * sourceCanvas.width + x) * 4;
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        sampleCount++;
        // 未解放の金枠は白に近い淡色になるため、明度ではなく青成分との差を中心に判定する。
        if (red >= 185 && green >= 155 && red - blue >= 20 && green - blue >= 5) goldCount++;
        if (green >= 205 && blue >= 215 && blue - red >= 8) blueCount++;
      }
    }

    // 金・青を検出できないスキル枠は白として扱う。文字類似度も併用するため、通常の白背景文は候補になりにくい。
    if (goldCount >= sampleCount * 0.08) line.subSkillRarity = 3;
    else if (blueCount >= sampleCount * 0.08) line.subSkillRarity = 2;
    else line.subSkillRarity = 1;
  }
}

function normalizeText(text: string) {
  return text
    .normalize('NFKC')
    .replace(/[\s|｜_]/g, '')
    .replace(/[＄$]/g, 'S')
    .replace(/[．。]/g, '.')
    // 小さい濁点が別文字になりやすい定型語は、類似度計算の前に代表的な崩れを戻す。
    .replace(/ボ[ポボ]+ー/g, 'ボー')
    .replace(/おてつた?だ(?:た?だ)+い/g, 'おてつだい');
}

function levenshteinDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, i) => i);

  for(let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    const current = [leftIndex];
    for(let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] == right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function getTextSimilarity(expected: string, actual: string) {
  const normalizedExpected = normalizeText(expected);
  const normalizedActual = normalizeText(actual);
  if (!normalizedActual) return 0;
  if (normalizedActual.includes(normalizedExpected)) return 1;

  // OCR結果の前後に別の文字が付く場合があるため、候補と近い長さの部分文字列も比較する。
  let minimumDistance = levenshteinDistance(normalizedExpected, normalizedActual);
  const minimumLength = Math.max(1, normalizedExpected.length - 2);
  const maximumLength = Math.min(normalizedActual.length, normalizedExpected.length + 2);

  for(let length = minimumLength; length <= maximumLength; length++) {
    for(let start = 0; start + length <= normalizedActual.length; start++) {
      minimumDistance = Math.min(
        minimumDistance,
        levenshteinDistance(normalizedExpected, normalizedActual.slice(start, start + length)),
      );
    }
  }

  return 1 - minimumDistance / Math.max(normalizedExpected.length, 1);
}

function findBestLine(name: string, lineList: OcrLine[]) {
  return lineList
    .map(line => ({ line, score: getTextSimilarity(name, line.text) }))
    .toSorted((a, b) => b.score - a.score)[0];
}

function splitSubSkillLine(line: OcrLine) {
  const segmentList: OcrLine[] = [];
  const separatorPattern = /[|｜]|\s{2,}/g;
  let start = 0;

  for(const separator of line.text.matchAll(separatorPattern)) {
    const end = separator.index ?? start;
    const text = line.text.slice(start, end).trim();
    if (text) {
      const textStart = line.text.indexOf(text, start);
      const width = line.x1 - line.x0;
      segmentList.push({
        ...line,
        text,
        x0: line.x0 + width * textStart / line.text.length,
        x1: line.x0 + width * (textStart + text.length) / line.text.length,
      });
    }
    start = end + separator[0].length;
  }

  const text = line.text.slice(start).trim();
  if (text) {
    const textStart = line.text.indexOf(text, start);
    const width = line.x1 - line.x0;
    segmentList.push({
      ...line,
      text,
      x0: line.x0 + width * textStart / line.text.length,
    });
  }

  // 区切りを検出できない通常行では、座標と文字列を変えず従来どおり照合する。
  return segmentList.length ? segmentList : [line];
}

function getSkillAliasList(name: string) {
  // 画面では「(ランダム)」などの補足が省略されるスキルがあるため、マスター名と表示名の両方を候補にする。
  return [...new Set([name, name.replace(/\(.+\)$/, '')])];
}

function getSkillSimilarity(expected: string, actual: string) {
  return Math.max(...getSkillAliasList(expected).flatMap(expectedAlias =>
    getSkillAliasList(actual).map(actualAlias => getTextSimilarity(expectedAlias, actualAlias))
  ));
}

function getEnableSubSkillList(lv: number | null, subSkillList: string[]) {
  if (lv == null) return [];
  const enableLength = [10, 25, 50, 70, 80].filter(unlockLv => lv >= unlockLv).length;
  return subSkillList.slice(0, enableLength);
}

function parseHelpTime(helpTime: string | null) {
  const match = helpTime?.match(/(?:(\d+)時間)?(\d+)分(\d+)秒/);
  return match ? Number(match[1] ?? 0) * 3600 + Number(match[2]) * 60 + Number(match[3]) : null;
}

function formatHelpTime(seconds: number) {
  const hour = Math.floor(seconds / 3600);
  const minute = Math.floor(seconds % 3600 / 60);
  return `${hour ? `${hour}時間` : ''}${minute}分${seconds % 60}秒`;
}

function parseBag(rawText: string) {
  // 複数のOCR結果を連結しているため、先頭に余計な数字が付いた「524個」と正しい「24個」が共存する場合がある。
  // マスター上の最大値へ全所持数サブスキルと睡眠リボンを足した値を上限にし、異常値を推定材料から除外する。
  const maximumBag = Math.max(...Pokemon.list.map(pokemon => pokemon.bag)) + 6 + 12 + 18 + 8;
  const bagList = [...normalizeText(rawText).matchAll(/([0-9]+)個/g)]
    .map(match => Number(match[1]))
    .filter(bag => bag >= 1 && bag <= maximumBag);
  if (!bagList.length) return null;

  // 元画像・二値画像・枠抽出画像で繰り返し得られた値を優先し、同数なら先に現れた結果を採用する。
  const countMap = new Map<number, number>();
  for(const bag of bagList) countMap.set(bag, (countMap.get(bag) ?? 0) + 1);
  return bagList.toSorted((left, right) => (countMap.get(right) ?? 0) - (countMap.get(left) ?? 0))[0];
}

function getExpectedHelpTimeList(
  pokemon: PokemonType,
  lv: number | null,
  subSkillList: string[],
  natureName: string | null,
) {
  if (lv == null) return [];

  const enableSubSkillList = getEnableSubSkillList(lv, subSkillList);
  let speedBonus = 0;
  if (enableSubSkillList.includes('おてつだいスピードS')) speedBonus += 0.07;
  if (enableSubSkillList.includes('おてつだいスピードM')) speedBonus += 0.14;
  speedBonus = Math.min(speedBonus, 0.35);

  const nature = natureName ? Nature.map[natureName] : null;
  const baseTime = Math.floor(
    pokemon.help
    * (1 - (lv - 1) * 0.002)
    * (1 - speedBonus)
    * (nature?.good == '手伝いスピード' ? 0.9 : nature?.weak == '手伝いスピード' ? 1.075 : 1)
  );

  // 睡眠時間は画像にないため、睡眠リボンなし・500時間・2000時間の全状態を比較対象にする。
  const ribbonRateList = pokemon.remainEvolveLv == 1
    ? [1, 0.95, 0.95 * 0.88]
    : pokemon.remainEvolveLv == 2
      ? [1, 0.89, 0.89 * 0.75]
      : [1];
  return [...new Set(ribbonRateList.map(rate => Math.floor(baseTime * rate)))];
}

function getExpectedBagList(pokemon: PokemonType, lv: number | null, subSkillList: string[]) {
  const enableSubSkillList = getEnableSubSkillList(lv, subSkillList);
  const baseBag = pokemon.bag
    + (enableSubSkillList.includes('最大所持数アップS') ? 6 : 0)
    + (enableSubSkillList.includes('最大所持数アップM') ? 12 : 0)
    + (enableSubSkillList.includes('最大所持数アップL') ? 18 : 0);

  // 睡眠リボンの累計加算は画像だけでは特定できないため、到達し得る各段階を候補に残す。
  return [0, 1, 3, 6, 8].map(ribbonBag => baseBag + ribbonBag);
}

function isAllowedFood(pokemon: PokemonType, foodName: string, slotIndex: number) {
  return pokemon.foodNumListMap[foodName]?.[slotIndex] != null;
}

function getAllowedFoodMatch(
  pokemon: PokemonType,
  recognition: FoodRecognition | undefined,
  slotIndex: number,
) {
  if (!recognition) return null;

  return recognition.matchList
    .filter(match => isAllowedFood(pokemon, match.name, slotIndex))
    .toSorted((left, right) => {
      if (recognition.num == null) return right.score - left.score;
      const leftNumMatched = pokemon.foodNumListMap[left.name]?.[slotIndex] == recognition.num;
      const rightNumMatched = pokemon.foodNumListMap[right.name]?.[slotIndex] == recognition.num;
      // アイコンが半透明でも、表示個数が一致する食材を優先すれば色の近い候補を絞り込める。
      return Number(rightNumMatched) - Number(leftNumMatched) || right.score - left.score;
    })[0] ?? null;
}

function getNearestNumber(value: number | null, candidateList: number[]) {
  // 元画像から値を取得できていない場合、睡眠リボン状態まで推測して値を捏造しない。
  if (value == null || !candidateList.length) return null;
  return candidateList.toSorted((left, right) => Math.abs(left - value) - Math.abs(right - value))[0];
}

function correctBagSubSkillList(
  pokemon: PokemonType,
  lv: number | null,
  bag: number | null,
  subSkillList: string[],
) {
  if (bag == null) return subSkillList;

  const candidateList = subSkillList.reduce<string[][]>((list, subSkill, index) => {
    if (subSkill != '最大所持数アップM' && subSkill != '最大所持数アップL') return list;
    return list.flatMap(candidate => ['最大所持数アップM', '最大所持数アップL'].map(replacement => {
      const next = [...candidate];
      next[index] = replacement;
      return next;
    }));
  }, [[...subSkillList]])
    // 同じサブスキルを2つ持つ構成は存在しないため、OCR補正候補から除外する。
    .filter(candidate => new Set(candidate).size == candidate.length);

  return candidateList.toSorted((left, right) => {
    const leftDifference = Math.min(...getExpectedBagList(pokemon, lv, left).map(value => Math.abs(value - bag)));
    const rightDifference = Math.min(...getExpectedBagList(pokemon, lv, right).map(value => Math.abs(value - bag)));
    const leftChangeCount = left.filter((value, index) => value != subSkillList[index]).length;
    const rightChangeCount = right.filter((value, index) => value != subSkillList[index]).length;
    // M/Lは同じ青枠なので、所持数との誤差を最優先し、同点ならOCR結果を変えない候補を残す。
    return leftDifference - rightDifference || leftChangeCount - rightChangeCount;
  })[0] ?? subSkillList;
}

function correctLevel(
  pokemon: PokemonType,
  recognizedLv: number | null,
  actualHelpTime: number | null,
  subSkillList: string[],
  nature: string | null,
) {
  if (recognizedLv == null || actualHelpTime == null) return recognizedLv;

  const getDifference = (lv: number) => Math.min(
    ...getExpectedHelpTimeList(pokemon, lv, subSkillList, nature)
      .map(expected => Math.abs(expected - actualHelpTime)),
  );
  const recognizedDifference = getDifference(recognizedLv);
  const best = Array.from({ length: 100 }, (_, index) => index + 1)
    .map(lv => ({ lv, difference: getDifference(lv) }))
    .toSorted((left, right) => left.difference - right.difference)[0];

  // OCRが「Lv.11」を「Lv.1」と読んだ場合など、表示時間とほぼ完全に一致する別Lvだけを採用する。
  // 数秒以上の誤差がある候補まで補正すると、睡眠リボン等の未取得条件によって正しいLvを変える恐れがある。
  return best && best.difference <= 3 && best.difference + 3 < recognizedDifference ? best.lv : recognizedLv;
}

function estimatePokemon(result: PokemonStatusImageResult, foodRecognitionList: FoodRecognition[]) {
  const actualHelpTime = parseHelpTime(result.helpTime);
  const scoreList = Pokemon.list.map(pokemon => {
    const nameSimilarity = result.name ? getTextSimilarity(pokemon.name, result.name) : 0;
    const skillSimilarity = result.mainSkillName
      ? getSkillSimilarity(pokemon.skill.name, result.mainSkillName)
      : 0;
    const expectedHelpTimeList = getExpectedHelpTimeList(
      pokemon,
      result.lv,
      result.subSkillList,
      result.nature,
    );
    const helpDifference = actualHelpTime == null || !expectedHelpTimeList.length
      ? null
      : Math.min(...expectedHelpTimeList.map(value => Math.abs(value - actualHelpTime)));
    const expectedBagList = getExpectedBagList(pokemon, result.lv, result.subSkillList);
    const bagDifference = result.bag == null
      ? null
      : Math.min(...expectedBagList.map(value => Math.abs(value - result.bag!)));

    let score = 0;
    // ニックネームはマスター名と一致しないため、似ている場合だけ加点して不一致は減点しない。
    if (nameSimilarity >= 0.55) score += nameSimilarity * 8;
    if (result.mainSkillName) score += skillSimilarity * 8;
    // おてつだい時間は種族差を見分けやすいため、近い候補同士でも差が付くよう数分以内の一致を強く評価する。
    if (helpDifference != null) score += 7 / (1 + helpDifference / 60);
    if (bagDifference != null) score += Math.max(0, 1 - bagDifference / 18) * 4;
    foodRecognitionList.forEach((recognition, slotIndex) => {
      const bestMatchScore = recognition.matchList[0]?.score ?? 0;
      const allowedMatch = getAllowedFoodMatch(pokemon, recognition, slotIndex);
      if (!allowedMatch || bestMatchScore <= 0) return;

      // 1位の誤認結果だけで判定せず、候補ポケモンが持てる食材のうち画像に最も近いものを評価する。
      // これにより、ポテトと誤認した大豆でも候補順位の情報を残し、数値条件が近い種族の判別に利用できる。
      score += (allowedMatch.score / bestMatchScore) * 4;
      if (recognition.num != null) {
        // 食材とくい補正を含む表示個数は、基礎値が同じキャタピーとフシギダネのような候補の判別に使える。
        score += pokemon.foodNumListMap[allowedMatch.name]?.[slotIndex] == recognition.num ? 4 : -2;
      }
    });

    return { pokemon, score, nameSimilarity };
  }).toSorted((left, right) => right.score - left.score);

  const [best, second] = scoreList;
  if (!best || best.score < 8) return null;

  // 同点に近い候補を無理に確定すると補正自体が誤りになるため、名前の強い一致か十分な点差を必要とする。
  const hasEnoughDifference = best.nameSimilarity >= 0.8 || best.score - (second?.score ?? 0) >= 0.75;
  return hasEnoughDifference ? best.pokemon : null;
}

function correctResult(result: PokemonStatusImageResult, foodRecognitionList: FoodRecognition[]) {
  const pokemon = estimatePokemon(result, foodRecognitionList);
  if (!pokemon) return result;

  const actualHelpTime = parseHelpTime(result.helpTime);
  const correctedLv = correctLevel(pokemon, result.lv, actualHelpTime, result.subSkillList, result.nature);
  const correctedSubSkillList = correctBagSubSkillList(pokemon, correctedLv, result.bag, result.subSkillList);
  const correctedHelpTime = getNearestNumber(
    actualHelpTime,
    getExpectedHelpTimeList(pokemon, correctedLv, correctedSubSkillList, result.nature),
  );
  const correctedBag = getNearestNumber(
    result.bag,
    getExpectedBagList(pokemon, correctedLv, correctedSubSkillList),
  );
  const correctedMainSkillName = getSkillAliasList(pokemon.skill.name)
    .toSorted((left, right) =>
      getTextSimilarity(right, result.mainSkillName ?? '') - getTextSimilarity(left, result.mainSkillName ?? '')
    )[0];
  const correctedFoodList = Array.from({ length: 3 }, (_, slotIndex) => {
    const recognizedFood = result.foodList[slotIndex];
    const recognition = foodRecognitionList[slotIndex];
    // アイコンが表示されていない未設定枠は、低い類似度の候補から食材を補完しない。
    if (recognition?.empty) return null;
    // 全食材が候補になる特別な個体でも1枠目はマスター先頭の固定食材なので、類似色への誤認を防ぐ。
    if (slotIndex == 0 && pokemon.foodNameList.length > 3) return pokemon.foodNameList[0] ?? null;
    // ポップアップに隠れた1枠目は画像比較が成立しないため、種族ごとに固定の1枠目を使う。
    if (slotIndex == 0 && recognition?.region.occluded) return pokemon.foodNameList[0] ?? null;
    const recognizedNumMatched = recognition?.num == null
      || pokemon.foodNumListMap[recognizedFood ?? '']?.[slotIndex] == recognition.num;
    if (recognizedFood && isAllowedFood(pokemon, recognizedFood, slotIndex) && recognizedNumMatched) {
      return recognizedFood;
    }

    // 誤検知した食材は、その枠で選択可能なものに限定して画像類似度が最も高い候補へ置き換える。
    const allowedMatch = getAllowedFoodMatch(pokemon, recognition, slotIndex);
    return allowedMatch?.name ?? (slotIndex == 0 ? pokemon.foodNameList[0] : null);
  });

  return {
    ...result,
    // 種族名に十分近い場合だけ表記揺れを直し、ニックネームはそのまま保持する。
    name: result.name && getTextSimilarity(pokemon.name, result.name) >= 0.65 ? pokemon.name : result.name,
    pokemonName: pokemon.name,
    lv: correctedLv,
    // 画面から時間を直接読めた場合は、睡眠リボン等の画像にない条件から逆算した値で上書きしない。
    helpTime: actualHelpTime != null ? result.helpTime : correctedHelpTime == null ? null : formatHelpTime(correctedHelpTime),
    bag: correctedBag ?? result.bag,
    foodList: correctedFoodList,
    subSkillList: correctedSubSkillList,
    // 「(ランダム)」等が画面で省略される場合は、認識した表示に近い別名を返す。
    mainSkillName: correctedMainSkillName,
  };
}

function parseData(
  rawText: string,
  lineList: OcrLine[],
  foodRecognitionList: FoodRecognition[],
  primaryLineList = lineList,
  sourceCoordinateLineList = lineList,
): PokemonStatusImageResult {
  const normalizedRawText = normalizeText(rawText);
  const levelLineList = primaryLineList
    .map(line => ({ line, match: normalizeText(line.text).match(/Lv\.?([0-9]{1,3})(.*)/i) }))
    .filter((item): item is { line: OcrLine, match: RegExpMatchArray } => item.match != null)
    .toSorted((a, b) => a.line.y0 - b.line.y0);

  // 一番上のLv表記が個体レベルで、その同じ行の残りがポケモン名またはニックネームになる。
  const pokemonLevelLine = levelLineList[0];
  const lv = pokemonLevelLine ? Number(pokemonLevelLine.match[1]) : null;
  const parsedName = pokemonLevelLine?.match[2]
    .replace(/^[.:・\-]+/, '')
    .trim() ?? '';

  // 1時間を超えるポケモンでは「時間」を含めて取得し、末尾の「17分53秒」だけを短い個体として扱わない。
  const helpTimeMatch = normalizedRawText.match(/(?:(\d+)時間)?(\d+)分(\d+)秒/);
  // 時間表記がないのに分が60以上なら、左側の装飾やSP末尾を分へ連結した誤認として末尾2桁を使う。
  const parsedMinute = helpTimeMatch
    ? Number(helpTimeMatch[2]) >= 60 && !helpTimeMatch[1]
      ? Number(helpTimeMatch[2].slice(-2))
      : Number(helpTimeMatch[2])
    : null;

  const mainSkill = Skill.list
    .flatMap(skill => getSkillAliasList(skill.name).map(alias => ({
      name: skill.name,
      match: findBestLine(alias, lineList),
    })))
    .toSorted((left, right) => right.match.score - left.match.score)[0];

  // メインスキル名と同じ元画像OCRから座標を取り、名前より下にあるLv表記だけをスキルレベル候補にする。
  // これにより、食材欄の「Lv.60」が「Lv.6o」と誤認されても、その先頭の6を拾わない。
  const primaryMainSkillLine = mainSkill
    ? getSkillAliasList(mainSkill.name)
      .map(alias => findBestLine(alias, primaryLineList))
      .toSorted((left, right) => right.score - left.score)[0]
    : null;
  const mainSkillLv = levelLineList
    .filter(item => item.line.y0 > (primaryMainSkillLine?.line?.y0 ?? pokemonLevelLine?.line.y0 ?? -1)
      && Number(item.match[1]) <= 7
    )
    .map(item => Number(item.match[1]))[0] ?? null;

  // 元画像側で見出しを読めない場合もあるため、同じ座標系を持つ二値画像側を含めて下端を探す。
  const primaryDetailStatusLine = findBestLine('詳細ステータス', sourceCoordinateLineList);
  const subSkillLineList = sourceCoordinateLineList.filter(line =>
    line.y0 > (primaryMainSkillLine?.line?.y0 ?? pokemonLevelLine?.line.y0 ?? -1)
      // 見出しは一部しか読めないことがあるため、低めの一致率でも位置境界として採用する。
      && (primaryDetailStatusLine?.score < 0.45 || line.y0 < primaryDetailStatusLine.line.y0)
  );

  // 2列のスキルが1つのOCR行に結合されることがあるため、空白と罫線で分けた領域ごとに候補を割り当てる。
  // 詳細ステータスより下を除外し、「おてつだいスピード」の評価表示をサブスキルと誤認しないようにする。
  const subSkillList = subSkillLineList
    .flatMap(splitSubSkillLine)
    .map(line => SubSkill.list
      .map(subSkill => {
        const textScore = getTextSimilarity(subSkill.name, line.text);
        // 背景色はS/Mの末尾を取り違えた場合の決め手にする一方、薄い金枠の色を外しても明瞭な文字を捨てない。
        const rarityScore = line.subSkillRarity == subSkill.rarity ? 0.16 : -0.08;
        return { name: subSkill.name, line, score: textScore + rarityScore };
      })
      .toSorted((a, b) => b.score - a.score)[0]
    )
    .filter(item => item.score >= 0.72)
    .toSorted((a, b) => b.score - a.score)
    .filter((item, index, list) => list.findIndex(other => other.name == item.name) == index)
    // 説明文などの低精度な誤候補が画面上部にあっても、信頼度の高い5件を押し出さないよう先に候補を絞る。
    .slice(0, 5)
    .toSorted((a, b) => {
      const lineHeight = Math.max(a.line.y1 - a.line.y0, b.line.y1 - b.line.y0);
      return Math.abs(a.line.y0 - b.line.y0) <= lineHeight ? a.line.x0 - b.line.x0 : a.line.y0 - b.line.y0;
    })
    .map(item => item.name);

  const nature = Nature.list
    .map(item => ({ name: item.name, match: findBestLine(item.name, lineList) }))
    .toSorted((a, b) => b.match!.score - a.match!.score)[0];

  const result: PokemonStatusImageResult = {
    name: parsedName || null,
    pokemonName: null,
    lv,
    helpTime: helpTimeMatch
      ? `${helpTimeMatch[1] ? `${Number(helpTimeMatch[1])}時間` : ''}${parsedMinute}分${Number(helpTimeMatch[3])}秒`
      : null,
    bag: parseBag(rawText),
    foodList: foodRecognitionList.map(food => food.name),
    mainSkillName: mainSkill?.match.score >= 0.65 ? mainSkill.name : null,
    mainSkillLv,
    subSkillList,
    nature: nature?.match && nature.match.score >= 0.65 ? nature.name : null,
    rawText,
  };
  return correctResult(result, foodRecognitionList);
}

function isFoodCircleColor(red: number, green: number, blue: number) {
  // 食材アイコン背面の淡い黄色だけを拾い、白背景やスキル枠の濃い黄色を除外する。
  return red >= 244 && green >= 238 && blue >= 190 && blue <= 244
    && red - green <= 20 && green - blue >= 5;
}

function findFoodCircleRegions(sourceCanvas: HTMLCanvasElement): ImageRegion[] {
  const scale = Math.min(1, FOOD_SEARCH_WIDTH / sourceCanvas.width);
  const canvas = createCanvas(Math.round(sourceCanvas.width * scale), Math.round(sourceCanvas.height * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const mask = new Uint8Array(canvas.width * canvas.height);

  for(let index = 0; index < mask.length; index++) {
    const pixelIndex = index * 4;
    mask[index] = isFoodCircleColor(data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2]) ? 1 : 0;
  }

  const regionList: ImageRegion[] = [];
  const queue: number[] = [];
  for(let start = 0; start < mask.length; start++) {
    if (!mask[start]) continue;

    mask[start] = 0;
    queue.length = 0;
    queue.push(start);
    let queueIndex = 0;
    let area = 0;
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    while(queueIndex < queue.length) {
      const index = queue[queueIndex++];
      const x = index % canvas.width;
      const y = Math.floor(index / canvas.width);
      area++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      const neighborList = [index - 1, index + 1, index - canvas.width, index + canvas.width];
      for(const neighbor of neighborList) {
        if (neighbor < 0 || neighbor >= mask.length || !mask[neighbor]) continue;
        const neighborX = neighbor % canvas.width;
        if (Math.abs(neighborX - x) > 1) continue;
        mask[neighbor] = 0;
        queue.push(neighbor);
      }
    }

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const aspectRatio = width / height;
    const fillRate = area / (width * height);
    if (area >= 120 && width >= 20 && height >= 20 && width <= 75 && height <= 75
      && aspectRatio >= 0.65 && aspectRatio <= 1.5 && fillRate >= 0.25
    ) {
      regionList.push({
        x: minX / scale,
        y: minY / scale,
        width: width / scale,
        height: height / scale,
      });
    }
  }

  return regionList;
}

function findGreenOutlineRegions(sourceCanvas: HTMLCanvasElement): ImageRegion[] {
  const scale = Math.min(1, FOOD_SEARCH_WIDTH / sourceCanvas.width);
  const canvas = createCanvas(Math.round(sourceCanvas.width * scale), Math.round(sourceCanvas.height * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const greenCountByRow = new Array(canvas.height).fill(0) as number[];
  const minimumXByRow = new Array(canvas.height).fill(canvas.width) as number[];
  const maximumXByRow = new Array(canvas.height).fill(0) as number[];

  // 緑枠が途中で文字に隠れても検出できるよう、連結画素ではなく各行の緑色画素数から横長領域を探す。
  for(let y = 0; y < canvas.height; y++) {
    for(let x = 0; x < canvas.width; x++) {
      const pixelIndex = (y * canvas.width + x) * 4;
      const red = data[pixelIndex];
      const green = data[pixelIndex + 1];
      const blue = data[pixelIndex + 2];
      if (green >= 135 && green - red >= 25 && green - blue >= 10) {
        greenCountByRow[y]++;
        minimumXByRow[y] = Math.min(minimumXByRow[y], x);
        maximumXByRow[y] = Math.max(maximumXByRow[y], x);
      }
    }
  }

  const activeRowList = greenCountByRow.map(count => count >= 3);
  const regionList: ImageRegion[] = [];
  for(let startY = 0; startY < canvas.height;) {
    if (!activeRowList[startY]) {
      startY++;
      continue;
    }

    let endY = startY;
    let lastActiveY = startY;
    while(endY + 1 < canvas.height && endY + 1 - lastActiveY <= 3) {
      endY++;
      if (activeRowList[endY]) lastActiveY = endY;
    }
    endY = lastActiveY;

    const minX = Math.min(...minimumXByRow.slice(startY, endY + 1));
    const maxX = Math.max(...maximumXByRow.slice(startY, endY + 1));
    const width = maxX - minX + 1;
    const height = endY - startY + 1;
    if (width >= canvas.width * 0.2 && height >= 8 && height <= 65) {
      const padding = 8;
      regionList.push({
        x: Math.max(0, minX - padding) / scale,
        y: Math.max(0, startY - padding) / scale,
        width: Math.min(canvas.width - Math.max(0, minX - padding), width + padding * 2) / scale,
        height: Math.min(canvas.height - Math.max(0, startY - padding), height + padding * 2) / scale,
      });
    }
    startY = endY + 1;
  }

  return regionList;
}

function createSourceCoordinateRegionCanvas(sourceCanvas: HTMLCanvasElement, regionList: ImageRegion[]) {
  if (!regionList.length) return null;

  const canvas = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  for(const region of regionList) {
    context.drawImage(
      sourceCanvas,
      region.x,
      region.y,
      region.width,
      region.height,
      region.x,
      region.y,
      region.width,
      region.height,
    );
  }
  return createTextCanvas(canvas, true);
}

function getFoodNumberRegionList(foodRecognitionList: FoodRecognition[], sourceCanvas: HTMLCanvasElement) {
  return foodRecognitionList.map(({ region }) => ({
    // 個数はアイコン右下へ重ねて表示されるため、その周囲だけを残してOCRの背景ノイズを減らす。
    x: Math.max(0, region.x + region.width * 0.5),
    y: Math.max(0, region.y + region.height * 0.5),
    width: Math.min(region.width * 0.7, sourceCanvas.width - region.x - region.width * 0.5),
    height: Math.min(region.height * 0.6, sourceCanvas.height - region.y - region.height * 0.5),
  }));
}

function createFoodNumberCanvas(sourceCanvas: HTMLCanvasElement, foodRecognitionList: FoodRecognition[]) {
  if (!foodRecognitionList.length) return null;

  const scale = 5;
  const padding = 16;
  const regionList = getFoodNumberRegionList(foodRecognitionList, sourceCanvas);
  const width = Math.ceil(Math.max(...regionList.map(region => region.width)) * scale);
  const sectionHeightList = regionList.map(region => Math.ceil(region.height * scale) + padding);
  const canvas = createCanvas(width, sectionHeightList.reduce((sum, height) => sum + height, 0));
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const sectionList: { startY: number, endY: number }[] = [];
  let y = 0;
  for(const region of regionList) {
    const height = Math.ceil(region.height * scale);
    context.drawImage(
      sourceCanvas,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      y,
      region.width * scale,
      region.height * scale,
    );
    sectionList.push({ startY: y, endY: y + height });
    y += height + padding;
  }

  return { canvas: createTextCanvas(canvas, true), sectionList };
}

function setFoodNumberListFromCropped(
  foodRecognitionList: FoodRecognition[],
  lineList: OcrLine[],
  sectionList: { startY: number, endY: number }[],
) {
  for(const line of lineList) {
    // 専用画像には個数ラベルしか残していないため、先頭のxを落として数字だけ読めた場合も採用する。
    const match = normalizeText(line.text).match(/([0-9]+)/);
    if (!match) continue;
    const centerY = (line.y0 + line.y1) / 2;
    const slotIndex = sectionList.findIndex(section => centerY >= section.startY && centerY <= section.endY);
    if (slotIndex >= 0 && foodRecognitionList[slotIndex].num == null) {
      const recognizedNumber = Number(match[1]);
      // 隣接する2枠の「x2」「x4」が一行の「24」になった場合は、この区画側にある末尾の数字を使う。
      foodRecognitionList[slotIndex].num = recognizedNumber > 20
        ? Number(match[1].at(-1))
        : recognizedNumber;
    }
  }
}

function selectFoodSlotRegions(regionList: ImageRegion[]): ImageRegion[] {
  const rowList: ImageRegion[][] = [];

  // レイアウトが上下へ移動しても追従できるよう、絶対座標ではなく円の大きさを基準に同じ行をまとめる。
  for(const region of regionList.toSorted((a, b) => a.y - b.y)) {
    const centerY = region.y + region.height / 2;
    const row = rowList.find(row => {
      const reference = row[0];
      const referenceCenterY = reference.y + reference.height / 2;
      return Math.abs(centerY - referenceCenterY) <= Math.max(region.height, reference.height) * 0.55;
    });
    if (row) row.push(region);
    else rowList.push([region]);
  }

  const foodRow = rowList
    .filter(row => row.length >= 2)
    .toSorted((a, b) => b.length - a.length || a[0].y - b[0].y)[0];
  if (!foodRow) return [];

  const sortedFoodRow = foodRow.toSorted((a, b) => a.x - b.x);
  let slotList: ImageRegion[] = [];

  // 3枠すべての円が見える場合は、中心間隔が最も均等な3つを食材欄として採用する。
  if (sortedFoodRow.length >= 3) {
    slotList = Array.from({ length: sortedFoodRow.length - 2 }, (_, index) => sortedFoodRow.slice(index, index + 3))
      .toSorted((left, right) => {
        const leftFirstInterval = left[1].x + left[1].width / 2 - (left[0].x + left[0].width / 2);
        const leftSecondInterval = left[2].x + left[2].width / 2 - (left[1].x + left[1].width / 2);
        const rightFirstInterval = right[1].x + right[1].width / 2 - (right[0].x + right[0].width / 2);
        const rightSecondInterval = right[2].x + right[2].width / 2 - (right[1].x + right[1].width / 2);
        return Math.abs(leftFirstInterval - leftSecondInterval) - Math.abs(rightFirstInterval - rightSecondInterval);
      })[0];

    const firstInterval = slotList[1].x + slotList[1].width / 2 - (slotList[0].x + slotList[0].width / 2);
    const secondInterval = slotList[2].x + slotList[2].width / 2 - (slotList[1].x + slotList[1].width / 2);
    if (Math.abs(firstInterval - secondInterval) > Math.min(firstInterval, secondInterval) * 0.35) slotList = [];
  }

  if (!slotList.length) {
    // ポップアップ内のポケモン画像を食材と誤認しないよう、食材円に近い間隔で並ぶ右側の2つを選ぶ。
    const averageSize = sortedFoodRow.reduce((sum, region) => sum + Math.max(region.width, region.height), 0)
      / sortedFoodRow.length;
    const pair = Array.from({ length: sortedFoodRow.length - 1 }, (_, index) => sortedFoodRow.slice(index, index + 2))
      .filter(([left, right]) => {
        const interval = right.x + right.width / 2 - (left.x + left.width / 2);
        return interval >= averageSize * 0.8 && interval <= averageSize * 1.8;
      })
      .at(-1);
    if (pair) slotList = pair;
  }

  if (slotList.length == 2) {
    // 名前ポップアップで1枠目の円が隠れる場合は、残る2枠の間隔から1枠目の領域だけを復元する。
    const [second, third] = slotList;
    const interval = (third.x + third.width / 2) - (second.x + second.width / 2);
    slotList = [{ ...second, x: second.x - interval, occluded: true }, second, third];
  }

  return slotList;
}

function setFoodNumberList(foodRecognitionList: FoodRecognition[], lineList: OcrLine[]) {
  const numberLineList = lineList.flatMap(line => {
    // 小さい個数表示では「x7」が「xア7」のようになるため、xと数字の間の誤認文字を許容する。
    const match = normalizeText(line.text).match(/^[x×][^0-9]*([0-9]+)/i);
    return match ? [{ line, num: Number(match[1]) }] : [];
  });

  for(const recognition of foodRecognitionList) recognition.num = null;
  for(const item of numberLineList) {
    const lineCenterX = (item.line.x0 + item.line.x1) / 2;
    const recognition = foodRecognitionList
      // 同じ「x2」を隣の2枠へ重複割当しないよう、数値側から最も近いアイコンを1つだけ選ぶ。
      .filter(candidate => item.line.y0 >= candidate.region.y + candidate.region.height * 0.35
        && item.line.y0 <= candidate.region.y + candidate.region.height * 1.5
        && Math.abs(lineCenterX - (candidate.region.x + candidate.region.width / 2)) <= candidate.region.width
      )
      .toSorted((left, right) =>
        Math.abs(lineCenterX - (left.region.x + left.region.width / 2))
          - Math.abs(lineCenterX - (right.region.x + right.region.width / 2))
      )[0];
    if (recognition) recognition.num = item.num;
  }
}

function createColorHistogram(
  canvas: HTMLCanvasElement,
  region?: ImageRegion,
  template = false,
) {
  const size = 48;
  const normalizedCanvas = createCanvas(size, size);
  const context = normalizedCanvas.getContext('2d', { willReadFrequently: true })!;
  context.clearRect(0, 0, size, size);

  if (region) {
    const side = Math.max(region.width, region.height) * 1.05;
    const centerX = region.x + region.width / 2;
    const centerY = region.y + region.height / 2;
    context.drawImage(canvas, centerX - side / 2, centerY - side / 2, side, side, 0, 0, size, size);
  } else {
    context.drawImage(canvas, 0, 0, size, size);
  }

  const { data } = context.getImageData(0, 0, size, size);
  const histogram = new Array(24).fill(0) as number[];
  for(let i = 0; i < data.length; i += 4) {
    const red = data[i] / 255;
    const green = data[i + 1] / 255;
    const blue = data[i + 2] / 255;
    const alpha = data[i + 3] / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const chroma = maximum - minimum;

    if (alpha < 0.2) continue;
    if (!template && red > 0.86 && green > 0.86 && blue > 0.72 && chroma < 0.2) continue;
    if (chroma < 0.08 && maximum > 0.65) continue;

    let hue = 0;
    if (chroma > 0) {
      if (maximum == red) hue = ((green - blue) / chroma + 6) % 6;
      else if (maximum == green) hue = (blue - red) / chroma + 2;
      else hue = (red - green) / chroma + 4;
      hue /= 6;
    }

    const saturation = maximum == 0 ? 0 : chroma / maximum;
    const weight = 0.25 + saturation;
    histogram[Math.min(11, Math.floor(hue * 12))] += weight;
    histogram[12 + Math.min(5, Math.floor(maximum * 6))] += weight;
    histogram[18 + Math.min(5, Math.floor(saturation * 6))] += weight;
  }

  const norm = Math.sqrt(histogram.reduce((sum, value) => sum + value * value, 0)) || 1;
  return histogram.map(value => value / norm);
}

function createNormalizedPixels(
  canvas: HTMLCanvasElement,
  region?: ImageRegion,
  template = false,
  minimumYRate = 0,
) {
  const size = 48;
  const normalizedCanvas = createCanvas(size, size);
  const context = normalizedCanvas.getContext('2d', { willReadFrequently: true })!;
  context.clearRect(0, 0, size, size);

  if (region) {
    const side = Math.max(region.width, region.height) * 1.05;
    const centerX = region.x + region.width / 2;
    const centerY = region.y + region.height / 2;
    context.drawImage(canvas, centerX - side / 2, centerY - side / 2, side, side, 0, 0, size, size);
  } else {
    context.drawImage(canvas, 0, 0, size, size);
  }

  const { data } = context.getImageData(0, 0, size, size);
  return Array.from({ length: size * size }, (_, index) => {
    const pixelIndex = index * 4;
    const red = data[pixelIndex] / 255;
    const green = data[pixelIndex + 1] / 255;
    const blue = data[pixelIndex + 2] / 255;
    const alpha = data[pixelIndex + 3] / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const chroma = maximum - minimum;
    const isBackground = Math.floor(index / size) / size < minimumYRate
      || alpha < 0.2
      || (!template && red > 0.86 && green > 0.86 && blue > 0.72 && chroma < 0.2)
      || (chroma < 0.08 && maximum > 0.65);
    return { red, green, blue, foreground: !isBackground };
  });
}

function getPixelSimilarity(
  source: ReturnType<typeof createNormalizedPixels>,
  template: ReturnType<typeof createNormalizedPixels>,
) {
  // 未解放枠ではアイコン全体が半透明になるため、原色テンプレートだけとの比較では別の淡色アイコンへ寄りやすい。
  // テンプレートを白背景へ複数段階で合成した場合も比較し、現在の解放レベルを座標や固定濃度から推測せず追従する。
  const side = Math.sqrt(source.length);
  const sourceForeground = source.filter(pixel => pixel.foreground).length;
  const templateForeground = template.filter(pixel => pixel.foreground).length;
  const opacityScoreList = [1, 0.75, 0.5, 0.35, 0.25].map(opacity =>
    Math.max(...[-3, 0, 3].flatMap(offsetY => [-3, 0, 3].map(offsetX => {
      let matched = 0;
      for(let sourceIndex = 0; sourceIndex < source.length; sourceIndex++) {
        if (!source[sourceIndex].foreground) continue;
        const sourceX = sourceIndex % side;
        const sourceY = Math.floor(sourceIndex / side);
        const templateX = sourceX + offsetX;
        const templateY = sourceY + offsetY;
        if (templateX < 0 || templateX >= side || templateY < 0 || templateY >= side) continue;
        const templatePixel = template[templateY * side + templateX];
        if (!templatePixel.foreground) continue;

        const templateRed = 1 - (1 - templatePixel.red) * opacity;
        const templateGreen = 1 - (1 - templatePixel.green) * opacity;
        const templateBlue = 1 - (1 - templatePixel.blue) * opacity;
        const colorDistance = (
          Math.abs(source[sourceIndex].red - templateRed)
          + Math.abs(source[sourceIndex].green - templateGreen)
          + Math.abs(source[sourceIndex].blue - templateBlue)
        ) / 3;
        matched += Math.max(0, 1 - colorDistance * 2.5);
      }

      // アイコン領域の検出位置には数pxの揺れがあるため、周辺へずらした中で最も形と色が合う位置を採る。
      return matched / Math.sqrt(Math.max(1, sourceForeground * templateForeground));
    })))
  );
  // 白いタマゴのように原色比較が有効なアイコンもあるため、原色側のスコアも一部残す。
  return opacityScoreList[0] * 0.25 + Math.max(...opacityScoreList) * 0.75;
}

function cosineSimilarity(left: number[], right: number[]) {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

async function recognizeFoodList(sourceCanvas: HTMLCanvasElement) {
  const slotList = selectFoodSlotRegions(findFoodCircleRegions(sourceCanvas));
  if (!slotList.length) return [];

  const templateList = await Promise.all(Food.list.map(async food => {
    const image = await loadImage(food.img);
    const canvas = drawImageToCanvas(image, image.naturalWidth, image.naturalHeight);
    return {
      name: food.name,
      histogram: createColorHistogram(canvas, undefined, true),
      pixels: createNormalizedPixels(canvas, undefined, true),
      lowerPixels: createNormalizedPixels(canvas, undefined, true, 0.62),
    };
  }));

  return slotList.map(region => {
    const histogram = createColorHistogram(sourceCanvas, region);
    // 復元した1枠目はポップアップの外へ出ている下端だけを比較し、重なったUIの色を判定から除外する。
    const pixels = createNormalizedPixels(sourceCanvas, region, false, region.occluded ? 0.62 : 0);
    const foregroundPixels = pixels.filter(pixel => pixel.foreground);
    const sourceChroma = foregroundPixels.reduce((sum, pixel) =>
      sum + Math.max(pixel.red, pixel.green, pixel.blue) - Math.min(pixel.red, pixel.green, pixel.blue), 0
    ) / Math.max(1, foregroundPixels.length);
    const matchList = templateList
      .map(template => {
        const histogramScore = cosineSimilarity(histogram, template.histogram);
        const pixelScore = getPixelSimilarity(pixels, region.occluded ? template.lowerPixels : template.pixels);
        return {
          name: template.name,
          score: region.occluded
            ? pixelScore
            : template.name == 'とくせんエッグ'
              // 白いタマゴは色ヒストグラムの情報が少ないため、輪郭が一致する場合は形状比較を優先する。
              ? Math.max(histogramScore * 0.35 + pixelScore * 0.65, histogramScore * 0.1 + pixelScore * 0.9)
                + 0.01 + (sourceChroma < 0.18 ? 0.08 : 0)
              : histogramScore * 0.35 + pixelScore * 0.65,
        };
      })
      .toSorted((a, b) => b.score - a.score);
    const bestMatch = matchList[0];
    const normalizedSide = Math.sqrt(pixels.length);
    const centerPixels = pixels.filter((_, index) => {
      const x = index % normalizedSide;
      const y = Math.floor(index / normalizedSide);
      return x >= normalizedSide * 0.2 && x < normalizedSide * 0.8
        && y >= normalizedSide * 0.2 && y < normalizedSide * 0.8;
    });
    // 円周の緑枠を除いた中央部に有色画素がなければ、アイコンではなく未設定の横線と判断できる。
    const foregroundRate = centerPixels.filter(pixel => pixel.foreground).length / centerPixels.length;
    const coloredForegroundRate = centerPixels.filter(pixel =>
      pixel.foreground && Math.max(pixel.red, pixel.green, pixel.blue) - Math.min(pixel.red, pixel.green, pixel.blue) >= 0.1
    ).length / centerPixels.length;
    // 未設定枠の横線はどの食材とも十分に似ない。後段の種族補正でも候補を捏造しないよう明示的に保持する。
    const empty = !region.occluded && (foregroundRate < 0.02 || coloredForegroundRate < 0.12);

    // 隠れた領域はわずかなUI色だけでも候補が出るため、十分な類似度がない場合は誤推定せず判定不能にする。
    const minimumScore = region.occluded ? 0.15 : 0.3;
    return {
      name: !empty && bestMatch && bestMatch.score >= minimumScore ? bestMatch.name : null,
      num: null,
      region,
      matchList,
      empty,
    };
  });
}

export default class PokemonStatusImageReader {
  #worker: Tesseract.Worker | null = null;

  async #getWorker(onProgress?: (status: string, progress: number) => void) {
    if (this.#worker) return this.#worker;

    // 学習データも同一サイトから取得し、画像や認識結果を外部サービスへ送らずブラウザー内で完結させる。
    const ocrAssetPath = new URL(`${import.meta.env.BASE_URL}ocr`, window.location.origin).href.replace(/\/$/, '');
    this.#worker = await Tesseract.createWorker('jpn', Tesseract.OEM.LSTM_ONLY, {
      workerPath: `${ocrAssetPath}/worker.min.js`,
      corePath: `${ocrAssetPath}/tesseract-core-lstm.wasm.js`,
      langPath: ocrAssetPath,
      gzip: false,
      logger: message => onProgress?.(message.status, message.progress),
    });
    await this.#worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
      preserve_interword_spaces: '1',
    });
    return this.#worker;
  }

  async read(source: Blob | string, onProgress?: (status: string, progress: number) => void) {
    const image = await loadImage(source);
    const sourceCanvas = drawImageToCanvas(image, image.naturalWidth, image.naturalHeight);
    const textCanvas = createTextCanvas(sourceCanvas);
    const worker = await this.#getWorker(onProgress);

    // 元画像は色付き文字、二値画像は枠内の文字に強いため、両方の結果を合わせて項目の欠落を減らす。
    const [rawResult, binaryResult, foodList] = await Promise.all([
      worker.recognize(sourceCanvas, {}, { text: true, blocks: true }),
      worker.recognize(textCanvas, {}, { text: true, blocks: true }),
      recognizeFoodList(sourceCanvas),
    ]);
    const greenOutlineRegionList = findGreenOutlineRegions(sourceCanvas);
    const sourceCoordinateRegionCanvas = createSourceCoordinateRegionCanvas(sourceCanvas, [
      ...greenOutlineRegionList,
      ...getFoodNumberRegionList(foodList, sourceCanvas),
    ]);
    const outlinedRegionResult = sourceCoordinateRegionCanvas
      ? await worker.recognize(sourceCoordinateRegionCanvas, {}, { text: true, blocks: true })
      : null;
    const primaryLineList = flattenLines(rawResult.data.blocks);
    const binaryLineList = flattenLines(binaryResult.data.blocks);
    setSubSkillRarity(primaryLineList, sourceCanvas);
    setSubSkillRarity(binaryLineList, sourceCanvas);
    const outlinedLineList = flattenLines(outlinedRegionResult?.data.blocks ?? null);
    setSubSkillRarity(outlinedLineList, sourceCanvas);
    setFoodNumberList(foodList, [...primaryLineList, ...binaryLineList, ...outlinedLineList]);

    // 小さい個数表示は通常OCRで落ちやすいため、3倍に拡大した領域を数字限定で再認識する。
    const foodNumberCanvas = createFoodNumberCanvas(sourceCanvas, foodList);
    if (foodNumberCanvas) {
      await worker.setParameters({
        tessedit_char_whitelist: 'xX×0123456789',
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
      });
      const foodNumberResult = await worker.recognize(foodNumberCanvas.canvas, {}, { blocks: true });
      setFoodNumberListFromCropped(
        foodList,
        flattenLines(foodNumberResult.data.blocks),
        foodNumberCanvas.sectionList,
      );
      // 次の画像の日本語OCRへ数字限定設定を持ち越さない。
      await worker.setParameters({ tessedit_char_whitelist: '' });
    }
    const lineList = [
      ...primaryLineList,
      ...binaryLineList,
      ...outlinedLineList,
    ];
    const rawText = `${rawResult.data.text}\n${binaryResult.data.text}\n${outlinedRegionResult?.data.text ?? ''}`;

    // 抽出画像も元画像の座標を維持しているため、レベルやサブスキルの位置判定へ利用できる。
    return parseData(rawText, lineList, foodList, primaryLineList, lineList);
  }

  async terminate() {
    await this.#worker?.terminate();
    this.#worker = null;
  }
}
