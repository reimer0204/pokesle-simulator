<script setup>
import { Food, Cooking } from '../../data/food_and_cooking';
import Popup from '../../models/popup/popup.ts';
import CookingSettingPopup from '../../components/cooking-setting-popup.vue';
import config from '../../models/config.ts';

const cookingTypeList = ['カレー', 'サラダ', 'デザート'];
const cookingColumnVisibility = config.sortableTable.food.columnVisibility;

const disabledCookingNum = computed(() => {
  return Cooking.getDisabledCookingNum(config);
})

const enableCookingList = computed(() => {
  return Cooking.getEnableCookingList(config);
})

const foodList = computed(() => Food.list.map(food => {
  const result = {
    ...food,
  };

  for(const cookingType of cookingTypeList) {
    const filteredCookingList = enableCookingList.value.filter(x => x.type == cookingType && x.foodList.some(x => x.name == food.name))

    result[`require_${cookingType}`] = Math.max(...filteredCookingList.map(x => x.foodList.find(f => f.name == food.name)?.num ?? 0), 0),
    result[`bestTypeRate_${cookingType}`] = Math.max(...filteredCookingList.map(x => x.rate), 1)
    result[`maxCookingEnergy_${cookingType}`] = Math.max(...filteredCookingList.map(x => x.energy), 0)
    result[`maxEnergy_${cookingType}`] = food.energy * result[`bestTypeRate_${cookingType}`] * (result[`bestTypeRate_${cookingType}`] > 1 ? Cooking.maxRecipeBonus : 1)
  }

  result[`maxCookingEnergyAverage`] = (result[`maxCookingEnergy_カレー`] + result[`maxCookingEnergy_サラダ`] + result[`maxCookingEnergy_デザート`]) / 3;
  result[`maxCookingEnergyGeometricMean`] = Math.cbrt(result[`maxCookingEnergy_カレー`] * result[`maxCookingEnergy_サラダ`] * result[`maxCookingEnergy_デザート`]);

  return result;
}))

const columnList = computed(() => [
  { key: 'name', name: '名前' },
  { key: 'energy', name: '基礎\nエナジー', type: Number },
  ...cookingTypeList.flatMap(type => [
    cookingColumnVisibility.require && { key: `require_${type}`, name: `${type}\n必要最大数`, type: Number },
    cookingColumnVisibility.rate && { key: `bestTypeRate_${type}`, name: `${type}\n最大補正`, percent: true, fixed: 0 },
    cookingColumnVisibility.cookingEnergy && { key: `maxCookingEnergy_${type}`, name: `${type}\n最大料理エナジー`, type: Number, fixed: 0 },
    cookingColumnVisibility.energy && { key: `maxEnergy_${type}`, name: `${type}\n最大単品エナジー\n(レシピLv込)`, type: Number, fixed: 0 },
  ].filter(column => column)),
  { key: 'maxCookingEnergyAverage', name: '平均\n最大料理エナジー', type: Number, fixed: 0 },
  { key: 'maxCookingEnergyGeometricMean', name: '相乗平均\n最大料理エナジー', type: Number, fixed: 0 },
  { key: 'maxEnergy', name: '総合\n最大単品エナジー\n(レシピLv込)', type: Number, fixed: 0, convert: (x) => Math.max(x.maxEnergy_カレー, x.maxEnergy_サラダ, x.maxEnergy_デザート) },
]);

</script>

<template>
  <div class="page">
    <BaseAlert>
      「最大補正」や「最大料理エナジー」でソートすることで、隙間を埋める食材の判断に使うことができます。<br>
      どちらもほぼ同じ意味ですが、めいそうスイートサラダのように補正は高いがエナジーが低い料理をどう扱うかによって使い分けてください。
    </BaseAlert>
    
    <div class="mt-10px flex-row-start-start gap-10px">
      
      <SettingList class="align-self-stretch">
        <div>
          <label>モード</label>
          <div>
            <div class="flex-row gap-10px">
              <InputRadio v-model="config.simulation.mode" :value="0">通常</InputRadio>
              <InputRadio v-model="config.simulation.mode" :value="1">料理育成(カンスト除外のみ)</InputRadio>
              <InputRadio v-model="config.simulation.mode" :value="2">料理育成(料理以外無視)</InputRadio>
            </div>
            <small>
            </small>
          </div>
        </div>
      </SettingList>

      <SettingButton @click="Popup.show(CookingSettingPopup)" :important="disabledCookingNum > 0">
        <template #label>
          <div class="inline-flex-row-center">
            料理設定
            <template v-if="disabledCookingNum">(無効:{{ disabledCookingNum }}種)</template>
          </div>
        </template>
      </SettingButton>
    </div>

    <div class="mt-10px flex-row-start-center flex-wrap gap-10px">
      <InputCheckbox v-model="cookingColumnVisibility.require">必要最大数</InputCheckbox>
      <InputCheckbox v-model="cookingColumnVisibility.rate">最大補正</InputCheckbox>
      <InputCheckbox v-model="cookingColumnVisibility.cookingEnergy">最大料理エナジー</InputCheckbox>
      <InputCheckbox v-model="cookingColumnVisibility.energy">最大単品エナジー</InputCheckbox>
    </div>

    <SortableTable class="mt-10px food-table" :dataList="foodList" :columnList="columnList" :fixColumn="1" scroll>
      <template #name="{ data }">
        <div class="flex-row-start-center gap-5px">
          <img :src="data.img" :alt="data.name" class="w-20px h-20px" />
          <span>{{ data.name }}</span>
        </div>
      </template>
    </SortableTable>
  </div>
</template>

<style lang="scss" scoped>
.page {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;

  min-height: 0;
  overflow: hidden;

  .food-table {
    flex: 1 1 0;
    min-height: 0;
  }
}
</style>
