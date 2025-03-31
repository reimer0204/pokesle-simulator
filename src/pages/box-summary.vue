<script setup>
import { Food } from '@/data/food_and_cooking';
import EditPokemonPopup from '../components/edit-pokemon-popup.vue';
import SelectTableDetailPopup from '../components/evaluate-table-detail-popup.vue';
import GoogleSpreadsheetPopup from '../components/google-spreadsheet-popup.vue';
import PokemonBoxTsvPopup from '../components/pokemon-box-tsv-popup.vue';
import SimulationPrepareTeamPopup from '../components/simulation-prepare-team-popup.vue';
import SimulationWeeklyTeamPopup from '../components/simulation-weekly-team-popup.vue';
import SortableTable from '../components/sortable-table.vue';
import AsyncWatcherArea from '../components/util/async-watcher-area.vue';
import Berry from '../data/berry';
import { AsyncWatcher } from '../models/async-watcher.js';
import config from '../models/config.js';
import MultiWorker from '../models/multi-worker.js';
import PokemonListSimulator from '../models/pokemon-box/pokemon-box-worker?worker';
import PokemonBox from '../models/pokemon-box/pokemon-box.js';
import Popup from '../models/popup/popup.js';
import EvaluateTable from '../models/simulation/evaluate-table.js';
import PokemonInfo from './box-summary/pokemon-info.vue';

let evaluateTable = EvaluateTable.load(config);

const berryList = ref([])
const foodList = ref([])
const asyncWatcher = AsyncWatcher.init();

let multiWorker = new MultiWorker(PokemonListSimulator)
onBeforeUnmount(() => {
  multiWorker.close();
})

async function createPokemonList(setConfig = false) {
  multiWorker.reject();

  asyncWatcher.run(async (progressCounter) => {
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

    berryList.value = Berry.list.map(berry => {
      const result = { name: berry.name, type: berry.type, }
      for(let i = 0; i < simulatedPokemonList.length; i++) {
        const pokemonList = simulatedPokemonList[i].filter(x => x.base.berry.name == berry.name)
         .sort((a, b) => b.berryEnergyPerDay - a.berryEnergyPerDay)
        result[`score${i}`] = pokemonList[0]?.berryEnergyPerDay
        result[`pokemon${i}`] = pokemonList[0]
      }
      return result;
    })

    foodList.value = Food.list.map(food => {
      const result = { name: food.name }
      for(let i = 0; i < simulatedPokemonList.length; i++) {
        const pokemonList = simulatedPokemonList[i].sort((a, b) => b[food.name] - a[food.name])
        result[`score${i}`] = pokemonList[0]?.[food.name]
        result[`pokemon${i}`] = pokemonList[0]
      }
      return result;
    })
  })
}

// 設定が変わる度に再計算する
watch(() => config.sleepTime, () => {
  evaluateTable = EvaluateTable.load(config);
  createPokemonList(true);
})
watch(() => config.checkFreq, () => {
  evaluateTable = EvaluateTable.load(config);
  createPokemonList(true);
})
watch(config.simulation, () => createPokemonList(true), { immediate: true })

let columnNames = ['', 'Lv30仮定\n', 'Lv50仮定\n', 'Lv60仮定\n', 'Lv75仮定\n']
let berryColumn = [
  { key: 'name', name: '名前', type: String },
  { key: 'type', name: 'タイプ', type: String },
  ...columnNames.flatMap((x, i) => {
    return [
      { key: `score${i}`, name: x + 'エナジー/日', type: Number },
      { key: `pokemon${i}`, name: x + `1位ポケモン`, template: 'pokemon', type: String, convert: x => x[`pokemon${i}`]?.base.name },
    ]
  })
]

let foodColumn = [
  { key: 'name', name: '名前', type: String },
  ...columnNames.flatMap((x, i) => {
    return [
      { key: `score${i}`, name: x + '数量/日', type: Number },
      { key: `pokemon${i}`, name: x + `1位ポケモン`, template: 'pokemon', type: String, convert: x => x[`pokemon${i}`]?.base.name },
    ]
  })
]

</script>

<template>
  <div class="page">

    <div class="flex-row-start-start flex-wrap gap-5px">
      <CommonSetting />
    </div>

    <div class="pokemon-list mt-10px">

      <AsyncWatcherArea :asyncWatcher="asyncWatcher">

        <ToggleArea open>
          <template #headerText>きのみ毎トップ</template>

          <div class="scroll-x">
            <SortableTable :dataList="berryList" :columnList="berryColumn">
              <template #pokemon="{ value }">
                <PokemonInfo :pokemon="value" />
              </template>
            </SortableTable>
          </div>
        </ToggleArea>

        <ToggleArea open class="mt-10px">
          <template #headerText>食材毎トップ</template>
          
          <div class="scroll-x">
            <SortableTable :dataList="foodList" :columnList="foodColumn" class="mt-10px">
              <template #pokemon="{ value }">
                <PokemonInfo :pokemon="value" />
              </template>
            </SortableTable>
          </div>
        </ToggleArea> 

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