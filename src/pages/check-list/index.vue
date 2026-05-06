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
import SimulationSelectType from '@/components/simulation-select-type.vue';
import Pokemon from '@/data/pokemon.ts';
import InputCheckbox from '@/components/form/input-checkbox.vue';
import InputRadio from '@/components/form/input-radio.vue';
import PokemonSimulator from '@/models/simulation/pokemon-simulator.ts';
import DesignTable from '@/components/design-table.vue';
import Skill from '@/data/skill.ts';
import SettingList from '@/components/util/setting-list.vue';
import type { FoodName, SimulatedPokemon } from '@/type.ts';
import Field from '@/data/field.ts';
import TablePopup from '@/components/table-popup.vue';
import Popup from '@/models/popup/popup.ts';

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
</script>

<template>
  <div class="page">
    <div class="flex-column-start-start gap-5px">
      <div>
        <DesignTable>
          <tr>
            <th :rowspan="config.summary.checklist.pokemonCondition.list.length + 3">ポケモン</th>
            <th>対象</th>
            <th>総合厳選度</th>
            <th>とくい厳選度</th>
            <th></th>
          </tr>

          <tr>
            <td></td>
            <td colspan="2">
              <div class="flex-column gap-5px">
                <div class="flex-row-start-center gap-5px">
                  基準レベル：<select
                    v-model="config.summary.checklist.pokemonCondition.selectLv"
                  >
                  <option v-for="lv in lvList" :value="lv">Lv. {{ lv }}</option>
                  <option value="max">全レベル内最大値</option>
                  </select>
                </div>
                <InputRadio v-model="config.summary.checklist.pokemonCondition.selectType" :value="0">パーセンタイル</InputRadio>
                <InputRadio v-model="config.summary.checklist.pokemonCondition.selectType" :value="1">指定パーセンタイルに対する比率</InputRadio>
                <div v-if="config.summary.checklist.pokemonCondition.selectType == 1">
                  厳選度 <InputNumber class="w-50px" v-model="config.summary.checklist.pokemonCondition.selectBorder" /> %に対して
                </div>
              </div>
            </td>
            <td></td>
          </tr>
          
          <tr v-for="(item, index) in config.summary.checklist.pokemonCondition.list">
            <td>
              <div class="flex-row-start-center gap-5px">
                <select
                  :value="`${item.type}${item.target ? `_${item.target}` : ''}`"
                  @input="($event) => {
                    const [type, target] = $event.target.value.split('_')
                    item.type = Number(type);
                    item.target = target ?? null;
                  }"
                >
                  <option value="0">全ポケモン</option>
                  <option value="1_きのみ">きのみとくい</option>
                  <option value="1_食材">食材とくい</option>
                  <option value="1_スキル">スキルとくい</option>
                  <option
                    v-for="pokemon in saishuuShinkaPokemonList"
                    :value="`2_${pokemon.name}`"
                  >
                    {{ pokemon.name }}
                  </option>
                </select>
                
                <template v-for="combine of ['aaa', 'aab', 'aac', 'aba', 'abb', 'abc']">
                  <InputCheckbox v-model="item[combine]">{{ combine.toUpperCase() }}</InputCheckbox>
                </template>
              </div>
            </td>
            <td>
              <InputNumber class="w-50px" v-model="item.energyBorder" /> %以上
            </td>
            <td>
              <InputNumber class="w-50px" v-model="item.specialtyBorder" /> %以上
            </td>
            <td>
              <div class="flex-row-start-center gap-5px">
                <svg viewBox="0 0 100 100" width="14" @click="config.summary.checklist.pokemonCondition.list.swap(index, index - 1)">
                  <path d="M0,70 L50,20 L100,70z" fill="#888" />
                </svg>
                <svg viewBox="0 0 100 100" width="14" @click="config.summary.checklist.pokemonCondition.list.swap(index, index + 1)">
                  <path d="M0,30 L50,80 L100,30z" fill="#888" />
                </svg>
                <svg viewBox="0 0 100 100" width="14" @click="config.summary.checklist.pokemonCondition.list.splice(index, 1)">
                  <path d="M10,30 L10,15 L40,15 L40,0 L60,0 L60,15 L90,15 L90,30z M30,100 L20,40 L80,40 L70,100" fill="#888" />
                </svg>
              </div>
            </td>
          </tr>

          <tr>
            <td colspan="2">
              <div class="flex-row-start-center gap-10px">
                <button @click="config.summary.checklist.pokemonCondition.list.push({
                  type: 0,
                  target: null,
                  aaa: true,
                  aab: true,
                  aac: true,
                  aba: true,
                  abb: true,
                  abc: true,
                  energyBorder: null,
                  specialtyBorder: null,
                })">追加</button>

                <SettingButton title="非表示ポケモン設定">
                  <template #label>
                    <div class="flex-row-start-center">
                      非表示ポケモン設定
                      <template v-if="saishuuShinkaPokemonList.length - filteredSaishuuShinkaPokemonList.length">
                        ：<span class="caution">{{ saishuuShinkaPokemonList.length - filteredSaishuuShinkaPokemonList.length }}匹</span>
                      </template>
                    </div>
                  </template>

                  <div>
                    <SortableTable
                      class="w-300px h-600px"
                      :dataList="saishuuShinkaPokemonList"
                      :columnList="[
                        { key: 'name', name: 'ポケモン' },
                        { key: 'checked', name: '非表示', convert: (x) => !config.summary.checklist.pokemonCondition.disablePokemonMap[x.name] },
                      ]"
                      scroll
                    >
                      <template #checked="{ data, value }">
                        <InputCheckbox v-model="config.summary.checklist.pokemonCondition.disablePokemonMap[data.name]">非表示</InputCheckbox>
                      </template>
                    </SortableTable>
                  </div>
                </SettingButton>
              </div>
            </td>
          </tr>
          <tr>
            <th rowspan="2">食材</th>
            <th>対象</th>
            <th colspan="3">条件</th>
          </tr>
          <tr>
            <td>
              <div class="gap-5px" style="display: grid; grid-template-columns: repeat(4, 130px);">
                <InputCheckbox
                  v-for="food in Food.list"
                  v-model="config.summary.checklist.food.enableMap[food.name]"
                >
                  {{ food.name }}
                </InputCheckbox>
              </div>
            </td>
            <td colspan="3">
              <div class="flex-column gap-5px">
                <InputRadio v-model="config.summary.checklist.food.borderType" :value="0">理論値に対しての割合</InputRadio>
                <InputRadio v-model="config.summary.checklist.food.borderType" :value="1">必要最大数に対しての割合</InputRadio>

                <div class="flex-row-start-center gap-5px">
                  <select
                    v-if="config.summary.checklist.food.borderType == 0"
                    v-model="config.summary.checklist.food.borderLv"
                  >
                    <option v-for="lv in lvList" :value="lv">Lv. {{ lv }} の理論値</option>
                  </select>

                  <InputNumber class="w-50px" v-model="config.summary.checklist.food.borderValue" /> %以上
                </div>

                <div class="flex-row-start-center gap-5px">
                  <span>厳選対象ポケモン</span>
                  <InputNumber class="w-50px" v-model="config.summary.checklist.food.targetValue" /> %以上
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <th rowspan="2">スキル</th>
            <th>対象</th>
            <th colspan="3">条件</th>
          </tr>
          <tr>
            <td>
              <div>
                <InputCheckbox v-model="config.summary.checklist.skill.skillSpecialtyOnly">スキルとくいが持っていないスキルをまとめて除外</InputCheckbox>
              </div>

              <hr />

              <div class="gap-5px" style="display: grid; grid-template-columns: repeat(2, 265px);">
                <template v-for="skill in Skill.list">
                  <template v-if="config.summary.checklist.skill.skillSpecialtyOnly && !skill.skillSpecialtyOnly">
                    <InputCheckbox disabled>{{ skill.name }}</InputCheckbox>
                  </template>
                  <template v-else>
                    <InputCheckbox v-model="config.summary.checklist.skill.enableMap[skill.name]">
                      {{ skill.name }}
                    </InputCheckbox>
                  </template>
                </template>
              </div>
            </td>
            <td colspan="3">
              <div class="flex-column gap-5px">
                <div class="flex-row-start-center gap-5px">
                  <select
                    v-model="config.summary.checklist.skill.borderLv"
                  >
                    <option v-for="lv in lvList" :value="lv">Lv. {{ lv }} の理論値</option>
                  </select>

                  <InputNumber class="w-50px" v-model="config.summary.checklist.skill.borderValue" /> %以上
                </div>

                <div class="flex-row-start-center gap-5px">
                  <span>厳選対象ポケモン</span>
                  <InputNumber class="w-50px" v-model="config.summary.checklist.skill.targetValue" /> %以上
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <th rowspan="2">フィールド別</th>
            <td colspan="4">
              <div class="flex-column gap-5px">
                <InputCheckbox v-model="config.summary.checklist.field.shinkago">進化後を表示</InputCheckbox>
                <InputCheckbox v-model="config.summary.checklist.field.bakecchaMatome">バケッチャをまとめて表示</InputCheckbox>
              </div>
            </td>
          </tr>
        </DesignTable>
      </div>
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

.caution {
  color: yellow;
}

.tab-list {
  display: flex;
  border-bottom: 3px #CCC solid;

  & > div {
    padding: 5px 15px;
    text-decoration: none;
    color: inherit;

    &.active {
      font-weight: bold;
      border-bottom: 3px #08C solid;
      margin-bottom: -3px;
      color: #08C;
    }
  }
}

</style>