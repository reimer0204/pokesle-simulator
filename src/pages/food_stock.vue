<script setup lang="ts">
import DesignTable from '../components/design-table.vue';
import ResultSummaryCard from '../components/result-summary-card.vue';
import CookingSettingPopup from '../components/cooking-setting-popup.vue';
import AsyncWatcherArea from '../components/util/async-watcher-area.vue';
import SettingList from '../components/util/setting-list.vue';
import { Cooking, Food } from '../data/food_and_cooking.ts';
import { AsyncWatcher } from '../models/async-watcher.js';
import config from '../models/config.ts';
import MultiWorker from '../models/multi-worker.js';
import Popup from '../models/popup/popup.ts';
import FoodStockWorker from '../models/simulation/food-stock-worker?worker';
import type { CookingTypeName, FoodName } from '../type.ts';

type FoodNumMap = Partial<Record<FoodName, number>>;
type CookingPlan = { cookingList: { name: string, num: number, foodNumMap: FoodNumMap, energy: number }[], energy: number };
type FoodStockResult = {
  score: number;
  foodNumMap: FoodNumMap;
  totalFoodNum: number;
  plans: Record<CookingTypeName, CookingPlan>;
};

const cookingTypes: CookingTypeName[] = ['カレー', 'サラダ', 'デザート'];
const result = ref<FoodStockResult | null>(null);
const errorMessage = ref('');
const asyncWatcher = AsyncWatcher.init();
const foodStockWorker = new MultiWorker(FoodStockWorker, config.workerNum);

onBeforeUnmount(() => foodStockWorker.close());
onMounted(calculate);

const threeTypeGeometricMean = computed(() => result.value == null ? 0 : Math.pow(
  cookingTypes.reduce((product, type) => product * result.value!.plans[type].energy, 1),
  1 / cookingTypes.length,
));
const cookingList = computed(() => Cooking.getEnableCookingList({
  ...config,
  simulation: {
    ...config.simulation,
    // 食材準備はチーム編成用の料理育成モードに影響されない。
    mode: 0,
  },
}).filter(cooking =>
  !config.foodStock.excludeMaxRecipeLv
  || config.simulation.cookingSettings[cooking.name].lv < Cooking.maxRecipeLv,
));
const disabledCookingNum = computed(() => Cooking.list.length - cookingList.value.length);
const surplusFoodNum = computed(() => Math.max(Math.floor(Number(config.foodStock.surplusFoodNum) || 0), 0));
const surplusCookingList = computed(() => Object.fromEntries(cookingTypes.map(type => [
  type,
  result.value == null ? [] : cookingList.value
    .filter(cooking => cooking.type == type && cooking.foodNum > 0 && cooking.foodList.every(food => getFoodDifference(food.name) + surplusFoodNum.value >= food.num))
    .toSorted((a, b) => b.fixEnergy - a.fixEnergy),
])));
const maxCandidateNum = computed(() => {
  const targetCookingTypes = cookingTypes.filter(type => config.foodStock.weight[type] > 0);
  if (targetCookingTypes.length == 0) return 0;
  return Math.min(...targetCookingTypes.map(type => cookingList.value.filter(cooking =>
    cooking.type == type
    && cooking.foodNum >= Math.max(Number(config.foodStock.minFoodNum) || 0, 0)
    && cooking.foodNum <= Math.max(Number(config.foodStock.maxFoodNum) || 0, 0),
  ).length));
});
function getCookingCount(type: CookingTypeName) {
  return result.value?.plans[type].cookingList.reduce((sum, item) => sum + item.num, 0) ?? 0;
}
function getFoodDifference(foodName: FoodName) {
  const stockedFoodNum = config.foodUnlimited ? 9999 : Number(config.foodDefaultNum[foodName]) || 0;
  return stockedFoodNum - (result.value?.foodNumMap[foodName] ?? 0);
}

