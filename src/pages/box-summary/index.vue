<script setup>
import { Food } from '@/data/food_and_cooking';
import SortableTable from '../../components/sortable-table.vue';
import AsyncWatcherArea from '../../components/util/async-watcher-area.vue';
import Berry from '../../data/berry';
import { AsyncWatcher } from '../../models/async-watcher.js';
import config from '../../models/config.js';
import MultiWorker from '../../models/multi-worker.js';
import PokemonListSimulator from '../../models/pokemon-box/pokemon-box-worker?worker';
import PokemonBox from '../../models/pokemon-box/pokemon-box.js';
import EvaluateTable from '../../models/simulation/evaluate-table.ts';
import PokemonInfo from './pokemon-info.vue';
import SimulationSelectType from '@/components/simulation-select-type.vue';
import Pokemon from '@/data/pokemon.ts';
import InputCheckbox from '@/components/form/input-checkbox.vue';
import InputRadio from '@/components/form/input-radio.vue';
import PokemonSimulator from '@/models/simulation/pokemon-simulator.ts';

let evaluateTable;
let evaluateTablePromise;
function loadEvaluateTable() {
  evaluateTablePromise = (async () => {
    evaluateTable = await EvaluateTable.load(config);
  })();
}
loadEvaluateTable();

const pokemonListEachFood = ref(false)
const showFoodNum = ref(true)
const showBoxDetail = ref(true)
const evaluateType = ref('energy')
const asyncWatcher = AsyncWatcher.init();
const simulatedPokemonList = ref([]);

let multiWorker = new MultiWorker(PokemonListSimulator)
onBeforeUnmount(() => {
  multiWorker.close();
})

let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))

const foodNumList = ref([]);
async function loadFoodNumInfo() {
  await PokemonSimulator.isReady

  let result = [];
  let targetList = Pokemon.list.filter(pokemon => pokemon.afterList.length == 1 && pokemon.afterList[0] == pokemon.name)

  const foodCombinationList = [ '000', '001', '002', '010', '011', '012' ];
  let foodIndexListList = foodCombinationList.map(x => x.split('').map(Number))

  const simulator = new PokemonSimulator({
    ...config,
    simulation: {
      ...config.simulation,
      expectType: {
        food: 0,
        skill: 0,
      }
    }
  }, PokemonSimulator.MODE_ABOUT)

  let subSkillList = []

  for(let base of targetList) {

    for(let foodIndexList of foodIndexListList) {

      // 食材を設定しておく
      let foodList = foodIndexList.map((f, i) => {
        const food = Food.map[base.foodList[f]?.name];
        if (food == null) return null;
        return base.foodList[f].name
      });
      if (foodList.includes(null)) continue;

      const pokemon = simulator.fromBox({
        name: base.name,
        lv: 60,
        foodList: foodList,
        subSkillList,
        nature: 'まじめ',
      });
      
      simulator.calcStatus(
        pokemon,
        0,
      )

      simulator.calcTeamHeal([pokemon])

      simulator.calcHelp(
        pokemon,
        0,
        0,
      )

      result.push(pokemon)
    }
  }

  foodNumList.value = result;
}
loadFoodNumInfo();


async function createPokemonList(setConfig = false) {
  multiWorker.reject();
  
  asyncWatcher.run(async (progressCounter) => {
    simulatedPokemonList.value = [];
    await evaluateTablePromise;
    simulatedPokemonList.value = await PokemonBox.simulation(
      PokemonBox.list,
      multiWorker, evaluateTable, 
      {
        ...config,
        simulation: {
          ...config.simulation,
          field: 'ワカクサ本島',
          fieldBonus: 0,
          berryList: ['', '', ''],
          mode: 0,
          fix: false,
        }
      },
      progressCounter,
      setConfig
    );
  })
}

// 設定が変わる度に再計算する
watch(() => config.sleepTime, () => {
  loadEvaluateTable();
  createPokemonList(true);
})
watch(() => config.checkFreq, () => {
  loadEvaluateTable();
  createPokemonList(true);
})
watch(config.simulation, () => createPokemonList(true), { immediate: true })
    
