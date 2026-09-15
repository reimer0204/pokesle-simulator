<script setup lang="ts">
import InputCheckbox from '@/components/form/input-checkbox.vue';
import EvaluateResult from '@/components/page-assist/index/evaluate-result.vue';
import SortableTable from '@/components/sortable-table.vue';
import { Food } from '@/data/food_and_cooking';
import Nature from '@/data/nature';
import Pokemon from '@/data/pokemon';
import SubSkill from '@/data/sub-skill';
import config from '@/models/config';
import MultiWorker from '@/models/multi-worker';
import PokemonBox from '@/models/pokemon-box/pokemon-box';
import PokemonBoxWorker from '@/models/pokemon-box/pokemon-box-worker?worker';
import PokemonStatusImageReader, { type PokemonStatusImageResult } from '@/models/ocr/pokemon-status-image-reader';
import ProgressCounter from '@/models/progress-counter';
import EvaluateTable from '@/models/simulation/evaluate-table';
import type { SimulatedPokemon } from '@/type';
import { useRouter } from 'vue-router';

type ImportRow = {
  id: number,
  fileName: string,
  selected: boolean,
  shiny: boolean,
  result: PokemonStatusImageResult | null,
  box: any | null,
  simulatedPokemon: SimulatedPokemon | null,
  hitCheckList: any[],
  error: string | null,
};

const router = useRouter();
const rowList = ref<ImportRow[]>([]);
const loading = ref(false);
const completed = ref(0);
const status = ref('');
const worker = new MultiWorker(PokemonBoxWorker);

type EvaluateType = 'energy' | 'specialty';
type EvaluateLv = number | 'max';

// ポケモン編集画面と同じく、最大値に加えて基準生成で有効なレベルをすべて表示する。
const evaluateLvList: EvaluateLv[] = [
  'max',
  ...Object.entries(config.selectEvaluate.levelList)
    .filter(([_, enabled]) => enabled)
    .map(([lv]) => Number(lv))
    .sort((a, b) => a - b),
];

function getEvaluateScore(row: ImportRow, type: EvaluateType, lv: EvaluateLv) {
  return row.simulatedPokemon?.evaluateResult?.[lv]?.best?.[type]?.score ?? null;
}

const evaluateColumnList = [
  { type: 'energy' as EvaluateType, name: '厳選度' },
  { type: 'specialty' as EvaluateType, name: 'とくい厳選度' },
].flatMap(({ type, name }) => evaluateLvList.map(lv => ({
  key: `${type}Score_${lv}`,
  name: `${name}\n(${lv == 'max' ? '最大' : `Lv${lv}`})`,
  percent: true,
  template: 'evaluate',
  evaluateType: type,
  lv,
  convert: (row: ImportRow) => getEvaluateScore(row, type, lv),
})));

const columnList = [
  { key: 'selected', name: '', type: Boolean },
  { key: 'pokemonName', name: 'ポケモン', type: String, convert: (row: ImportRow) => row.result?.pokemonName ?? '' },
  { key: 'lv', name: 'Lv', type: Number, convert: (row: ImportRow) => row.result?.lv },
  { key: 'foodList', name: '食材構成' },
  { key: 'skillLv', name: 'スキル\nLv', type: Number, convert: (row: ImportRow) => row.result?.mainSkillLv },
  { key: 'subSkillList', name: 'サブスキル' },
  { key: 'nature', name: 'せいかく', type: String, convert: (row: ImportRow) => row.result?.nature ?? '' },
  { key: 'hitCheckList', name: 'チェックリスト', type: Number, convert: (row: ImportRow) => row.hitCheckList.length },
  ...evaluateColumnList,
];

const selectedRowList = computed(() => rowList.value.filter(row => row.selected && row.box));

function createBox(result: PokemonStatusImageResult, index: number) {
  const pokemon = result.pokemonName ? Pokemon.map[result.pokemonName] : null;
  if (!pokemon) throw new Error('ポケモンの種族を特定できませんでした。');
  if (!result.lv) throw new Error('レベルを取得できませんでした。');
  if (!result.nature || !Nature.map[result.nature]) throw new Error('せいかくを取得できませんでした。');
  if (!pokemon.kaihou && result.foodList.some(food => !food || !Food.map[food])) {
    throw new Error('食材構成を取得できませんでした。');
  }
  if (!pokemon.kaihou && result.subSkillList.length < 5) {
    throw new Error('サブスキルを5件取得できませんでした。');
  }

  return {
    index,
    name: pokemon.name,
    lv: result.lv,
    skillLv: result.mainSkillLv ?? 1,
    foodList: result.foodList,
    subSkillList: result.subSkillList,
    nature: result.nature,
    shiny: result.name == '色違い',
  };
}

