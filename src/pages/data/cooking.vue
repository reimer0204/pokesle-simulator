<script setup>
import InputNumber from '@/components/form/input-number.vue';
import { Cooking, Food } from '../../data/food_and_cooking';
import InputRadio from '@/components/form/input-radio.vue';

const cookingList = reactive(structuredClone(Cooking.list));
cookingList.forEach(cooking => cooking.num = 0)
cookingList.sort((a, b) => b.energy - a.energy);
cookingList.sort((a, b) => a.type < b.type ? -1 : a.type > b.type ? 1 : 0);

const requireCountMode = ref(0);
const requireFoodList = computed(() => {
  let foodMap = {};

  let cookingListList;
  if (requireCountMode.value == 0) {
    cookingListList = [cookingList];
  }
  if (requireCountMode.value == 1) {
    cookingListList = ['カレー', 'サラダ', 'デザート'].map(type => cookingList.filter(x => x.type == type));
  }

  for(const cookingList of cookingListList) {
    let thisFoodMap = {};
    for(const cooking of cookingList) {
      if (cooking.num == 0) continue;
      for(const { name, num } of cooking.foodList) {
        if (!thisFoodMap[name]) {
          thisFoodMap[name] = 0;
        }
        thisFoodMap[name] += num * cooking.num;
      }
    }

    for(const name in thisFoodMap) {
      foodMap[name] = Math.max(foodMap[name] ?? 0, thisFoodMap[name]);
    }
  }
  
  const list = Food.list.filter(food => foodMap[food.name])
    .map(food => ({ ...food, num: foodMap[food.name] }));

  return [
    ...list,
    { name: '合計', num: list.reduce((sum, food) => sum + food.num, 0) },
  ];
})

</script>

<template>
  <div class="page">
    <SortableTable class="cooking-list" :dataList="cookingList" :columnList="[
      { key: 'type', name: 'タイプ' },
      { key: 'name', name: '名前' },
      { key: 'foodList', name: 'レシピ' },
      { key: 'rate', name: 'ボーナス', percent: true, fixed: 0 },
      { key: 'energy', name: 'エナジー', type: Number, fixed: 0 },
      { key: 'maxEnergy', name: 'エナジー(最大)', type: Number, fixed: 0 },
      { key: 'foodNum', name: '食材数', type: Number },
      { key: 'num', name: '作成数', type: Number },
    ]" scroll>
      <template #foodList="{ data }">
        <div>
          <div v-for="{name, num} in data.foodList">{{ name }}×{{ num }}</div>
        </div>
      </template>
      <template #num="{ data }">
        <div>
          <InputNumber v-model.number="data.num" class="w-50px" />
        </div>
      </template>
    </SortableTable>

    <template v-if="requireFoodList.length">
      <div class="vertical-line"></div>
      <div class="require-food-list">
        <h2 class="mt-1em">必要な食材</h2>

        <InputRadio v-model="requireCountMode" :value="0">そのまま合計</InputRadio>
        <InputRadio v-model="requireCountMode" :value="1">異なるタイプの重複は省く</InputRadio>
            
        <SortableTable class="cooking-list" :dataList="requireFoodList" :columnList="[
          { key: 'name', name: '名前' },
          { key: 'num', name: '必要数', type: Number },
        ]">
          <template #name="{ data }">
            <div class="flex-row-start-center gap-5px">
              <img v-if="data.img" :src="data.img" class="w-20px h-20px" />
              {{ data.name }}
            </div>
          </template>
        </SortableTable>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.page {
  flex: 1 1 0;
  display: flex;
  flex-direction: row;

  min-height: 0;
  overflow: auto;

  .cooking-list {
    flex: 1 1 0;
  }

  .vertical-line {
    width: 1px;
    background-color: #CCC;
    margin: 0 10px;
  }

  .require-food-list {
    width: 240px;
  }
}
</style>