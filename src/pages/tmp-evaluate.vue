<script setup lang="ts">
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import Pokemon from '@/data/pokemon';
import Nature from '@/data/nature';
import SubSkill from '@/data/sub-skill';
import config from '@/models/config';
import MultiWorker from '@/models/multi-worker';
import { AsyncWatcher } from '@/models/async-watcher';
import PokemonStatusImageReader from '@/models/ocr/pokemon-status-image-reader';
import EvaluateTable from '@/models/simulation/evaluate-table';
import Popup from '@/models/popup/popup';
import PokemonListSimulator from '@/models/pokemon-box/pokemon-box-worker?worker';
import EvaluateSetting from '@/components/evaluate-setting.vue';
import FoodIconSelect from '@/components/form/food-icon-select.vue';
import FoodIconSelectList from '@/components/form/food-icon-select-list.vue';
import SubSkillSelect from '@/components/form/sub-skill-select.vue';
import NatureSelect from '@/components/form/nature-select.vue';
import PokemonEditPopup from '@/components/pokemon-edit-popup.vue';
import PokemonSelectPopup from '@/components/pokemon-select-popup.vue';
import BaseAlert from '@/components/alert/base-alert.vue';
import SettingButton from '@/components/design/setting-button.vue';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const activeTab = ref('pokemon');
const lvList = [30, 50, 60, 70, 80];
const tmpEvaluateLevelList = {
  10: false,
  25: false,
  30: true,
  50: true,
  60: true,
  70: true,
  80: true,
};
const pokemon = reactive({
  name: Pokemon.list[0].name,
  lv: 1,
  skillLv: 1,
  foodList: [null, null, null] as (string | null)[],
  subSkillList: [null, null, null, null, null] as (string | null)[],
  nature: Nature.list.find((x) => x.name === 'がんばりや')?.name ?? Nature.list[0].name,
  shiny: false,
  fix: null,
  index: -1,
});
const basePokemon = computed(() => Pokemon.map[pokemon.name]);
const foodSelectList = computed(() =>
  [0, 1, 2].map(
    (index) =>
      basePokemon.value?.foodList
        .filter((food) => food?.name && food.numList[index])
        .map((food) => food.name) ?? [],
  ),
);
const result = ref<any>(null);
const screenshotInput = ref<{ click: () => void } | null>(null);
const screenshotError = ref<string | null>(null);
const asyncWatcher = AsyncWatcher.init();
const worker = new MultiWorker(PokemonListSimulator, 1);
const imageReader = new PokemonStatusImageReader();
onBeforeUnmount(() => {
  worker.close();
  imageReader.terminate();
});

watch(
  () => pokemon.name,
  () => {
    pokemon.foodList = foodSelectList.value.map((list) => list[0] ?? null);
  },
);
pokemon.foodList = foodSelectList.value.map((list) => list[0] ?? null);

async function importScreenshot(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = Array.from(input.files ?? []).find((file) => file.type.startsWith('image/'));
  input.value = '';
  if (!file) return;

  screenshotError.value = null;
  try {
    await asyncWatcher.run(async (progressCounter) => {
      progressCounter.setName('スクリーンショットを解析しています');
      const imported = await imageReader.read(file, (status, progress) => {
        progressCounter.setName(status);
        progressCounter.set(progress);
      });
      if (!imported.pokemonName || !Pokemon.map[imported.pokemonName]) {
        throw new Error('ポケモンの種族を特定できませんでした。');
      }

      pokemon.name = imported.pokemonName;
      pokemon.shiny = imported.name === '色違い';
      await nextTick();
      pokemon.foodList = foodSelectList.value.map((foodList, index) => {
        const food = imported.foodList[index];
        return food != null && foodList.includes(food) ? food : (foodList[0] ?? null);
      });
      pokemon.subSkillList = Array.from({ length: 5 }, (_, index) =>
        imported.subSkillList[index] && SubSkill.map[imported.subSkillList[index]]
          ? imported.subSkillList[index]
          : null,
      );
      if (imported.nature && Nature.map[imported.nature]) pokemon.nature = imported.nature;
    });
  } catch (exception) {
    screenshotError.value =
      exception instanceof Error ? exception.message : 'スクリーンショットの解析に失敗しました。';
  }
}

