<script setup lang="ts">
import { Cooking, Food } from '@/data/food_and_cooking';
import SortableTable from '../components/sortable-table.vue';
import AsyncWatcherArea from '../components/util/async-watcher-area.vue';
import { AsyncWatcher } from '../models/async-watcher.js';
import config from '../models/config.js';
import MultiWorker from '../models/multi-worker.js';
import PokemonListSimulator from '../models/pokemon-box/pokemon-box-worker?worker';
import PokemonBox from '../models/pokemon-box/pokemon-box.js';
import EvaluateTable from '../models/simulation/evaluate-table.ts';
import Pokemon from '@/data/pokemon.ts';
import InputCheckbox from '@/components/form/input-checkbox.vue';
import InputRadio from '@/components/form/input-radio.vue';
import DesignTable from '@/components/design-table.vue';
import Skill from '@/data/skill.ts';
import type { SimulatedPokemon } from '@/type.ts';
import Field from '@/data/field.ts';
import TablePopup from '@/components/table-popup.vue';
import Popup from '@/models/popup/popup.ts';
import { CheckList } from '@/models/check-list.ts';

let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))

if (config.summary.checklist.food.borderLv == null || !lvList.includes(config.summary.checklist.food.borderLv)) {
  config.summary.checklist.food.borderLv = lvList.filter(x => x >= 60)[0] ?? lvList.at(-1);
}
if (config.summary.checklist.skill.borderLv == null || !lvList.includes(config.summary.checklist.skill.borderLv)) {
  config.summary.checklist.skill.borderLv = lvList.filter(x => x >= 60)[0] ?? lvList.at(-1);
}

const saishuuShinkaPokemonList = computed(() => {
  return Pokemon.list.filter(x => x.isLast).sort((a, b) => a.name < b.name ? -1 : 1)
})

const filteredSaishuuShinkaPokemonList = computed(() => {
  return saishuuShinkaPokemonList.value.filter(pokemon => !config.summary.checklist.pokemonCondition.disablePokemonMap[pokemon.name])
})

let evaluateTable = EvaluateTable.load(config);
let promisedEvaluateTable = ref({});
evaluateTable.then(table => {
  promisedEvaluateTable.value = table ?? {};
})
let multiWorker = new MultiWorker(PokemonListSimulator)
onBeforeUnmount(() => {
  multiWorker.close();
})

const checkList = computed(() => {
  return promisedEvaluateTable.value ? new CheckList(config, promisedEvaluateTable.value) : null;
})

let simulatingCount = 0;
const simulatedPokemonList = ref<SimulatedPokemon[]>([])
const asyncWatcher = AsyncWatcher.init();
let simulatingPromise: Promise<SimulatedPokemon[]>;
async function createPokemonList(setConfig = false) {
  if (simulatingCount > 1) return;

  simulatingCount++;
  try {
    await simulatingPromise;
  } finally {}

  try {
    simulatingPromise = asyncWatcher.run(async (progressCounter) => {
      simulatedPokemonList.value = await PokemonBox.simulation(
        PokemonBox.list,
        multiWorker, 
        await evaluateTable, 
        {
          ...config,
          simulation: {
            ...config.simulation,
            bagOverOperation: false,
            fix: false,
            selectType: config.summary.checklist.pokemonCondition.selectType,
            selectBorder: config.summary.checklist.pokemonCondition.selectBorder,
          },
        },
        progressCounter, true
      )
      for(let simulatedPokemon of simulatedPokemonList.value) {
        simulatedPokemon.foodCombination = simulatedPokemon.box!.foodList.map(x => String.fromCharCode(simulatedPokemon.base.foodList.findIndex(f => f.name == x) + 65)).join('');
      }
    })
  } finally {
    simulatingCount--;
  }
}
createPokemonList();
watch(() => [
  config.summary.checklist.pokemonCondition.selectType,
  config.summary.checklist.pokemonCondition.selectBorder,
], () => {
  createPokemonList(true);
})

const pokemonCheckList = computed(() => {
  return checkList.value?.pokemonCheckList(config, simulatedPokemonList.value);
})

const foodCheckList = computed(() => {
  return checkList.value?.foodCheckList(config, simulatedPokemonList.value);
})

const skillCheckList = computed(() => {
  return checkList.value?.skillCheckList(config, simulatedPokemonList.value);
})

</script>

<template>
  <div class="page">
    <div class="tab-list">
      <router-link to="/check-list/">チェックリスト設定</router-link>
      <router-link to="/check-list/pokemon">ポケモン</router-link>
      <router-link to="/check-list/food">食材</router-link>
      <router-link to="/check-list/skill">スキル</router-link>
      <router-link to="/check-list/field">フィールド別</router-link>
    </div>

    <AsyncWatcherArea :asyncWatcher="asyncWatcher" class="flex-110 flex-column">
      <router-view
        class="mt-10px flex-110"
        :simulatedPokemonList="simulatedPokemonList"
        :promisedEvaluateTable="promisedEvaluateTable"
        :pokemonCheckList="pokemonCheckList"
        :foodCheckList="foodCheckList"
        :skillCheckList="skillCheckList"
      />
    </AsyncWatcherArea>

  </div>
</template>

<style lang="scss" scoped>

.page {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding-bottom: 10px;
  height: 100%;

  .scroll-x {
    overflow-x: scroll;
  }

  .pokemon-list {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
  }
}

.caution {
  color: yellow;
}

.tab-list {
  display: flex;
  border-bottom: 3px #CCC solid;

  & > a {
    padding: 5px 15px;
    text-decoration: none;
    color: inherit;

    &.router-link-exact-active {
      font-weight: bold;
      border-bottom: 3px #08C solid;
      margin-bottom: -3px;
      color: #08C;
    }
  }
}

</style>