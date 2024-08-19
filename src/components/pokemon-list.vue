<script setup>
import EditPokemonPopup from '../components/edit-pokemon-popup.vue';
import Food from '../data/food.js';
import Pokemon from '../data/pokemon.js';
import SubSkill from '../data/sub-skill.js';
import { AsyncWatcher } from '../models/async-watcher.js';
import config from '../models/config';
import EvaluateTable from '../models/evaluate-table.js';
import MultiWorker from '../models/multi-worker.js';
import PokemonBox from '../models/pokemon-box';
import Popup from '../models/popup/popup.js';
import PokemonListSimulator from '../worker/pokemon-list-simulator?worker';
import GoogleSpreadsheetPopup from './google-spreadsheet-popup.vue';
import PokemonBoxTsvPopup from './pokemon-box-tsv-popup.vue';
import SelectTableDetailPopup from './select-table-detail-popup.vue';
import SimulationDailyTeamPopup from './simulation-daily-team-popup.vue';
import SimulationPrepareTeamPopup from './simulation-prepare-team-popup.vue';
import SimulationWeeklyTeamPopup from './simulation-weekly-team-popup.vue';
import SortableTable from './sortable-table.vue';
import NatureInfo from './status/nature-info.vue';
import AsyncWatcherArea from './util/async-watcher-area.vue';

let evaluateTable = EvaluateTable.load(config);

const simulatedPokemonList = ref([])
const asyncWatcher = AsyncWatcher.init();

let multiWorker = new MultiWorker(PokemonListSimulator)
onBeforeUnmount(() => {
  multiWorker.close();
})

async function createPokemonList(setConfig = false) {
  multiWorker.reject();

  asyncWatcher.run(async (progressCounter) => {
    let clonedConfig = JSON.parse(JSON.stringify(config))

    let [setConfigProgress, stepA, stepB] = progressCounter.split(setConfig ? 1 : 0, 1, 2, 1)

    if (setConfig) {
      await multiWorker.call(
        setConfigProgress,
        () => ({ type: 'config', config: clonedConfig })
      )
    }

    let pokemonList = PokemonBox.list;

    pokemonList = (await multiWorker.call(
      stepA,
      (i) => {
        let startIndex = Math.floor(pokemonList.length * i / config.workerNum);
        let endIndex = Math.floor(pokemonList.length * (i + 1) / config.workerNum);
        return {
          type: 'basic',
          pokemonList: pokemonList.slice(startIndex, endIndex),
          startIndex,
          evaluateTable,
        }
      }
    )).flat(1);

    /* ここからおてボとかげんき回復系の計算 */
    // おてボ用に概算日給の高い上位6匹をリストアップしておく
    let helpBonusTop6 = pokemonList.toSorted((a, b) => b.tmpScore - a.tmpScore).slice(0, 6);

    // おてサポ用に1回の手伝いが多い上位6匹をリストアップしておく
    let pickupEnergyPerHelpTop5 = pokemonList.toSorted((a, b) => b.pickupEnergyPerHelp - a.pickupEnergyPerHelp).slice(0, 6)

    // げんき回復スキルの効果を概算するため、げんき回復なしの強い上位6匹と、その6位より強い回復持ちをリストアップしておく
    let healCheckTarget = pokemonList.filter(x => x.healEffect == 0).toSorted((a, b) => b.tmpScore - a.tmpScore).slice(0, 6)
    healCheckTarget.push(...pokemonList.filter(x => x.healEffect != 0 && x.tmpScore > (healCheckTarget.at(-1)?.tmpScore ?? 0)))

    simulatedPokemonList.value = (await multiWorker.call(
      stepB,
      (i) => {
        return {
          type: 'assist',
          pokemonList: pokemonList.slice(
            Math.floor(pokemonList.length * i / config.workerNum),
            Math.floor(pokemonList.length * (i + 1) / config.workerNum),
          ),
          helpBonusTop6,
          pickupEnergyPerHelpTop5,
          healCheckTarget,
        }
      }
    )).flat(1);
  })
}

// 設定が変わる度に再計算する
watch(config.simulation, () => createPokemonList(true), { immediate: true })

watch(PokemonBox.watch, () => createPokemonList())