async function calculate() {
  const bag = Math.max(Math.floor(Number(config.foodStock.bagSize) || 0), 0);
  const meals = Math.min(Math.max(Math.floor(Number(config.foodStock.cookingNum) || 1), 1), 21);
  const candidates = Math.min(Math.max(Math.floor(Number(config.foodStock.candidateNum) || 1), 1), maxCandidateNum.value);
  result.value = null;
  errorMessage.value = '';
  if (cookingTypes.every(type => config.foodStock.weight[type] <= 0)) {
    errorMessage.value = 'いずれかの料理種類の重みを1%以上にしてください。';
    return;
  }
  if (maxCandidateNum.value == 0) {
    errorMessage.value = '必要食材数の条件に該当する料理がない種類があります。';
    return;
  }

  await asyncWatcher.run(async progressCounter => {
    const workerResultList = await foodStockWorker.call(progressCounter, workerIndex => ({
      bagSize: bag,
      cookingNum: meals,
      candidateNum: candidates,
      minFoodNum: Math.max(Math.floor(Number(config.foodStock.minFoodNum) || 0), 0),
      maxFoodNum: Math.max(Math.floor(Number(config.foodStock.maxFoodNum) || 0), 0),
      weights: JSON.parse(JSON.stringify(config.foodStock.weight)),
      cookingList: cookingList.value.map(cooking => ({
        name: cooking.name,
        type: cooking.type,
        foodNum: cooking.foodNum,
        foodList: cooking.foodList,
        energy: cooking.fixEnergy,
      })),
      seed: Date.now() + workerIndex * 100003,
    }));
    result.value = workerResultList.filter(x => x != null).sort((a, b) => b.score - a.score)[0] ?? null;
    if (result.value == null) errorMessage.value = '食材バッグ容量内に、各種類の料理回数分を収める組み合わせがありません。';
  });
}
</script>

