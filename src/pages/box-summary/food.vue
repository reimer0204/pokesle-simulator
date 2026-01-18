<script setup lang="ts">
import { Cooking, Food } from '@/data/food_and_cooking';
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
import Pokemon from '@/data/pokemon.ts';
import FoodList from '@/components/status/food-list.vue';

let evaluateTable;
let evaluateTablePromise;
function loadEvaluateTable() {
  evaluateTablePromise = (async () => {
    evaluateTable = await EvaluateTable.load(config);
  })();
}
loadEvaluateTable();
const asyncWatcher = AsyncWatcher.init();

let multiWorker = new MultiWorker(PokemonListSimulator)
onBeforeUnmount(() => {
  multiWorker.close();
})

const simulatedPokemonList = ref([]);
const mode = ref(0)

async function createPokemonList(setConfig = false) {
  multiWorker.reject();

  asyncWatcher.run(async (progressCounter) => {
    await evaluateTablePromise;
    const tmpSimulatedPokemonList = [];

    const progressList = progressCounter.split(1, 1, 1, 1, 1);

    for(let [index, setting] of [
      { fix: false },
      { fix: true, fixLv: 30 },
      { fix: true, fixLv: 50 },
      { fix: true, fixLv: 60 },
      { fix: true, fixLv: 75 },
    ].entries()) {
      tmpSimulatedPokemonList.push(await PokemonBox.simulation(
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
            ...setting,
            genkiFull: true,
            helpBonus: 3,
          }
        },
        progressList[index], setConfig
      ))
    }

    simulatedPokemonList.value = tmpSimulatedPokemonList
  })
}

const foodMaxMap = computed(() => {
  const foodMaxMap = Object.fromEntries(Food.list.map(x => [x.name, { num: 0, pokemon: null, foodList: [] }]))
  Pokemon.list.forEach(pokemon => {
    const foodHelpNum = pokemon.foodRate * 86400 / pokemon.help / 0.45
    for(const food1 of pokemon.foodList.filter(x => x?.name && x.numList[0])) {
      for(const food2 of pokemon.foodList.filter(x => x?.name && x.numList[1])) {
        for(const food3 of pokemon.foodList.filter(x => x?.name && x.numList[2])) {
          let numMap: {[key: string]: number} = {};
          numMap[food1.name] = (numMap[food1.name] ?? 0) + food1.numList[0] / 3;
          numMap[food2.name] = (numMap[food2.name] ?? 0) + food2.numList[1] / 3;
          numMap[food3.name] = (numMap[food3.name] ?? 0) + food3.numList[2] / 3;

          for(let [name, num] of Object.entries(numMap)) {
            num *= foodHelpNum;
            if (foodMaxMap[name].num < num) {
              foodMaxMap[name].num = num;
              foodMaxMap[name].pokemon = pokemon;
              foodMaxMap[name].foodList = [
                food1.name,
                food2.name,
                food3.name,
              ];
            }
          }
        }
      }
    }
  });
  return foodMaxMap
})

const foodList = computed(() => {
  if (simulatedPokemonList.value.length == 0) return []
  
  return Food.list.map(food => {
      const result = {
        name: food.name,
        require: Math.max(...Cooking.list.map(x => x.foodList.find(f => f.name == food.name)?.num ?? 0)),
        max: foodMaxMap.value[food.name].num,
        maxPokemon: foodMaxMap.value[food.name].pokemon,
        maxFoodList: {
          box: {
            foodList: foodMaxMap.value[food.name].foodList,
          },
          foodList: foodMaxMap.value[food.name].foodList,
          base: foodMaxMap.value[food.name].pokemon,
        }
      }
      for(let i = 0; i < simulatedPokemonList.value.length; i++) {
        const pokemonList = simulatedPokemonList.value[i].sort((a, b) => b[food.name] - a[food.name])
        if (mode.value == 0) {
          result[`score${i}`] = pokemonList[0]?.[food.name] / result.require
        }
        if (mode.value == 1) {
          result[`score${i}`] = pokemonList[0]?.[food.name] / result.max
        }
        if (mode.value == 2) {
          result[`score${i}`] = pokemonList[0]?.[food.name]
        }
        result[`num${i}`] = pokemonList[0]?.[food.name]
        result[`pokemon${i}`] = pokemonList[0]
      }
      return result;
    })
})

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

let columnNames = ['', 'Lv30仮定\n', 'Lv50仮定\n', 'Lv60仮定\n', 'Lv75仮定\n']
let foodColumn = [
  { key: 'name', name: '名前', type: String },
  { key: 'require', name: '最大\n要求数', type: Number },
  { key: 'max', name: '取得数目安\n(ポケモン)', type: Number, fixed: 1 },
  ...columnNames.flatMap((x, i) => {
    return [
      { key: `score${i}`, name: x + '数量/日', percent: true, type: Number, template: 'score' },
      { key: `pokemon${i}`, name: x + `1位ポケモン`, template: 'pokemon', type: String, convert: x => x[`pokemon${i}`]?.base.name },
    ]
  })
]

</script>

<template>
  <div class="page">

    <div class="flex-row-start-start flex-wrap gap-5px">
      <CommonSetting fix />
    </div>
    <BaseAlert class="mt-10px">
      このページでは育成仮定が強制的にONになります。<br>
      最大要求数はその食材を最も使用するレシピの数量です。取得数目安はサブスキルやせいかく補正抜きで最もその食材を持ってくるポケモンとその数量です。<br>
      各ポケモンの数量は選択した基準に対しての%です。ポケモン1匹で3食作りたい場合、最大要求数に対して300%以上が目安になります。
    </BaseAlert>

    <div class="flex-row-start-center gap-10px mt-10px">
      表示数量：
      <InputRadio v-model="mode" :value="0">最大要求数に対する割合</InputRadio>
      <InputRadio v-model="mode" :value="1">取得数目安に対する割合</InputRadio>
    </div>

    <div class="pokemon-list mt-10px">

      <AsyncWatcherArea :asyncWatcher="asyncWatcher">
        <div class="scroll-x">
          <SortableTable :dataList="foodList" :columnList="foodColumn">
            <template #pokemon="{ value }">
              <PokemonInfo :pokemon="value" />
            </template>
            <template #score="{ key, data, value }">
              <div class="flex-column-center-end">
                {{ (value * 100).toFixed(1) }}%
                <small>({{ (data[key?.replace('score', 'pokemon')]?.[data.name] ?? 0).toFixed(1) }})</small>
              </div>
            </template>
            <template #max="{ key, data, value }">
              <div class="flex-column-center-end w-80px">
                {{ value.toFixed(1) }}
                <small>({{ data.maxPokemon.name }})</small>
                <div>
                  <FoodList :pokemon="data.maxFoodList" />
                </div>
              </div>
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