async function evaluate() {
  result.value = null;
  await asyncWatcher.run(async (progressCounter) => {
    // 簡易診断表は食材・サブスキル・性格の全組み合わせを列挙するため、
    // 個体評価の進化先数だけではなく、実際の反復回数で全体進捗を配分する。
    const evolutionNum = Math.max(basePokemon.value?.afterList.length ?? 0, 1);
    const tableWorkWeight = EvaluateTable.getTemporarySimulationWorkWeight(pokemon.name);
    const pokemonWorkWeight = evolutionNum * lvList.length;
    const [tableProgress, pokemonProgress] = progressCounter.split(
      tableWorkWeight,
      pokemonWorkWeight,
    );
    const evaluateConfig = config.clone();
    // 簡易診断は設定画面の選択状態にかかわらず、常にグラフの5レベルを計算する。
    evaluateConfig.tmpEvaluate.levelList = tmpEvaluateLevelList;
    const table = await EvaluateTable.simulateTemporary(
      evaluateConfig,
      pokemon.name,
      tableProgress,
    );
    evaluateConfig.selectEvaluate = evaluateConfig.tmpEvaluate;
    evaluateConfig.sleepTime = evaluateConfig.tmpEvaluate.sleepTime;
    evaluateConfig.checkFreq = evaluateConfig.tmpEvaluate.checkFreq;
    evaluateConfig.workerNum = evaluateConfig.tmpEvaluate.workerNum;
    evaluateConfig.pureMint = false;
    const [workerSetupProgress, pokemonSimulationProgress] = pokemonProgress.split(1, 4);
    workerSetupProgress.setName('評価の準備をしています…');
    await worker.call(workerSetupProgress, () => ({ type: 'config', config: evaluateConfig }));
    pokemonSimulationProgress.setName('選択したポケモンを評価しています…');
    const [[simulatedPokemon]] = await worker.call(pokemonSimulationProgress, () => ({
      type: 'basic',
      pokemonList: [JSON.parse(JSON.stringify(pokemon))],
      evaluateTable: table,
    }));
    result.value = simulatedPokemon;
  });
}

function addToPokemonBox() {
  Popup.show(PokemonEditPopup, { initialPokemon: JSON.parse(JSON.stringify(pokemon)) });
}

async function selectPokemon() {
  const name = await Popup.show(PokemonSelectPopup, { selectedName: pokemon.name });
  if (name) pokemon.name = name;
}

const chartSeries = [
  { key: 'energy', label: '総合厳選度', color: '#bf6575' },
  { key: 'berry', label: 'きのみ厳選度', color: '#6cbd7f', specialty: 'きのみ' },
  { key: 'food', label: '食材厳選度', color: '#df8650', specialty: '食材' },
  { key: 'skill', label: 'スキル厳選度', color: '#3d73c9', specialty: 'スキル' },
];
const evolutionNameList = computed(() =>
  Object.keys(result.value?.evaluateResult?.[lvList[0]] ?? {}).filter((name) => name !== 'best'),
);

function createChartData(evolutionName: string) {
  const specialty = Pokemon.map[evolutionName]?.specialty;
  return {
    labels: lvList.map((lv) => `Lv${lv}`),
    datasets: chartSeries.map(({ key, label, color, specialty: seriesSpecialty }) => ({
      label,
      data: lvList.map((lv) =>
        Number(
          ((result.value?.evaluateResult?.[lv]?.[evolutionName]?.[key]?.rate ?? 0) * 100).toFixed(
            1,
          ),
        ),
      ),
      // 進化先のとくい以外は補助情報として薄く表示する。
      borderColor: seriesSpecialty != null && seriesSpecialty !== specialty ? `${color}66` : color,
      backgroundColor:
        seriesSpecialty != null && seriesSpecialty !== specialty ? `${color}66` : color,
      tension: 0.2,
    })),
  };
}

function formatEvaluateRate(evolutionName: string, lv: number, key: string) {
  return `${((result.value?.evaluateResult?.[lv]?.[evolutionName]?.[key]?.rate ?? 0) * 100).toFixed(1)}%`;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { min: 0, max: 100, ticks: { callback: (value) => `${value}%` } } },
};
</script>