<template>
  <div class="page food-stock-page">
    <AsyncWatcherArea class="flex-column-start-stretch gap-10px" :asyncWatcher="asyncWatcher">
      <div class="flex-row-start-center flex-wrap gap-5px">
        <SettingButton @click="Popup.show(CookingSettingPopup, { ignoreCookingMode: true })" :important="disabledCookingNum > 0">
          <template #label>
            <div class="inline-flex-row-center">
              料理設定
              <template v-if="disabledCookingNum">(無効:{{ disabledCookingNum }}種)</template>
            </div>
          </template>
        </SettingButton>
        <InputCheckbox v-model="config.foodStock.excludeMaxRecipeLv">カンスト除外</InputCheckbox>
      </div>

      <SettingList class="align-self-stretch">
        <div class="flex-column-start-stretch">
          <label>種類別重み設定</label>
          <div>
            <div class="flex-row-start-center flex-wrap gap-10px">
              <label v-for="type in cookingTypes" :key="type" class="flex-row-start-center gap-3px">
                {{ type }}：<InputNumber v-model.number="config.foodStock.weight[type]" type="number" min="0" class="w-50px" />%
              </label>
            </div>
            <small>0%の種類は最適化の対象外です。週の出現しやすさに合わせて比重を調整できます。</small>
          </div>
        </div>
        <div><label>食材バッグ</label><div><InputNumber v-model.number="config.foodStock.bagSize" type="number" min="0" class="w-80px" /> 個</div></div>
        <div><label>料理回数</label><div>最大 <InputNumber v-model.number="config.foodStock.cookingNum" type="number" min="1" max="21" class="w-50px" /> 食</div></div>
        <div><label>料理候補</label><div class="flex-row-start-center flex-wrap gap-10px"><span>エナジー上位 <InputNumber v-model.number="config.foodStock.candidateNum" type="number" min="1" :max="Math.max(maxCandidateNum, 1)" class="w-50px" /> 件</span><span>必要食材数 <InputNumber v-model.number="config.foodStock.minFoodNum" type="number" min="0" class="w-50px" /> 個以上</span><span>必要食材数 <InputNumber v-model.number="config.foodStock.maxFoodNum" type="number" min="0" class="w-50px" /> 個以下</span></div></div>
      </SettingList>

      <div class="flex-row-start-center gap-10px">
        <FormButton class="execute" :disabled="asyncWatcher.executing" @click="calculate">{{ asyncWatcher.executing ? '計算中…' : '準備食材を計算' }}</FormButton>
      </div>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <template v-if="result">
        <section>
          <h2>準備する食材（{{ result.totalFoodNum.toLocaleString() }} / {{ Math.max(config.foodStock.bagSize, 0).toLocaleString() }} 個）</h2>
          <div class="table-scroll desktop-result-table">
            <DesignTable><thead><tr>
              <th>料理の種類</th><th>料理名</th><th>回数</th>
              <th v-for="food in Food.list" :key="food.name" :title="food.name"><img :src="food.img" :alt="food.name"></th>
              <th>種類合計エナジー</th>
            </tr></thead><tbody>
              <template v-for="type in cookingTypes" :key="type">
                <template v-if="result.plans[type].cookingList.length">
                  <tr v-for="(item, index) in result.plans[type].cookingList" :key="`${type}-${item.name}`">
                    <th v-if="index == 0" :rowspan="result.plans[type].cookingList.length">{{ type }}</th>
                    <td>{{ item.name }}</td>
                    <td class="text-align-right">{{ item.num }}食</td>
                    <td v-for="food in Food.list" :key="food.name" class="text-align-right">{{ item.foodNumMap[food.name]?.toLocaleString() }}</td>
                    <td v-if="index == 0" :rowspan="result.plans[type].cookingList.length" class="text-align-right">{{ result.plans[type].energy.toLocaleString() }}</td>
                  </tr>
                </template>
                <tr v-else>
                  <th>{{ type }}</th><td :colspan="Food.list.length + 3">重みが0%のため、最適化の対象外です。</td>
                </tr>
              </template>
              <tr class="total-row">
                <th colspan="3">準備食材量（3種類の相乗平均）</th>
                <td v-for="food in Food.list" :key="food.name" class="text-align-right">{{ result.foodNumMap[food.name]?.toLocaleString() }}</td>
                <td class="text-align-right">{{ Math.round(threeTypeGeometricMean).toLocaleString() }}</td>
              </tr>
              <tr>
                <th colspan="3">所持食材</th>
                <td v-for="food in Food.list" :key="food.name">
                  <InputNumber
                    v-if="!config.foodUnlimited"
                    type="number"
                    hide-spinner
                    class="w-40px"
                    :model-value="config.foodDefaultNum[food.name]"
                    @update:model-value="config.foodDefaultNum[food.name] = $event ?? 0"
                   />
                  <InputNumber v-else type="number" hide-spinner class="w-40px" :model-value="9999" disabled />
                </td>
                <td></td>
              </tr>
              <tr>
                <th colspan="3">所持数との差分</th>
                <td
                  v-for="food in Food.list"
                  :key="food.name"
                  class="text-align-right"
                  :class="{ shortage: getFoodDifference(food.name) < 0 }"
                >{{ getFoodDifference(food.name).toLocaleString() }}</td>
                <td></td>
              </tr>
            </tbody></DesignTable>
          </div>
          <div class="mobile-result-list">
            <ResultSummaryCard
              v-for="type in cookingTypes"
              :key="type"
              :title="type"
              :summary="result.plans[type].cookingList.length ? `合計 ${result.plans[type].energy.toLocaleString()}` : ''"
            >
              <template v-if="result.plans[type].cookingList.length">
                <div v-for="item in result.plans[type].cookingList" :key="`${type}-${item.name}`" class="cooking-plan-item">
                  <b>{{ item.name }}</b>
                  <span>{{ item.num }}食</span>
                </div>
              </template>
              <p v-else class="cooking-plan-empty">重みが0%のため、最適化の対象外です。</p>
            </ResultSummaryCard>

            <ResultSummaryCard class="mobile-summary" title="準備食材量" :summary="`3種類の相乗平均：${Math.round(threeTypeGeometricMean).toLocaleString()}`" />
            <DesignTable class="compact-food-table">
              <colgroup><col><col style="width: 52px"><col style="width: 64px"><col style="width: 52px"></colgroup>
              <thead><tr><th>食材</th><th>必要</th><th>所持</th><th>差分</th></tr></thead>
              <tbody>
                <tr v-for="food in Food.list" :key="food.name">
                  <td><div class="food-name"><img :src="food.img" :alt="food.name"><span>{{ food.name }}</span></div></td>
                  <td class="text-align-right">{{ result.foodNumMap[food.name]?.toLocaleString() ?? 0 }}</td>
                  <td>
                    <InputNumber
                      v-if="!config.foodUnlimited"
                      type="number"
                      hide-spinner
                      class="compact-food-input"
                      :aria-label="`${food.name}の所持数`"
                      :model-value="config.foodDefaultNum[food.name]"
                      @update:model-value="config.foodDefaultNum[food.name] = $event ?? 0"
                    />
                    <InputNumber v-else type="number" hide-spinner class="compact-food-input" :aria-label="`${food.name}の所持数`" :model-value="9999" disabled />
                  </td>
                  <td class="text-align-right" :class="{ shortage: getFoodDifference(food.name) < 0 }">{{ getFoodDifference(food.name).toLocaleString() }}</td>
                </tr>
              </tbody>
            </DesignTable>
          </div>
        </section>

        <section class="surplus-cooking-section">
          <div class="flex-row-start-center flex-wrap gap-10px">
            <h2>余った食材で作れる料理</h2>
            <label class="flex-row-start-center gap-3px">各食材があと<InputNumber v-model.number="config.foodStock.surplusFoodNum" type="number" min="0" step="1" class="w-50px" />個ある場合</label>
          </div>
          <small>所持数との差分に設定個数を加え、必要数を満たす食材だけで作れる料理です。</small>
          <div class="surplus-cooking-list">
            <ResultSummaryCard v-for="type in cookingTypes" :key="type" :title="type">
              <template v-if="surplusCookingList[type].length">
                <div v-for="cooking in surplusCookingList[type]" :key="cooking.name" class="surplus-cooking-item">
                  <div>
                    <b>{{ cooking.name }}</b>
                    <small>{{ cooking.foodList.map(food => `${food.name}×${food.num}`).join('、') }}</small>
                  </div>
                  <span>{{ Math.round(cooking.fixEnergy).toLocaleString() }}</span>
                </div>
              </template>
              <p v-else class="surplus-cooking-empty">作れる料理はありません。</p>
            </ResultSummaryCard>
          </div>
        </section>
      </template>

      <small>設定をもとに、エナジーが高くなりそうな料理の組み合わせを探して表示します。計算方法の性質上、最も良い組み合わせを必ず見つけられるとは限りません。</small>
    </AsyncWatcherArea>
  </div>