const columnList = computed(() => {
  let result = [
    { key: 'edit', name: '', type: String },
    { key: 'index', name: 'No', type: Number },
    { key: 'name', name: '名前', type: String },
    { key: 'lv', name: 'Lv', type: Number },
    { key: 'foodList', name: '食材', type: null },
    { key: 'skillLv', name: 'スキル\nLv', type: null },
    { key: 'subSkillList', name: 'サブスキル', type: null },
    { key: 'natureName', name: '性格', type: null },
    { key: 'score', name: 'スコア', type: Number, fixed: 1 },
  ]

  if (config.simulation.selectInfo) {
    let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))
    result.push({ key: `evaluate_max`, name: `厳選\n(最大)`, template: 'evaluate', lv: 'max', percent: true })
    for(let lv of lvList) {
      result.push({ key: `evaluate_${lv}`, name: `厳選\n(${lv})`, template: 'evaluate', lv, percent: true })

      if (config.pokemonList.selectEnergy) {
        result.push({ key: `evaluate_energy_${lv}`, name: `エナジー\n(${lv})`, template: 'evaluate_energy', lv, percent: true })
      }
    }

  }

  if (config.pokemonList.baseInfo) {
    result.push(
      { key: 'afterList', name: '最終進化' },
      { key: 'berryName', name: 'きのみ' },
      { key: 'skillName', name: 'スキル' },
    )
  }

  if (config.pokemonList.foodInfo) {
    for(let food of Food.list) {
      result.push({ key: food.name, name: food.name, img: food.img, type: Number, fixed: 1 })
    }
  }

  if (config.pokemonList.simulatedInfo) {
    result.push(
      { key: 'speed', name: 'おてつだい\n時間', type: Number },
      { key: 'dayHelpNum', name: '日中おてつ\nだい回数', type: Number, fixed: 2 },
      { key: 'nightHelpNum', name: '夜間おてつ\nだい回数', type: Number, fixed: 2 },
      { key: 'berryNum', name: 'きのみ\n個数', type: Number },
      { key: 'berryEnergyPerHelp', name: 'きのみ\n/手伝い', type: Number, fixed: 1 },
      { key: 'berryEnergyPerDay', name: 'きのみ\n/日', type: Number, fixed: 1 },
      { key: 'foodRate', name: '食材\n率', type: Number, percent: true },
      { key: 'foodNum', name: '食材\n個数', type: Number, fixed: 1 },
      { key: 'foodEnergyPerHelp', name: '食材\n/手伝い', type: Number, fixed: 1 },
      { key: 'foodEnergyPerDay', name: '食材\n/日', type: Number, fixed: 1 },
      { key: 'pickupEnergyPerHelp', name: 'きのみ+食材\n/手伝い', type: Number, fixed: 1 },
      { key: 'pickupEnergyPerDay', name: 'きのみ+食材\n/日', type: Number, fixed: 1 },
      { key: 'fixedBag', name: '所持\n数', type: Number },
      { key: 'bagFullHelpNum', name: 'いつ育\n到達回数', type: Number, fixed: 1 },
      { key: 'normalHelpNum', name: '通常おてつ\nだい回数', type: Number, fixed: 2 },
      { key: 'berryHelpNum', name: 'いつ育おてつ\nだい回数', type: Number, fixed: 2 },
      { key: 'fixedSkillLv', name: '補正後\nスキルLv', type: Number },
      { key: 'skillRate', name: 'スキル\n確率', type: Number, percent: true, fixed: 2 },
      { key: 'fixedSkillRate', name: '補正後\nスキル確率', type: Number, percent: true, fixed: 2 },
      { key: 'ceilSkillRate', name: '天井補正\nスキル確率', type: Number, percent: true, fixed: 2 },
      { key: 'skillPerDay', name: 'スキル\n回数/日', type: Number, fixed: 2 },
      { key: 'skillEnergyPerDay', name: 'スキル\nエナジー/日', type: Number, fixed: 1 },
      { key: 'shard', name: 'ゆめの\nかけら/日', type: Number, fixed: 1 },
      { key: 'supportScorePerDay', name: 'サポート\nスコア/日', type: Number, fixed: 1 },
      { key: 'energyPerDay', name: 'エナジー\n/日', type: Number, fixed: 1 },
    )
  }

  return result;
})

