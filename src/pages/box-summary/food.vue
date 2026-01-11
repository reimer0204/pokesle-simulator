<script setup>
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

let evaluateTable;
let evaluateTablePromise;
function loadEvaluateTable() {
  evaluateTablePromise = (async () => {
    evaluateTable = await EvaluateTable.load(config);
  })();
}
loadEvaluateTable();

const foodList = ref([])
const asyncWatcher = AsyncWatcher.init();

let multiWorker = new MultiWorker(PokemonListSimulator)
onBeforeUnmount(() => {
  multiWorker.close();
})

async function createPokemonList(setConfig = false) {
  multiWorker.reject();

  asyncWatcher.run(async (progressCounter) => {
    await evaluateTablePromise;
    let simulatedPokemonList = [];

    const progressList = progressCounter.split(1, 1, 1, 1, 1);

    for(let [index, setting] of [
      { fix: false },
      { fix: true, fixLv: 30 },
      { fix: true, fixLv: 50 },
      { fix: true, fixLv: 60 },
      { fix: true, fixLv: 75 },
    ].entries()) {
      simulatedPokemonList.push(await PokemonBox.simulation(
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
          }
        },
        progressList[index], setConfig
      ))
    }

    foodList.value = Food.list.map(food => {
      const result = {
        name: food.name,
        require: Math.max(...Cooking.list.map(x => x.foodList.find(f => f.name == food.name)?.num ?? 0))
       }
      for(let i = 0; i < simulatedPokemonList.length; i++) {
        const pokemonList = simulatedPokemonList[i].sort((a, b) => b[food.name] - a[food.name])
        result[`score${i}`] = pokemonList[0]?.[food.name] / result.require
        result[`num${i}`] = pokemonList[0]?.[food.name]
        result[`pokemon${i}`] = pokemonList[0]
      }
      return result;
    })
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

let columnNames = ['', 'Lv30仮定\n', 'Lv50仮定\n', 'Lv60仮定\n', 'Lv75仮定\n']
let foodColumn = [
  { key: 'name', name: '名前', type: String },
  { key: 'require', name: '最大\n要求数', type: Number },
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
      最大要求数はその食材を最も使用するレシピの数量で、各ポケモンの数量はその必要数に対しての%です。ポケモン1匹で3食作りたいなら300%以上が目安になります。
    </BaseAlert>

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