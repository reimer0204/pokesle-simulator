<script setup>
import { Food, Cooking } from '../../data/food_and_cooking';
</script>

<template>
  <div class="page">
    <BaseAlert>
      「最大補正」や「最大追加料理」エナジーでソートすることで、隙間を埋める食材の判断に使うことができます。<br>
      どちらもほぼ同じ意味ですが、めいそうスイートサラダのように補正は高いがエナジーが低い料理をどう扱うかによって使い分けてください。
    </BaseAlert>

    <SortableTable class="mt-10px" :dataList="Food.list" :columnList="[
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