async function showEditPopup(pokemon) {
  await asyncWatcher.wait;
  if(await Popup.show(EditPokemonPopup, { index: pokemon.index, evaluateTable, simulatedPokemonList: simulatedPokemonList.value })) {
    if (config.pokemonBox.gs.autoExport) {
      PokemonBox.exportGoogleSpreadsheet();
    }
  }
}

async function addPokemon() {
  await asyncWatcher.wait;
  if(await Popup.show(EditPokemonPopup, { evaluateTable, simulatedPokemonList: simulatedPokemonList.value })) {
    if (config.pokemonBox.gs.autoExport) {
      PokemonBox.exportGoogleSpreadsheet();
    }
  }
}

async function showTsvPopup() {
  if(await Popup.show(PokemonBoxTsvPopup)) {
    if (config.pokemonBox.gs.autoExport) {
      PokemonBox.exportGoogleSpreadsheet();
    }
  }
}

async function toggleFix(data) {
  let pokemon = PokemonBox.list[data.index]
  if(pokemon.fix == null) pokemon.fix = 1;
  else if(pokemon.fix == 1) pokemon.fix = -1;
  else if(pokemon.fix == -1) pokemon.fix = null;
  data.fix = pokemon.fix;
  PokemonBox.post(pokemon, data.index)
  PokemonBox.exportGoogleSpreadsheet();
}

async function showGoogleSpreadsheetPopup() {
  await Popup.show(GoogleSpreadsheetPopup)
}

async function simulationWeeklyTeam() {
  Popup.show(SimulationWeeklyTeamPopup, { pokemonList: simulatedPokemonList.value })
}


async function simulationDailyTeam() {
  Popup.show(SimulationDailyTeamPopup)
}

async function simulationPrepareTeam() {
  Popup.show(SimulationPrepareTeamPopup)
}

function deletePokemon(index) {
  if (confirm(`${PokemonBox.list[index].name}(Lv${PokemonBox.list[index].lv})を削除します。よろしいですか？`)) {
    PokemonBox.delete(index);
  }
}

// 厳選詳細ポップアップを表示
function showSelectDetail(pokemon, after, lv) {
  Popup.show(SelectTableDetailPopup, {
    name: after,
    lv,
    foodIndexList: pokemon.foodList.map(f => Math.max(pokemon.base.foodList.findIndex(f2 => f2.name == f)), 0),
    subSkillList: pokemon.subSkillList,
    nature: pokemon.nature,
  })
}

</script>

