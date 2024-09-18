<script setup>
import Cooking from '../../data/cooking.js';
</script>

<template>
  <div class="page">
    <SortableTable :dataList="Cooking.list" :columnList="[
      { key: 'type', name: 'タイプ' },
      { key: 'name', name: '名前' },
      { key: 'foodList', name: 'レシピ' },
      { key: 'rate', name: 'ボーナス', percent: true, fixed: 0 },
      { key: 'energy', name: 'エナジー', type: Number, fixed: 0 },
      { key: 'maxEnergy', name: 'エナジー(最大)', type: Number, fixed: 0 },
      { key: 'foodNum', name: '食材数', type: Number },
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