async function evaluateRows() {
  const targetRowList = rowList.value.filter(row => row.box);
  if (!targetRowList.length) return;

  status.value = '厳選度とチェックリストを計算しています';
  const evaluateTable = await EvaluateTable.load(config);
  const simulatedPokemonList = await PokemonBox.simulation(
    // rowListへ格納したboxはVueのProxyになるため、Workerへ送信できるプレーンデータへ戻す。
    targetRowList.map(row => JSON.parse(JSON.stringify(row.box))),
    worker,
    evaluateTable,
    { ...config, cleaning: true },
    new ProgressCounter(),
  );
  const simulatedPokemonMap = new Map(simulatedPokemonList.map(pokemon => [pokemon.box?.index, pokemon]));

  for(const row of targetRowList) {
    const simulatedPokemon = simulatedPokemonMap.get(row.box.index);
    if (!simulatedPokemon) continue;
    row.simulatedPokemon = simulatedPokemon;
    // ボックス整理画面の「整理備考」と同じ判定結果を表示するため、Workerが個体ごとに計算した結果をそのまま使う。
    row.hitCheckList = simulatedPokemon.hitCheckList ?? [];
  }
}

async function analyzeFiles(fileList: File[]) {
  loading.value = true;
  completed.value = 0;
  status.value = '画像を解析しています';
  rowList.value = fileList.map((file, index) => ({
    id: index,
    fileName: file.name,
    selected: false,
    shiny: false,
    result: null,
    box: null,
    simulatedPokemon: null,
    hitCheckList: [],
    error: null,
  }));

  const readerList = Array.from(
    { length: Math.min(3, fileList.length) },
    () => new PokemonStatusImageReader(),
  );
  let nextIndex = 0;

  try {
    // 選択順を維持したまま解析だけを並列化し、多数選択時の待ち時間を短縮する。
    await Promise.all(readerList.map(async reader => {
      while(nextIndex < fileList.length) {
        const index = nextIndex++;
        const row = rowList.value[index];
        status.value = `${completed.value}/${fileList.length}件完了: ${fileList[index].name}を解析中`;
        try {
          row.result = await reader.read(fileList[index]);
          row.box = createBox(row.result, index);
          row.shiny = row.box.shiny;
          row.selected = true;
        } catch (exception) {
          row.error = exception instanceof Error ? exception.message : '画像の解析に失敗しました。';
        }
        completed.value++;
      }
    }));
    await evaluateRows();
    status.value = `${fileList.length}件の解析が完了しました`;
  } catch (exception) {
    console.error(exception);
    status.value = exception instanceof Error ? exception.message : '解析結果の計算に失敗しました。';
  } finally {
    await Promise.all(readerList.map(reader => reader.terminate()));
    loading.value = false;
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const fileList = Array.from(input.files ?? []).filter(file => file.type.startsWith('image/'));
  if (fileList.length) analyzeFiles(fileList);
  // 同じ画像を選び直した場合にもchangeが発火するよう、選択内容は処理開始後にクリアする。
  input.value = '';
}

function reverseRows() {
  rowList.value = rowList.value.toReversed();
}

function saveSelectedPokemon() {
  // スクショは最新順で並ぶ想定なので、下から追加してボックス内でも新しい個体が後から登録される順序にする。
  for(const row of selectedRowList.value.toReversed()) {
    PokemonBox.post({ ...row.box, index: undefined, shiny: row.shiny });
  }
  router.push('/');
}

onBeforeUnmount(() => {
  worker.close();
});
</script>

<template>
  <div class="screenshot-import-page">
    <h2>スクショから追加</h2>

    <div class="file-input-area">
      <label>
        ポケモン詳細のスクリーンショット
        <InputFile type="file" accept="image/*" multiple :disabled="loading" @change="onFileChange" />
      </label>
    </div>

    <template v-if="rowList.length">
      <div v-if="loading" class="progress-area">
        <progress :value="completed" :max="rowList.length"></progress>
        <span>{{ status }}</span>
      </div>

      <SortableTable
        class="result-table"
        :dataList="rowList"
        :columnList="columnList"
        :fixColumn="2"
        :disabledColumn="row => !!row.error"
        selectedField="selected"
      >
        <template #selected="{ data }">
          <InputCheckbox v-model="data.selected" :disabled="!!data.error" />
        </template>

        <template #pokemonName="{ data }">
          <div class="pokemon-name">
            <strong>{{ data.result?.pokemonName ?? '判定できませんでした' }}</strong>
            <InputCheckbox v-model="data.shiny" :disabled="!!data.error">色違い</InputCheckbox>
            <small v-if="data.error" class="error">{{ data.error }}</small>
          </div>
        </template>

        <template #foodList="{ data }">
          <div class="food-list">
            <div v-for="(food, index) in data.result?.foodList ?? []" :key="index" class="food">
              <img v-if="food && Food.map[food]" :src="Food.map[food].img" :alt="food">
              <span>{{ food ?? '―' }}</span>
            </div>
          </div>
        </template>

        <template #subSkillList="{ data }">
          <div class="sub-skill-list">
            <SubSkillLabel
              v-for="subSkill in data.result?.subSkillList ?? []"
              :key="subSkill"
              :subSkill="SubSkill.map[subSkill]"
            />
          </div>
        </template>

        <template #nature="{ data }">
          <NatureInfo v-if="data.result?.nature" :nature="Nature.map[data.result.nature]" />
        </template>

        <template #hitCheckList="{ data }">
          <div class="checked-list">
            <span v-if="data.shiny && config.pokemonList.cleaning.shinyLock">色違い</span>
            <template v-for="({ type, food, skill }, index) in data.hitCheckList" :key="index">
              <span v-if="type == 'pokemon'">厳選度</span>
              <img v-else-if="type == 'food'" :src="food.img" :alt="food.name">
              <span v-else-if="type == 'skill'">{{ skill.name }}</span>
            </template>
            <span v-if="!loading && !data.error && !data.hitCheckList.length && !(data.shiny && config.pokemonList.cleaning.shinyLock)">該当なし</span>
          </div>
        </template>

        <template #evaluate="{ data, column }">
          <!-- ポケモン編集画面と同じ表示部品を使い、レベルごとの最適な進化先と厳選度を同じ形式で表示する。 -->
          <EvaluateResult
            v-if="data.simulatedPokemon"
            :pokemon="data.simulatedPokemon"
            :lv="column.lv"
            :type="column.evaluateType"
          />
        </template>
      </SortableTable>

      <div class="actions">
        <p>最新のポケモンが一番上に来るようにしてください。</p>
        <FormButton type="button" :disabled="loading" @click="reverseRows">順番を逆にする</FormButton>
        <FormButton
          type="button"
          class="save-button"
          :disabled="loading || selectedRowList.length == 0"
          @click="saveSelectedPokemon"
        >
          選択したポケモン{{ selectedRowList.length }}匹を保存
        </FormButton>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.screenshot-import-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;

  .file-input-area label,
  .progress-area,
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .progress-area progress {
    width: min(300px, 100%);
  }

  .result-table {
    min-width: 0;
    max-width: 100%;
  }

  .pokemon-name,
  .food-list,
  .checked-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .checked-list img {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }

  .food {
    display: flex;
    align-items: center;
    gap: 3px;

    img {
      width: 22px;
      height: 22px;
      object-fit: contain;
    }
  }

  .sub-skill-list {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    max-width: 260px;
  }

  .error {
    color: #d22;
    max-width: 180px;
  }

  .actions {
    align-items: flex-start;
    flex-direction: column;

    p {
      margin: 0;
    }
  }

  .save-button {
    min-width: 220px;
  }
}

@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .screenshot-import-page {
    font-size: 12px;

    h2 {
      font-size: 18px;
      margin: 4px 0;
    }

    .file-input-area input {
      display: block;
      max-width: 100%;
      margin-top: 5px;
    }
  }
}
</style>