<template>

  <div class="pokemon-list">

    <div class="flex-row-start-center gap-10px">
      <label><input type="checkbox" v-model="config.pokemonList.subSkillShort" />サブスキル名省略</label>
      <label><input type="checkbox" v-model="config.simulation.selectInfo" />厳選情報</label>
      <label><input type="checkbox" v-model="config.pokemonList.selectEnergy" />厳選エナジー表示</label>
      <label><input type="checkbox" v-model="config.pokemonList.selectDetail" />厳選詳細</label>
      <label><input type="checkbox" v-model="config.pokemonList.baseInfo" />基礎情報</label>
      <label><input type="checkbox" v-model="config.pokemonList.foodInfo" />食材数</label>
      <label><input type="checkbox" v-model="config.pokemonList.simulatedInfo" />シミュ詳細</label>
      <label><input type="checkbox" v-model="config.pokemonList.fixScore" />スコアまで固定</label>
    </div>

    <AsyncWatcherArea :asyncWatcher="asyncWatcher">
      <div class="scroll">
        <SortableTable :dataList="simulatedPokemonList" :columnList="columnList" v-model:setting="config.sortableTable.pokemonList2"
          :fixColumn="config.pokemonList.fixScore ? 9 : 3"
        >

          <template #edit="{ data }">
            <div class="flex-row-start-center gap-3px">
              <svg viewBox="0 0 100 100" width="16" @click="showEditPopup(data)">
                <path d="M0,100 L0,80 L60,20 L80,40 L20,100z M65,15 L80,0 L100,20 L85,35z" fill="#888" />
              </svg>
              <svg viewBox="0 0 100 100" width="14" @click="PokemonBox.move(data.index, -1); createPokemonList()">
                <path d="M0,70 L50,20 L100,70z" fill="#888" />
              </svg>
              <svg viewBox="0 0 100 100" width="14" @click="PokemonBox.move(data.index, 1); createPokemonList()">
                <path d="M0,30 L50,80 L100,30z" fill="#888" />
              </svg>
              <svg viewBox="0 0 100 100" width="14" @click="deletePokemon(data.index)">
                <path d="M10,30 L10,15 L40,15 L40,0 L60,0 L60,15 L90,15 L90,30z M30,100 L20,40 L80,40 L70,100" fill="#888" />
              </svg>
              <div title="チームのシミュレーションで固定・除外する設定">
                <!-- Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
                <svg v-if="data.fix == null" viewBox="0 -110 640 640" width="16" @click="toggleFix(data)"><path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" fill="#888"/></svg>
                <svg v-if="data.fix ==    1" viewBox="0 -110 640 640" width="16" @click="toggleFix(data)"><path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" fill="#6C4"/></svg>
                <svg v-if="data.fix ==   -1" viewBox="0 -110 640 640" width="16" @click="toggleFix(data)"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L353.3 251.6C407.9 237 448 187.2 448 128C448 57.3 390.7 0 320 0C250.2 0 193.5 55.8 192 125.2L38.8 5.1zM264.3 304.3C170.5 309.4 96 387.2 96 482.3c0 16.4 13.3 29.7 29.7 29.7H514.3c3.9 0 7.6-.7 11-2.1l-261-205.6z" fill="#E40"/></svg>
              </div>
            </div>
          </template>
          <template #index="{ data }">
            {{ data.index + 1 }}
          </template>

          <template #name="{ data }">
            <div :class="{ shiny: data.shiny }">
              <NameLabel :pokemon="data" /><template v-if="data.bagOverOperation">(いつ育)</template>
            </div>
          </template>

          <template #lv="{ data }">
            <LvLabel :pokemon="data" />
          </template>

          <template #foodList="{ data }">
            <div class="flex-row-center-center gap-2px">
              <div v-for="(food, i) of data.foodList"
                class="food"
                :class="{
                  disabled: i >= data.enableFoodList.length,
                  error: Pokemon.map[data.name].foodMap[food]?.numList[i] == null,
                }"
              >
                <img :src="Food.map[food].img" />
                <div class="num">{{ Pokemon.map[data.name].foodMap[food]?.numList[i] }}</div>
              </div>
            </div>
          </template>

          <template #skillLv="{ data }">
            <SkillLvLabel :pokemon="data" />
          </template>

          <template #subSkillList="{ data }">
            <SubSkillLabelList class="sub-skill-list" :pokemon="data" />
          </template>

          <template #natureName="{ data }">
            <NatureInfo :nature="data.nature" />
          </template>

          <template #evaluate="{ data, column }">
            <div v-if="config.pokemonList.selectDetail" class="evaluate-detail">
              <template v-for="after in data.afterList">
                <div :class="{ best: data.evaluateResult?.[column.lv]?.best.score == data.evaluateResult?.[column.lv]?.[after].score }">{{ after }}</div>
                <div :class="{ best: data.evaluateResult?.[column.lv]?.best.score == data.evaluateResult?.[column.lv]?.[after].score }" class="text-align-right">
                  <template v-if="isNaN(data.evaluateResult?.[column.lv]?.[after].score)">-</template>
                  <template v-else>{{ (data.evaluateResult?.[column.lv]?.[after].score * 100).toFixed(1) }}%</template>
                </div>
              </template>
            </div>
            <div v-else style="width: 6em; font-size: 80%;">
              <div>{{ data.evaluateResult?.[column.lv].best.name }}</div>

              <template v-if="isNaN(data.evaluateResult?.[column.lv].best.score)">
                -
              </template>
              <template v-else-if="column.lv != 'max'">
                <div class="text-align-right percentile" @click="showSelectDetail(data, data.evaluateResult?.[column.lv].best.name, column.lv)">
                  {{ (data.evaluateResult?.[column.lv].best.score * 100).toFixed(1) }}%
                </div>
              </template>
              <template v-else>
                <div class="text-align-right">{{ (data.evaluateResult?.[column.lv].best.score * 100).toFixed(1) }}%</div>
              </template>

            </div>
          </template>

          <template #evaluate_energy="{ data, column }">
            <div v-if="config.pokemonList.selectDetail" class="evaluate-detail">
              <template v-for="after in data.afterList">
                <div :class="{ best: data.evaluateResult?.[column.lv]?.best.score == data.evaluateResult?.[column.lv]?.[after].score }">{{ after }}</div>
                <div :class="{ best: data.evaluateResult?.[column.lv]?.best.score == data.evaluateResult?.[column.lv]?.[after].score }" class="text-align-right">
                  <template v-if="isNaN(data.evaluateResult?.[column.lv]?.[after].energy)">-</template>
                  <template v-else>{{ Math.round(data.evaluateResult?.[column.lv]?.[after].energy).toLocaleString() }}</template>
                </div>
              </template>
            </div>
            <div v-else style="width: 6em; font-size: 80%;">
              <div>{{ data.evaluateResult?.[column.lv].best.name }}</div>

              <template v-if="isNaN(data.evaluateResult?.[column.lv].best.energy)">-</template>
              <template v-else-if="column.lv != 'max'">
                <div class="text-align-right percentile" @click="showSelectDetail(data, data.evaluateResult?.[column.lv].best.name, column.lv)">
                  {{ Math.round(data.evaluateResult?.[column.lv].best.energy).toLocaleString() }}
                </div>
              </template>
              <template v-else>
                <div class="text-align-right">
                  {{ Math.round(data.evaluateResult?.[column.lv].best.energy).toLocaleString() }}
                </div>
              </template>

            </div>
          </template>

          <template #afterList="{ data, column }">
            <div style="width: 12em; font-size: 80%;">
              {{ data.afterList.length > 1 ? data.afterList[0] + '等' : data.afterList[0] }}
            </div>
          </template>

        </SortableTable>
      </div>
    </AsyncWatcherArea>

    <div class="flex-row-start-center gap-5px">
      <button @click="addPokemon">ポケモン新規追加</button>
      <button @click="simulationWeeklyTeam">週間PTシミュ</button>
      <button @click="simulationDailyTeam">日別PTシミュ</button>
      <button @click="simulationPrepareTeam">準備シミュ</button>
      <button @click="showGoogleSpreadsheetPopup" class="ml-auto">Googleスプレッドシート連携</button>
      <button @click="showTsvPopup">TSVインポート/エクスポート</button>
    </div>
  </div>