const pokemonList = computed(() => {

  let targetList = Pokemon.list.filter(x => x.isLast).map(x => ({ base: x }));
  if (pokemonListEachFood.value) {
    targetList = foodNumList.value
  }

  return targetList.map(target => {
    const result = {
      ...target,
      name: target.base.name, 
      type: target.base.type, 
      base: target.base,
      // foodList: target.foodNameList,
      // box: {
      //   foodList: target.base.foodNameList
      // }
    }

    let max = null;
    for(let lv of lvList) {
      // console.log(simulatedPokemonList.value
      //   .filter(x => x.evaluateResult).length)

      let pokemonList = simulatedPokemonList.value
        .filter(x => x.evaluateResult[lv]?.[target.base.name]);

      if (pokemonListEachFood.value) {
        pokemonList = pokemonList.filter(pokemon => 
          target.box.foodList.every((foodName, i) => foodName == pokemon.box?.foodList[i])
        )
      }

      pokemonList.sort((a, b) => b.evaluateResult[lv][target.base.name][evaluateType.value].score - a.evaluateResult[lv][target.base.name][evaluateType.value].score)
      result[`score_${lv}`] = pokemonList[0]?.evaluateResult[lv][target.base.name][evaluateType.value].score
      result[`pokemon_${lv}`] = pokemonList[0]

      if (max == null || max < result[`score_${lv}`]) {
        max = result[`score_max`] = result[`score_${lv}`];
        result[`pokemon_max`] = pokemonList[0];
      }
    }

    return result;
  })
});

const pokemonColumn = computed(() => {
  let result = [
    { key: 'name', name: '名前', type: String },
    { key: 'type', name: 'タイプ', type: String },
    { key: 'specialty', name: 'とくい', type: String, convert: x => x.base.specialty },
  ];

  if (pokemonListEachFood.value) {
    result.push({ key: 'foodList', name: '食材' });

    if (showFoodNum.value) {
      result.push(
        ...Food.list.map(food => ({ key: food.name, name: food.name, img: food.img, type: Number, fixed: 1 })),
      )
    }
  }

  result.push(
    { key: 'skill', name: 'スキル', type: String, convert: x => x.base.skill.name },
    { key: `score_max`, name: `厳選(最大)`, type: Number, percent: true },
  );
  if (showBoxDetail.value) {
    result.push(
      { key: `pokemon_max`, name: `厳選(最大)\n1位ポケモン`, template: 'pokemon', type: String, convert: x => x[`pokemon_max`]?.base.name },
    );
  }

  result.push(
    ...lvList.flatMap(lv => {
      const result = [
        { key: `score_${lv}`, name: `厳選(${lv})`, type: Number, percent: true },
      ]
      if (showBoxDetail.value) {
        result.push({ key: `pokemon_${lv}`, name: `厳選(${lv})\n1位ポケモン`, template: 'pokemon', type: String, convert: x => x[`pokemon_${lv}`]?.base.name })
      }
      return result;
    })
  );

  return result;
})

</script>

<template>
  <div class="page">

    <div class="flex-row-start-center flex-wrap gap-1em">
      <SimulationSelectType />
      <InputCheckbox v-model="pokemonListEachFood">食材構成ごと</InputCheckbox>
      <InputCheckbox v-model="showFoodNum">食材数表示
        <HelpButton title="食材数表示" markdown="
          サブスキル、せいかくを考慮せずにLv60になった場合の食材数です。
          サブスキルやせいかくによる食材数の変化は基本的に割合なので、ポケモンごとの大小にはほとんど影響しないはずです(所持数の違いで多少影響はありますが)
        " />
      </InputCheckbox>
      <InputCheckbox v-model="showBoxDetail">個体詳細表示</InputCheckbox>

      <div class="flex-row-start-center flex-wrap gap-8px">
        <InputRadio v-model="evaluateType" value="energy">総合スコア</InputRadio>
        <InputRadio v-model="evaluateType" value="specialty">とくい分野</InputRadio>
      </div>
    </div>

    <div class="pokemon-list mt-10px">
      <AsyncWatcherArea :asyncWatcher="asyncWatcher">
        <div class="scroll-x">
          <SortableTable :dataList="pokemonList" :columnList="pokemonColumn">
            <template #pokemon="{ value }">
              <PokemonInfo :pokemon="value" />
            </template>
            <template #foodList="{ data, value }">
              <FoodList :pokemon="data" />
            </template>
          </SortableTable>
        </div>
      </AsyncWatcherArea>
    </div>


  </div>
</template>

<style lang="scss" scoped>

.page {
  display: flex;
  flex-direction: column;
  padding-bottom: 10px;

  .scroll-x {
    overflow-x: scroll;
  }
}

</style>