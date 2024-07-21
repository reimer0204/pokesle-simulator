<script setup>
import SelectTableDetailPopup from '../components/select-table-detail-popup.vue';
import SettingList from '../components/setting-list.vue';
import SortableTable from '../components/sortable-table.vue';
import Berry from '../data/berry.js';
import Cooking from '../data/cooking.js';
import Food from '../data/food.js';
import Pokemon from '../data/pokemon.js';
import SubSkill from '../data/sub-skill.js';
import config from '../models/config.js';
import EvaluateTable from '../models/evaluate-table.js';
import MultiWorker from '../models/multi-worker.js';
import Popup from '../models/popup/popup.js';
import EvaluateTableWorker from '../worker/evaluate-table-worker.js?worker';

let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))
let lv = ref(lvList.at(-1))
let step = ref(5);

let evaluateTable = EvaluateTable.load();
let evaluateTablePokemonList = computed(() => {
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

async function showDetail(pokemon, p) {
  
  asyncWatcher.run(async (progressCounter) => {

    const evaluateTable = EvaluateTable.load();

    function combination(r, n, s = 0) {
      if (n == 0) return [[]];
      let result = [];

      for(let i = s; i < r - n + 1; i++) {
        for(let subList of combination(r, n - 1, i + 1)) {
          result.push([i, ...subList])
        }
      }

      return result;
    }

    const multiWorker = new MultiWorker(EvaluateTableWorker, 1)

    // サブスキルの組み合わせを列挙
    const subSkillNum = lv.value < 10 ? 0 : lv.value < 25 ? 1 : lv.value < 50 ? 2 : lv.value < 75 ? 3 : lv.value < 100 ? 4 : 5;
    let subSkillCombinationMap = {};
    for(const indexes of combination(SubSkill.list.length, subSkillNum)) {
      let subSkillList = indexes.map(i => SubSkill.list[i].name);
      if (config.selectEvaluate.silverSeedUse) {
        subSkillList = SubSkill.useSilverSeed(subSkillList)
      }
      let subSkillKey = subSkillList.sort().join('/');
      subSkillCombinationMap[subSkillKey] = (subSkillCombinationMap[subSkillKey] ?? 0) + 1;
    }

    let result = (await multiWorker.call(
      progressCounter,
      () => {
        return {
          lv: lv.value,
          config: JSON.parse(JSON.stringify(config)),
          pokemonList: [Pokemon.map[pokemon.name]],
          foodCombinationList: [pokemon.foodIndexList],
          subSkillCombinationMap,
          scoreForHealerEvaluate: evaluateTable.scoreForHealerEvaluate[lv],
          scoreForSupportEvaluate: evaluateTable.scoreForSupportEvaluate[lv],
        }
      }
    ))[0].result[pokemon.name][pokemon.foodIndexList][p].eachResult

    Popup.show(SelectTableDetailPopup, {
      name: pokemon.name,
      lv: lv.value,
      foodIndexList: pokemon.foodList.map(f => Math.max(Pokemon.map[pokemon.name].foodList.findIndex(f2 => f2.name == f)), 0),
      subSkillList: result.enableSubSkillList,
      nature: result.nature,
      percentile: false,
    })
  })
}

const pokemonListLastOnly = ref(false);
const pokemonList = computed(() => {
  if (pokemonListLastOnly.value) {
    return Pokemon.list.filter(pokemon => pokemon.afterList.length == 1 && pokemon.afterList[0] == pokemon.name)
  } else {
    return Pokemon.list;
  }
})

</script>

<template>
  <div class="page">

    <ToggleArea>
      <template #headerText>料理リスト</template>

      <div class="scroll" style="height: 50vh;">
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
    </ToggleArea>

    <ToggleArea class="mt-10px">
      <template #headerText>食材リスト</template>

      <div class="scroll" style="height: 50vh; max-height: 400px;">
        <SortableTable :dataList="Food.list" :columnList="[
          { key: 'name', name: '名前' },
          { key: 'energy', name: '基礎エナジー', type: Number },
          { key: 'bestTypeRate_カレー', name: 'カレー\n(料理補正)', percent: true, fixed: 0 },
          { key: 'bestTypeRate_サラダ', name: 'サラダ\n(料理補正)', percent: true, fixed: 0 },
          { key: 'bestTypeRate_デザート', name: 'デザート\n(料理補正)', percent: true, fixed: 0 },
          { key: 'maxEnergy_カレー', name: 'カレー\n(補正後エナジー)', type: Number, fixed: 0 },
          { key: 'maxEnergy_サラダ', name: 'サラダ\n(補正後エナジー)', type: Number, fixed: 0 },
          { key: 'maxEnergy_デザート', name: 'デザート\n(補正後エナジー)', type: Number, fixed: 0 },
        ]">
          <template #foodList="{ data }">
            <div>
              <div v-for="{name, num} in data.foodList">{{ name }}×{{ num }}</div>
            </div>
          </template>
        </SortableTable>
      </div>
    </ToggleArea>

    <ToggleArea open class="pokemon-list mt-10px">
      <template #headerText>ポケモンリスト</template>
      
      <div class="flex-row-start-center gap-10px">
        <label><input type="checkbox" v-model="pokemonListLastOnly" />最終進化のみ</label>
      </div>

      <div class="scroll" style="height: 50vh; max-height: 400px;">
        <SortableTable :dataList="pokemonList" :columnList="[
          { key: 'name', name: '名前' },
          { key: 'specialty', name: 'とくい' },
          { key: 'berry', name: 'きのみ' },
          { key: 'type', name: 'タイプ', convert: data => Berry.map[data.berry].type },
          { key: 'food1', name: 'A', template: 'food', convert: data => data.foodList[0]?.name },
          { key: 'food2', name: 'B', template: 'food', convert: data => data.foodList[1]?.name },
          { key: 'food3', name: 'C', template: 'food', convert: data => data.foodList[2]?.name },
          { key: 'food1num1', name: 'A1', convert: data => data.foodList[0]?.numList?.[0], type: Number },
          { key: 'food1num2', name: 'A2', convert: data => data.foodList[0]?.numList?.[1], type: Number },
          { key: 'food1num3', name: 'A3', convert: data => data.foodList[0]?.numList?.[2], type: Number },
          { key: 'food2num2', name: 'B2', convert: data => data.foodList[1]?.numList?.[1], type: Number },
          { key: 'food2num3', name: 'B3', convert: data => data.foodList[1]?.numList?.[2], type: Number },
          { key: 'food3num3', name: 'C3', convert: data => data.foodList[2]?.numList?.[2], type: Number },
          { key: 'foodRate', name: '食材確率', percent: true },
          { key: 'skill', name: 'スキル' },
          { key: 'skillRate', name: 'スキル\n確率', percent: true, fixed: 2 },
          { key: 'ceil', name: 'スキル\n天井', type: Number, convert: data => data.specialty == 'スキル' ? 144000 / data.help : 78, fixed: 0 },
          { key: 'skillRate2', name: 'スキル確率\n(天井込)', convert: data => data.skillRate / (1 - (1 - data.skillRate) ** data.ceil), percent: true, fixed: 2 },
          { key: 'bag', name: '所持数', type: Number },
          { key: 'help', name: 'おてつだい\n時間', type: Number },
          { key: 'skillNum', name: 'スキル/日\n(げんき0)', type: Number, convert: data => data.skillRate2 * 86400 / data.help, fixed: 2 },
          { key: 'afterList', name: '最終進化' },
        ]" :fixColumn="1">
          <template #food="{ data, value }">
            <img v-if="value" :src="Food.map[value].img" />
          </template>
          <template #afterList="{ data }">
            {{ data.afterList.join('/') }}
          </template>
        </SortableTable>
      </div>
    </ToggleArea>
    
    <ToggleArea open class="mt-10px">
      <template #headerText>厳選テーブル</template>

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

      <div class="scroll" style="height: 600px;">
        <SortableTable :dataList="evaluateTablePokemonList" :columnList="columnList" :fixColumn="2">

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
    </ToggleArea>

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

  .pokemon-list {
    img {
      width: 24px;
      height: 24px;
    }
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