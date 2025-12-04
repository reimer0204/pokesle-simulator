<script setup>
import { Food, Cooking } from '../../data/food_and_cooking';
import Popup from '../../models/popup/popup.ts';
import CookingSettingPopup from '../../components/cooking-setting-popup.vue';
import config from '../../models/config';

const disabledCookingNum = computed(() => {
  return Cooking.getDisabledCookingNum(config);
})

const enableCookingList = computed(() => {
  console.log('!')
  return Cooking.getEnableCookingList(config);
})

const foodList = computed(() => Food.list.map(food => {
  const result = {
    ...food,
  };

  const cookingTypeList = ['カレー', 'サラダ', 'デザート'];
  for(const cookingType of cookingTypeList) {
    const filteredCookingList = enableCookingList.value.filter(x => x.type == cookingType && x.foodList.some(x => x.name == food.name))

    result[`bestTypeRate_${cookingType}`] = Math.max(...filteredCookingList.map(x => x.rate), 1)
    result[`maxAddEnergy_${cookingType}`] = Math.max(...filteredCookingList.map(x => x.maxAddEnergy), 0)
    result[`maxEnergy_${cookingType}`] = food.energy * result[`bestTypeRate_${cookingType}`] * (result[`bestTypeRate_${cookingType}`] > 1 ? Cooking.maxRecipeBonus : 1)
  }

  return result;
}))

</script>

<template>
  <div class="page">
    <BaseAlert>
      「最大補正」や「最大追加料理エナジー」でソートすることで、隙間を埋める食材の判断に使うことができます。<br>
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

    <SortableTable class="mt-10px" :dataList="foodList" :columnList="[
      { key: 'name', name: '名前' },
      { key: 'energy', name: '基礎エナジー', type: Number },
      { key: 'bestTypeRate_カレー', name: 'カレー\n最大補正', percent: true, fixed: 0 },
      { key: 'bestTypeRate_サラダ', name: 'サラダ\n最大補正', percent: true, fixed: 0 },
      { key: 'bestTypeRate_デザート', name: 'デザート\n最大補正', percent: true, fixed: 0 },
      { key: 'maxAddEnergy_カレー', name: 'カレー\n最大追加料理エナジー\n(レシピLv込)', type: Number, fixed: 0 },
      { key: 'maxAddEnergy_サラダ', name: 'サラダ\n最大追加料理エナジー\n(レシピLv込)', type: Number, fixed: 0 },
      { key: 'maxAddEnergy_デザート', name: 'デザート\n最大追加料理エナジー\n(レシピLv込)', type: Number, fixed: 0 },
      { key: 'maxEnergy_カレー', name: 'カレー\n最大単品エナジー\n(レシピLv込)', type: Number, fixed: 0 },
      { key: 'maxEnergy_サラダ', name: 'サラダ\n最大単品エナジー\n(レシピLv込)', type: Number, fixed: 0 },
      { key: 'maxEnergy_デザート', name: 'デザート\n最大単品エナジー\n(レシピLv込)', type: Number, fixed: 0 },
      { key: 'maxEnergy', name: '総合\n最大単品エナジー\n(レシピLv込)', type: Number, fixed: 0, convert: (x) => Math.max(x.maxEnergy_カレー, x.maxEnergy_サラダ, x.maxEnergy_デザート) },
    ]">
      <template #foodList="{ data }">
        <div>
          <div v-for="{name, num} in data.foodList">{{ name }}×{{ num }}</div>
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
  overflow: auto;
}
</style>