</template>

<style lang="scss" scoped>

.pokemon-list {
  display: flex;
  flex-direction: column;
  gap: 5px;

  .shiny {
    font-weight: bold;
    color: #E52;
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

    &.error {
      background-color: red;
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

  .skill-lv {
    &.skill-lv-auto {
      color: #BBB;
    }
    &:not(.skill-lv-auto) {
      font-weight: bold;
    }
  }

  .sub-skill-list {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 3px;
  }

  .sub-skill {
    display: flex;
    justify-content: center;
    width: 11.5em;
    padding: 2px 0px;
    white-space: nowrap;
    position: relative;

    font-size: 80%;
    font-weight: bold;
    border-radius: 3px;

    &.short {
      width: 5em;
      padding: 2px 0;
    }

    &.disabled {
      opacity: 0.5;
      font-weight: normal;
    }

    &.sub-skill-1 { background-color: #F8F8F8; border: 1px #AAA solid; color: #333; }
    &.sub-skill-2 { background-color: #E0F0FF; border: 1px #9BD solid; color: #333; }
    &.sub-skill-3 { background-color: #FFF4D0; border: 1px #B97 solid; color: #422; }

    img {
      position: absolute;
      width: 10px;
      top: -5px;
      right: -5px;
    }
  }

  .evaluate-detail {
    display: grid;
    font-size: 90%;
    gap: 3px 5px;
    grid-template-columns: 6em max-content;
    align-items: center;

    .best {
      font-weight: bold;
    }
  }

  .percentile {
    color: #04C;
    text-decoration: underline;
    // border-bottom: 1px #04C solid;
    cursor: pointer;

    &:hover {
      background-color: #0481;
    }
  }

  .async-watcher-area {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex: 1 1 0;
  }
  .scroll {
    flex: 1 1 0;
    overflow: auto;
    position: relative;
  }
}
</style>