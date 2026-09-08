<script setup lang="ts">
import PokemonStatusImageReader, { type PokemonStatusImageResult } from '@/models/ocr/pokemon-status-image-reader';

const sampleImageList = Object.entries(import.meta.glob('../../test/ocr/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
}))
  .map(([path, url]) => ({
    name: path.split('/').pop() ?? path,
    url: url as string,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const reader = new PokemonStatusImageReader();
const result = ref<PokemonStatusImageResult | null>(null);
const previewUrl = ref<string | null>(null);
const loading = ref(false);
const progress = ref(0);
const status = ref('');
const error = ref<string | null>(null);
const batchCsv = ref('');
const batchCompleted = ref(0);

function escapeCsv(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function createBatchCsv(rowList: { fileName: string, result?: PokemonStatusImageResult, error?: string }[]) {
  const headerList = [
    'ファイル名', '名前', '推定ポケモン', 'Lv', 'おてつだい時間', '最大所持数',
    '食材1', '食材2', '食材3', 'メインスキル', 'メインスキルLv',
    'サブスキル1', 'サブスキル2', 'サブスキル3', 'サブスキル4', 'サブスキル5',
    'せいかく', 'エラー',
  ];
  const csvRowList = rowList.map(({ fileName, result, error }) => [
    fileName,
    result?.name,
    result?.pokemonName,
    result?.lv,
    result?.helpTime,
    result?.bag,
    ...Array.from({ length: 3 }, (_, index) => result?.foodList[index]),
    result?.mainSkillName,
    result?.mainSkillLv,
    ...Array.from({ length: 5 }, (_, index) => result?.subSkillList[index]),
    result?.nature,
    error,
  ]);
  return [headerList, ...csvRowList].map(row => row.map(escapeCsv).join(',')).join('\r\n');
}

async function analyzeAllImages() {
  loading.value = true;
  error.value = null;
  batchCsv.value = '';
  batchCompleted.value = 0;
  const rowList = new Array<{ fileName: string, result?: PokemonStatusImageResult, error?: string }>(sampleImageList.length);
  let nextIndex = 0;
  const batchReaderList = [reader, new PokemonStatusImageReader(), new PokemonStatusImageReader()];

  // OCRはCPU負荷が高いため3ワーカーまでに抑えて並列化し、ファイル数が増えても直列待ちが長くなりすぎないようにする。
  await Promise.all(batchReaderList.map(async batchReader => {
    while(nextIndex < sampleImageList.length) {
      const index = nextIndex++;
      const image = sampleImageList[index];
      progress.value = 0;
      status.value = `${batchCompleted.value}/${sampleImageList.length}件完了: ${image.name}を解析中`;
      try {
        const imageResult = await batchReader.read(image.url, (nextStatus, nextProgress) => {
          status.value = `${batchCompleted.value}/${sampleImageList.length}件完了: ${image.name} ${nextStatus}`;
          progress.value = nextProgress;
        });
        rowList[index] = { fileName: image.name, result: imageResult };
      } catch (exception) {
        rowList[index] = {
          fileName: image.name,
          error: exception instanceof Error ? exception.message : '画像の解析に失敗しました。',
        };
      }
      batchCompleted.value++;
    }
  }));
  await Promise.all(batchReaderList.slice(1).map(batchReader => batchReader.terminate()));

  batchCsv.value = createBatchCsv(rowList);
  status.value = `${sampleImageList.length}件の解析が完了しました`;
  progress.value = 1;
  loading.value = false;
}

function downloadBatchCsv() {
  if (!batchCsv.value) return;
  // Excelで日本語を文字化けさせないため、ダウンロード時だけUTF-8のBOMを付ける。
  const url = URL.createObjectURL(new Blob([`\uFEFF${batchCsv.value}`], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'ocr-analysis-results.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

async function readImage(source: Blob | string) {
  loading.value = true;
  progress.value = 0;
  status.value = '画像を準備しています';
  error.value = null;
  result.value = null;

  if (previewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = typeof source == 'string' ? source : URL.createObjectURL(source);

  try {
    result.value = await reader.read(source, (nextStatus, nextProgress) => {
      status.value = nextStatus;
      progress.value = nextProgress;
    });
  } catch (exception) {
    console.error(exception);
    error.value = exception instanceof Error ? exception.message : '画像の解析に失敗しました。';
  } finally {
    loading.value = false;
  }
}

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) readImage(file);
}

function onPaste(event: ClipboardEvent) {
  if (loading.value) return;

  const image = Array.from(event.clipboardData?.files ?? [])
    .find((file) => file.type.startsWith('image/'));

  if (!image) return;

  event.preventDefault();
  readImage(image);
}

onMounted(() => {
  document.addEventListener('paste', onPaste);
});

onBeforeUnmount(() => {
  if (previewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value);
  document.removeEventListener('paste', onPaste);
  reader.terminate();
});
</script>

<template>
  <div class="ocr-test">
    <h2>ポケモン詳細画像 読み取りテスト</h2>

    <div class="input-area">
      <input type="file" accept="image/*" :disabled="loading" @change="onFileChange">
      <span class="paste-hint">画像を貼り付け（Ctrl+V / ⌘V）</span>
      <button type="button" :disabled="loading" data-testid="analyze-all" @click="analyzeAllImages">
        全画像を解析
      </button>
      <button type="button" :disabled="!batchCsv || loading" @click="downloadBatchCsv">
        CSVをダウンロード
      </button>
    </div>

    <div class="sample-list">
      <button
        v-for="image in sampleImageList"
        :key="image.name"
        class="sample-image"
        :disabled="loading"
        @click="readImage(image.url)"
      >
        <span class="sample-thumbnail">
          <img :src="image.url" :alt="`${image.name} のサムネイル`">
        </span>
        <span class="sample-name">{{ image.name }}</span>
      </button>
    </div>

    <div v-if="loading" class="progress-area">
      <progress :value="progress" max="1"></progress>
      <span>{{ status }} {{ Math.round(progress * 100) }}%</span>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <textarea
      v-if="batchCsv"
      class="batch-csv"
      data-testid="batch-csv"
      readonly
      :value="batchCsv"
      :aria-label="`${batchCompleted}件のOCR解析CSV`"
    ></textarea>

    <div class="result-area">
      <img v-if="previewUrl" class="preview" :src="previewUrl" alt="読み取り対象のポケモン詳細画像">

      <div v-if="result" class="result">
        <table>
          <tbody>
            <tr><th>名前</th><td>{{ result.name ?? '判定できませんでした' }}</td></tr>
            <tr><th>推定ポケモン</th><td>{{ result.pokemonName ?? '判定できませんでした' }}</td></tr>
            <tr><th>Lv</th><td>{{ result.lv ?? '判定できませんでした' }}</td></tr>
            <tr><th>おてつだい時間</th><td>{{ result.helpTime ?? '判定できませんでした' }}</td></tr>
            <tr><th>最大所持数</th><td>{{ result.bag ?? '判定できませんでした' }}</td></tr>
            <tr>
              <th>食材</th>
              <td>
                <ul>
                  <li v-for="(food, index) in result.foodList" :key="`${index}-${food}`">
                    {{ food ?? '判定できませんでした' }}
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>メインスキル</th>
              <td>
                {{ result.mainSkillName ?? '判定できませんでした' }}
                {{ result.mainSkillLv == null ? '' : ` Lv${result.mainSkillLv}` }}
              </td>
            </tr>
            <tr>
              <th>サブスキル</th>
              <td><ul><li v-for="subSkill in result.subSkillList" :key="subSkill">{{ subSkill }}</li></ul></td>
            </tr>
            <tr><th>せいかく</th><td>{{ result.nature ?? '判定できませんでした' }}</td></tr>
          </tbody>
        </table>

        <details>
          <summary>OCRの生データ</summary>
          <pre>{{ result.rawText }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ocr-test {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 1100px;
  margin: 0 auto;

  .input-area {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  button {
    padding: 6px 12px;
  }

  .paste-hint {
    display: flex;
    align-items: center;
    color: #555;
  }

  .batch-csv {
    width: 100%;
    min-height: 160px;
    font-size: 12px;
  }

  .sample-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, 150px);
    gap: 12px;
  }

  .sample-image {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 150px;
    padding: 0;
    border: 1px solid #aaa;
    background: white;
    text-align: left;

    &:not(:disabled) {
      cursor: pointer;
    }

    .sample-thumbnail {
      display: block;
      width: 150px;
      height: 75px;
      overflow: hidden;

      img {
        display: block;
        width: 300px;
        max-width: none;
        height: auto;
      }
    }

    .sample-name {
      padding: 0 6px 6px;
      overflow-wrap: anywhere;
    }
  }

  .progress-area {
    display: flex;
    align-items: center;
    gap: 8px;

    progress {
      width: min(300px, 60vw);
    }
  }

  .error {
    color: #c00;
  }

  .result-area {
    display: grid;
    grid-template-columns: minmax(240px, 380px) minmax(300px, 1fr);
    align-items: start;
    gap: 16px;
  }

  .preview {
    width: 100%;
    max-height: 70vh;
    object-fit: contain;
    object-position: top;
  }

  table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 6px 8px;
      border: 1px solid #aaa;
      text-align: left;
      vertical-align: top;
    }

    th {
      width: 9em;
      background: #eee;
    }
  }

  ul {
    margin: 0;
    padding-left: 1.5em;
  }

  details {
    margin-top: 12px;

    pre {
      overflow: auto;
      max-height: 300px;
      padding: 8px;
      background: #eee;
      white-space: pre-wrap;
    }
  }
}

@media (max-width: 700px) {
  .ocr-test .result-area {
    grid-template-columns: 1fr;
  }
}
</style>