</template>

<style lang="scss" scoped>
.food-stock-page {
  section h2 { margin: 10px 0 5px; font-size: 1.1rem; }
  img { width: 24px; height: 24px; object-fit: contain; }
  .table-scroll { width: 100%; overflow-x: auto; }
  .mobile-result-list { display: none; }
  .total-row { background: #edf7fb; }
  .shortage { color: #b21d1d; font-weight: bold; }
  .error-message { color: #b21d1d; }
  .surplus-cooking-section > small { color: var(--color-muted); }
  .surplus-cooking-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 5px; }
  .surplus-cooking-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 6px 9px; border-top: 1px solid var(--color-line); }
  .surplus-cooking-item div { min-width: 0; }
  .surplus-cooking-item b, .surplus-cooking-item small { display: block; }
  .surplus-cooking-item small { color: var(--color-muted); font-size: .8rem; }
  .surplus-cooking-item > span { white-space: nowrap; }
  .surplus-cooking-empty { margin: 0; padding: 8px 9px; color: var(--color-muted); font-size: .85rem; }

  @media (max-width: 1280px), (max-width: 900px) and (max-height: 500px) {
    .desktop-result-table { display: none; }
    .mobile-result-list { display: grid; gap: 8px; }
    .surplus-cooking-list { grid-template-columns: 1fr; }
    .cooking-plan-item { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; padding: 6px 9px; border-top: 1px solid var(--color-line); }
    .cooking-plan-empty { margin: 0; padding: 8px 9px; color: var(--color-muted); font-size: .85rem; }
    .compact-food-table { width: 100%; table-layout: fixed; }
    .compact-food-table :deep(th) { white-space: nowrap; }
    .compact-food-table :deep(td) { vertical-align: middle; }
    .food-name { display: flex; align-items: center; min-width: 0; gap: 5px; text-align: left; }
    .food-name img { flex: 0 0 auto; width: 26px; height: 26px; }
    .food-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .compact-food-input { width: 100%; min-width: 0; padding: 3px; text-align: right; }
  }

  @media (max-width: 600px) {
    .mobile-summary { display: none; }
  }
}
</style>
