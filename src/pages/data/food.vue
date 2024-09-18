<script setup>
import Food from '../../data/food.js';
</script>

<template>
  <div class="page">
    <SortableTable :dataList="Food.list" :columnList="[
      { key: 'name', name: '名前' },
      { key: 'energy', name: '基礎エナジー', type: Number },
      { key: 'bestTypeRate_カレー', name: 'カレー\n最大補正', percent: true, fixed: 0 },
      { key: 'bestTypeRate_サラダ', name: 'サラダ\n最大補正', percent: true, fixed: 0 },
      { key: 'bestTypeRate_デザート', name: 'デザート\n最大補正', percent: true, fixed: 0 },
      { key: 'maxEnergy_カレー', name: 'カレー\n最大エナジー\n(レシピLv込)', type: Number, fixed: 0 },
      { key: 'maxEnergy_サラダ', name: 'サラダ\n最大エナジー\n(レシピLv込)', type: Number, fixed: 0 },
      { key: 'maxEnergy_デザート', name: 'デザート\n最大エナジー\n(レシピLv込)', type: Number, fixed: 0 },
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