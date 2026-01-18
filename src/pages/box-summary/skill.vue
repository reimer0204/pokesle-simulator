<script setup lang="ts">
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
import Skill from '@/data/skill.ts';
import Pokemon from '@/data/pokemon.ts';
import type { SimulatedPokemon } from '@/type.ts';

let evaluateTable: EvaluateTable;
let evaluateTablePromise: Promise<void>;
function loadEvaluateTable() {
  evaluateTablePromise = (async () => {
    evaluateTable = await EvaluateTable.load(config);
  })();
}
loadEvaluateTable();

const skillList = ref([])
const asyncWatcher = AsyncWatcher.init();
const skillNumMap = ref<{ [key: string]: number }>({})

let multiWorker = new MultiWorker(PokemonListSimulator)
onBeforeUnmount(() => {
  multiWorker.close();
})

async function createPokemonList(setConfig = false) {
  multiWorker.reject();

  asyncWatcher.run(async (progressCounter) => {
    await evaluateTablePromise;
    let simulatedPokemonList = [];

    const progressList = progressCounter.split(1, 1, 1, 1, 1, 1);

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
    
    const foodCombinationList = [ '000', '001', '002', '010', '011', '012' ];
    let foodIndexListList = foodCombinationList.map(x => x.split('').map(Number))
    let subSkillList = ['おてつだいボーナス', 'おてつだいスピードM', 'スキル確率アップM', 'スキル確率アップS', '所持数アップL']
    const boxPokemonList = [];
    let targetList = Pokemon.list.filter(pokemon => pokemon.afterList.length == 1 && pokemon.afterList[0] == pokemon.name)
    for(let base of targetList) {
      for(let foodIndexList of foodIndexListList) {
        // 食材を設定しておく
        let foodList = foodIndexList.map((f, i) => {
          const food = Food.map[base.foodList[f]?.name];
          if (food == null) return null;
          return base.foodList[f].name
        });
        if (foodList.includes(null)) continue;

        boxPokemonList.push({
          name: base.name,
          lv: 100,
          foodList: foodList,
          subSkillList,
          nature: 'なまいき',
        });
      }
    }

    const skillPokemonList: SimulatedPokemon[] = await PokemonBox.simulation(
      boxPokemonList,
      multiWorker, null, 
      {
        ...config,
        simulation: {
          ...config.simulation,
          expectType: {
            food: 0,
            skill: 0,
          },
          helpBonus: 5,
        }
      },
      progressList[5], true
    );
    const skillNumMap = Object.fromEntries(Skill.list.map(x => [x.name, { num: 0, pokemon: null }]))
    for(const pokemon of skillPokemonList) {
      if ((skillNumMap[pokemon.base.skill.name]?.num ?? 0) < pokemon.skillPerDay) {
        skillNumMap[pokemon.base.skill.name] = {
          num: pokemon.skillPerDay,
          pokemon: pokemon.base.name,
        }
      }
    }

    skillList.value = Skill.list.map(skill => {
      const result = { name: skill.name }
      for(let i = 0; i < simulatedPokemonList.length; i++) {
        const pokemonList = simulatedPokemonList[i]
          .filter(x => x.base.skill.name == skill.name)
          .sort((a, b) => b.skillPerDay - a.skillPerDay)
        result[`max`] = skillNumMap[skill.name]?.num ?? 0;
        result[`maxPokemon`] = skillNumMap[skill.name]?.pokemon;
        result[`score${i}`] = pokemonList[0]?.skillPerDay / (skillNumMap[skill.name]?.num ?? 0)
        result[`num${i}`] = pokemonList[0]?.skillPerDay
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
let skillColumn = [
  { key: 'name', name: '名前', type: String },
  { key: 'max', name: '最大', type: Number, fixed: 1 },
  ...columnNames.flatMap((x, i) => {
    return [
      { key: `score${i}`, name: x + '数量/日', percent: true, template: 'score' },
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
      最大はスキル確率S+M+なまいき+おてつだいスピード35%短縮+Lv100で計算した時のスキル発動回数です。<br>
      各ポケモンの数量は最大に対しての%です。現環境では60%前後が厳選終了の目安になるかと思われます。
    </BaseAlert>

    <div class="pokemon-list mt-10px">

      <AsyncWatcherArea :asyncWatcher="asyncWatcher">
        <div class="scroll-x">
          <SortableTable :dataList="skillList" :columnList="skillColumn">
            <template #max="{ value, data }">
              <div class="flex-column-center-end">
                {{ data.max.toFixed(1) }}
                <small>({{ data.maxPokemon }})</small>
              </div>
            </template>
            <template #score="{ key, data, value }">
              <div class="flex-column-center-end">
                {{ (value * 100).toFixed(1) }}%
                <small>({{ (data[key?.replace('score', 'num')] ?? 0).toFixed(1) }})</small>
              </div>
            </template>
            <template #pokemon="{ value }">
              <PokemonInfo :pokemon="value" />
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