<template>
  <AsyncWatcherArea class="page" :asyncWatcher="asyncWatcher">
    <BaseAlert>
      入力したポケモンが、全サブスキル・せいかくの組合せのうちどの程度上位に位置するかを評価します。<br />
      複数の個体の厳選度を比較したい場合は、「基準生成」ページで評価テーブルの生成を行った後、ボックスに対象ポケモンを追加してください。
    </BaseAlert>
    <TabList>
      <a :class="{ active: activeTab === 'pokemon' }" @click="activeTab = 'pokemon'">ポケモン</a>
      <a :class="{ active: activeTab === 'setting' }" @click="activeTab = 'setting'">設定</a>
    </TabList>

    <template v-if="activeTab === 'pokemon'">
      <div class="form">
          
        <div class="pokemon-tab-header">
          <FormButton @click="screenshotInput?.click()" class="from-screenshot">スクリーンショットから入力</FormButton>
          <InputFile
            ref="screenshotInput"
            class="screenshot-input"
            accept="image/*"
            @change="importScreenshot"
          />
        </div>
        <p v-if="screenshotError" class="screenshot-error">{{ screenshotError }}</p>
        
        <SettingSectionTitle type="field">ポケモン</SettingSectionTitle>
        <div>
          <SettingButton class="pokemon-select-button" @click="selectPokemon">
            <template #label>{{ pokemon.name }}</template>
          </SettingButton>
        </div>
        <SettingSectionTitle type="field">食材</SettingSectionTitle>
        <FoodIconSelectList class="food-inputs">
          <FoodIconSelect
            v-for="(list, index) in foodSelectList"
            v-model="pokemon.foodList[index]"
            :food-list="list"
          />
        </FoodIconSelectList>
        <SettingSectionTitle type="field">サブスキル</SettingSectionTitle>
        <SubSkillSelect v-model="pokemon.subSkillList" showCandidate />
        <SettingSectionTitle type="field">せいかく</SettingSectionTitle>
        <NatureSelect v-model="pokemon.nature" />
      </div>
      <FormButton class="execute" @click="evaluate">評価</FormButton>

      <section v-if="result" class="result">
        <div class="evolution-chart-list">
          <section
            v-for="evolutionName in evolutionNameList"
            :key="evolutionName"
            class="evolution-chart"
          >
            <h3>{{ evolutionName }}</h3>
            <div class="chart">
              <Line :data="createChartData(evolutionName)" :options="chartOptions" />
            </div>
            <div class="evaluate-rate-table-scroll">
              <DesignTable class="evaluate-rate-table">
                <thead>
                  <tr>
                    <th></th>
                    <th v-for="lv in lvList" :key="lv">Lv{{ lv }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="{ key, label } in chartSeries" :key="key">
                    <td>{{ label }}</td>
                    <td v-for="lv in lvList" :key="lv">
                      {{ formatEvaluateRate(evolutionName, lv, key) }}
                    </td>
                  </tr>
                </tbody>
              </DesignTable>
            </div>
          </section>
        </div>
        <FormButton class="execute box-add-button mt-5px" @click="addToPokemonBox">ボックスに追加</FormButton>
      </section>
    </template>
    <EvaluateSetting
      v-else
      :setting-config="config.tmpEvaluate"
      :evaluate-config="config.tmpEvaluate"
      is-tmp-evaluate
    >
      <template #append>
        <ToggleArea open>
          <template #headerText>簡易診断用の基準値</template>
          <SettingList>
            <div>
              <label>ヒーラー評価基準</label>
              <div>
                <InputNumber class="w-100px" v-model="config.tmpEvaluate.scoreForHealerEvaluate" />
              </div>
              <small>げんきオールなどの評価に使う、他のポケモンの1日エナジーです。</small>
            </div>
            <div>
              <label>サポート評価基準</label>
              <div>
                <InputNumber class="w-100px" v-model="config.tmpEvaluate.scoreForSupportEvaluate" />
              </div>
              <small
                >おてつだいサポートなどの評価に使う、他のポケモンの1回のおてつだい価値です。</small
              >
            </div>
          </SettingList>
        </ToggleArea>
      </template>
    </EvaluateSetting>
  </AsyncWatcherArea>
</template>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 1200px;
  margin-right: auto;
  position: relative;
}
.tab-list a {
  cursor: pointer;
}
.pokemon-tab-header {
  display: flex;
  justify-content: flex-end;
  position: absolute;
  top: 0;
  right: 12px;
}
.screenshot-input {
  display: none;
}
.screenshot-error {
  color: var(--color-danger);
  font-weight: bold;
}
.form {
  display: grid;
  grid-template-columns: max-content minmax(240px, 1fr);
  gap: 10px;
  align-items: center;
  max-width: 760px;
  position: relative;
}
.pokemon-select-button {
  justify-self: start;
  text-align: left;
}
.result {
  min-height: 360px;
}
.evolution-chart-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 16px;
}
.evolution-chart {
  min-width: 0;
}
.evolution-chart h3 {
  margin-bottom: 4px;
  font-size: 16px;
}
.chart {
  height: 280px;
}
.evaluate-rate-table-scroll {
  max-width: 100%;
  margin-top: 8px;
  overflow-x: auto;
}
.evaluate-rate-table {
  min-width: 300px;

  th,
  td {
    white-space: nowrap;
  }

  td:not(:first-child) {
    text-align: right;
  }
}
@media (max-width: 600px) {
  .page {
    height: auto;
    min-height: 100%;
    overflow: visible;
  }

  .form {
    grid-template-columns: 1fr;
  }
  .food-inputs {
    justify-content: flex-start;
  }
  .evolution-chart-list {
    grid-template-columns: minmax(0, 1fr);
  }
  .chart {
    height: 260px;
  }
}
</style>
