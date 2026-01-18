<script setup lang="ts">
import { Food } from '@/data/food_and_cooking';
import Field, { type FieldItem } from '@/data/field.ts';
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
// import InputRadio from '@/components/form/input-radio.vue';
import PokemonSimulator from '@/models/simulation/pokemon-simulator.ts';
import type { SimulatedPokemon } from '@/type.ts';
import InputRadio from '@/components/form/input-radio.vue';

let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))

let evaluateTable = EvaluateTable.load(config);

const simulatedPokemonList = ref<SimulatedPokemon[]>([])
const asyncWatcher = AsyncWatcher.init();

let multiWorker = new MultiWorker(PokemonListSimulator)
onBeforeUnmount(() => {
  multiWorker.close();
})

let simulatingCount = 0
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
        },
        progressCounter, setConfig
      )
    })
  } finally {
    simulatingCount--;
  }
}

const fieldList = computed(() => {
  let gensenMap: {[key: string]: { score: number, specialty: number }} = {}
  for(let pokemon of simulatedPokemonList.value) {
    let foodIndexList = pokemon.box!.foodList.map(foodName => String.fromCharCode(pokemon.base.foodNameList.findIndex(baseFood => baseFood == foodName) + 97)).join('')
    if (!config.summary.field[pokemon.base.specialty]?.[foodIndexList]) {
      continue;
    }

    const table = pokemon.evaluateResult[config.summary.field[pokemon.base.specialty]?.lv];
    if (table) {
      for(const [name, { energy, specialty }] of Object.entries(table)) {
        if (gensenMap[name] == null) {
          gensenMap[name] = { score: 0, specialty: 0 };
        }
        gensenMap[name].score = Math.max(gensenMap[name].score, energy.score)
        gensenMap[name].specialty = Math.max(gensenMap[name].specialty, specialty.score)
      }
    }
  }

  const pokemonList = simulatedPokemonList.value.length ? Pokemon.list.filter(pokemon => {
    if (config.summary.field.pokemon[pokemon.name] != null) return config.summary.field.pokemon[pokemon.name];
    if (!config.summary.field.shinkago && pokemon.evolve.before != null) return false;
    if (config.summary.field[pokemon.specialty] == null) return false;

    for(const after of pokemon.afterList) {
      const pokemon = Pokemon.map[after]
      if (
        config.summary.field[pokemon.specialty].score
        && (gensenMap[after]?.score ?? 0) < config.summary.field[pokemon.specialty].score / 100
      ) {
        return true;
      }
      if (
        config.summary.field[pokemon.specialty].specialty
        && (gensenMap[after]?.specialty ?? 0) < config.summary.field[pokemon.specialty].specialty / 100
      ) {
        return true;
      }
    }

    return false;
  }).map(pokemon => ({
    ...pokemon,
    minScore: Math.min(...pokemon.afterList.map(after => gensenMap[after]?.score ?? 0)),
    minSpecialty: Math.min(...pokemon.afterList.map(after => gensenMap[after]?.specialty ?? 0)),
  })) : []

  return [
    ...Field.list.map(x => x.name),
    ...Field.list.filter(x => x.ex).map(x => `${x.name}EX`),
  ].map(fieldName => {
    return {
      name: fieldName,
      'うとうと': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'うとうと')),
      'すやすや': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'すやすや')),
      'ぐっすり': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'ぐっすり')),
    }
  })
})

watch(config.simulation, () => createPokemonList(true), { immediate: true })

const fixNum = computed(() => {
  return {
    fix:   Pokemon.list.filter(pokemon => config.summary.field.pokemon[pokemon.name] === true).length,
    unfix: Pokemon.list.filter(pokemon => config.summary.field.pokemon[pokemon.name] === false).length,
  }
})

</script>

<template>
  <div class="page">

    <h2>表示条件<small>(指定条件はORになります)</small></h2>

    <div class="flex-row-start-center flex-wrap gap-1em mt-5px">
      <SimulationSelectType />
      
      <SettingButton title="厳選設定">
        <template #label>
          <div class="inline-flex-row-center">
            強制表示/非表示:
            {{
              [
                fixNum.fix ? [`表示${ fixNum.fix }匹`] : [],
                fixNum.unfix ? [`非表示${ fixNum.unfix }匹`] : [],
              ].flat().join('、') || 'なし'
            }}
          </div>
        </template>

        <SettingTable>
          <tr v-for="pokemon of Pokemon.list">
            <th>{{ pokemon.name }}</th>
            <td>
              <div class="flex-row-start-center gap-5px">
                <InputRadio v-model="config.summary.field.pokemon[pokemon.name]" :value="null">厳選度から計算</InputRadio>
                <InputRadio v-model="config.summary.field.pokemon[pokemon.name]" :value="true">表示</InputRadio>
                <InputRadio v-model="config.summary.field.pokemon[pokemon.name]" :value="false">非表示</InputRadio>
              </div>
            </td>
          </tr>
        </SettingTable>
      </SettingButton>
      <InputCheckbox v-model="config.summary.field.shinkago">進化後を表示</InputCheckbox>
    </div>

    <DesignTable class="mt-5px mr-auto">
      <tr>
        <th></th>
        <th>厳選度Lv</th>
        <th>総合厳選度</th>
        <th>とくい厳選度</th>
        <th>食材構成</th>
      </tr>
      <tr v-for="name of ['きのみ', '食材', 'スキル']">
        <th>{{ name }}</th>
        <td>
          <select v-model="config.summary.field[name].lv">
            <option value="max">最大</option>
            <option v-for="lv in lvList" :value="lv">{{ lv }}</option>
          </select>
        </td>
        <td><InputNumber class="w-50px" v-model="config.summary.field[name].score" /> %未満</td>
        <td><InputNumber class="w-50px" v-model="config.summary.field[name].specialty" /> %未満</td>
        <td>
          <div class="flex-row-start-center gap-5px">
            <template v-for="combine of ['aaa', 'aab', 'aac', 'aba', 'abb', 'abc']">
              <InputCheckbox class="w-50px" v-model="config.summary.field[name][combine]">{{ combine.toUpperCase() }}</InputCheckbox>
            </template>
          </div>
        </td>
      </tr>
    </DesignTable>

    <div class="pokemon-list mt-10px">
      <AsyncWatcherArea :asyncWatcher="asyncWatcher" class="flex-110 flex-column">

        <DesignTable class="mr-auto">
          <tr>
            <th></th>
            <th class="w-200px">うとうと</th>
            <th class="w-200px">すやすや</th>
            <th class="w-200px">ぐっすり</th>
            <th class="w-200px">合計</th>
          </tr>
          <tr v-for="field of fieldList">
            <th>{{ field.name }}</th>
            <td v-for="type in ['うとうと', 'すやすや', 'ぐっすり']" style="vertical-align: top;">
              対象{{ field[type].length }}匹
              <div v-for="pokemon in field[type]" class="fs-10px text-align-right">
                {{ pokemon.name }}({{ (pokemon.minScore * 100).toFixed(1) }}% / {{ (pokemon.minSpecialty * 100).toFixed(1) }}%)
              </div>
            </td>
            <td style="vertical-align: top;">
              対象{{ ['うとうと', 'すやすや', 'ぐっすり'].reduce((a, x) => a + field[x].length, 0) }}匹
            </td>
          </tr>
        </DesignTable>
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

  .pokemon-list {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
  }
}

</style>