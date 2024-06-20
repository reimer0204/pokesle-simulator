<script setup>
import SelectTablePickupPopup from '../components/select-table-pickup-popup.vue';
import SettingList from '../components/setting-list.vue';
import SortableTable from '../components/sortable-table.vue';
import Food from '../data/food.js';
import Pokemon from '../data/pokemon.js';
import config from '../models/config.js';
import EvaluateTable from '../models/evaluate-table.js';
import Popup from '../models/popup/popup.js';

let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))
let lv = ref(lvList[0])
let step = ref(5);

let evaluateTable = EvaluateTable.load();
let pokemonList = computed(() => {
  let result = [];
  for(let pokemonName in evaluateTable) {
    let lvInfo = evaluateTable[pokemonName][lv.value];
    let pokemon = Pokemon.map[pokemonName];

    for(let food in lvInfo) {
      let percentile = lvInfo[food].percentile;

      result.push({
        name: pokemonName,
        foodIndexList: food,
        foodList: food.split('').map(c => pokemon.foodList[Number(c)].name),
        ...percentile
      })
    }
  }
  return result;
});

let columnList = computed(() => {
  return [
    { key: 'name', name: '名前', type: String },
    { key: 'foodList', name: '食材', type: null },
    ...new Array(100 / step.value + 1).fill(0).map((_, i) => {
      let p = i * step.value;
      return { key: `${p}`, name: `${p}%`, template: 'percentile', p, type: Number, fixed: 0 }
    })
  ]
})

function showDetail(pokemon, p) {
  Popup.show(SelectTablePickupPopup, {
    name: pokemon.name,
    foodIndexList: pokemon.foodIndexList,
    p,
    lv: lv.value,
  })
}

</script>

<template>
  <div class="page">

    <h2>厳選テーブル確認</h2>

    <SettingList>
      <div>
        <label>Lv</label>
        <select v-model="lv">
          <option v-for="lv in lvList" :value="lv">{{ lv }}</option>
        </select>
      </div>
      
      <div>
        <label>ステップ</label>
        <select :value="step" @input="step = Number($event.target.value)">
          <option :value="1">1</option>
          <option :value="2">2</option>
          <option :value="5">5</option>
          <option :value="10">10</option>
        </select>
      </div>
    </SettingList>

    <div class="scroll">
      <SortableTable :dataList="pokemonList" :columnList="columnList" :fixColumn="2">

        <template #foodList="{ data }">
          <div class="flex-row-center-center gap-2px">
            <div v-for="(food, i) of data.foodList" class="food">
              <img :src="Food.map[food].img" />
              <div class="num">{{ Pokemon.map[data.name].foodMap[food].numList[i] }}</div>
            </div>
          </div>
        </template>

        <template #percentile="{ data, column }">
          <div class="text-align-right percentile" @click="showDetail(data, column.p)">{{ Math.round(data[column.p]).toLocaleString() }}</div>
        </template>

      </SortableTable>
    </div>

  </div>
</template>

<style lang="scss" scoped>

.page {
  display: flex;
  flex-direction: column;
  height: 100%;

  .scroll {
    flex: 1 1 0;
    overflow: auto;
    position: relative;
  }
  
  .food {
    width: 24px;
    height: 24px;
    padding: 1px;
    position: relative;

    &.disabled {
      opacity: 0.5;
    }
    &:not(.disabled) {
      background-color: #FFF;
      border-radius: 3px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    img {
      width: 100%;
    }

    .num {
      position: absolute;
      right: 2px;
      bottom: -2px;
      font-weight: bold;
      font-size: 80%;

      text-shadow:
        0px 0px 3px #FFF,
        0px 0px 3px #FFF,
        0px 0px 3px #FFF,
        0px 0px 3px #FFF,
        0px 0px 3px #FFF;
    }
  }

  .percentile {
    color: #04C;
    border-bottom: 1px #04C solid;
    cursor: pointer;

    &:hover {
      background-color: #DEF;
    }
  }
}

</style>