<script setup>
import EditPokemonPopup from '../components/edit-pokemon-popup.vue';
import GoogleSpreadsheetPopup from '../components/google-spreadsheet-popup.vue';
import PokemonBoxTsvPopup from '../components/pokemon-box-tsv-popup.vue';
import SelectTableDetailPopup from '../components/evaluate-table-detail-popup.vue';
import SortableTable from '../components/sortable-table.vue';
import NatureInfo from '../components/status/nature-info.vue';
import AsyncWatcherArea from '../components/util/async-watcher-area.vue';
import Exp from '../data/exp.js';
import { Food, Cooking } from '../data/food_and_cooking';
import Pokemon from '../data/pokemon';
import { AsyncWatcher } from '../models/async-watcher.js';
import config from '../models/config.js';
import EvaluateTable from '../models/simulation/evaluate-table.js';
import MultiWorker from '../models/multi-worker.js';
import PokemonBox from '../models/pokemon-box/pokemon-box.js';
import Popup from '../models/popup/popup.ts';
import PokemonListSimulator from '../models/pokemon-box/pokemon-box-worker?worker';
import EvaluateResult from '@/components/page-assist/index/evaluate-result.vue';

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
    simulatedPokemonList.value = await PokemonBox.simulation(
      PokemonBox.list,
      multiWorker, evaluateTable, 
      config,
      progressCounter, setConfig
    )
    processSimulatedPokemonList();
  })
}

// 必要アメ数の計算
function processSimulatedPokemonList() {
  for(const pokemon of simulatedPokemonList.value) {
    Object.assign(pokemon, Exp.calcRequireInfo(PokemonBox.list[pokemon.box.index], pokemon.nature, config))
  }
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
watch(config.candy, processSimulatedPokemonList)

const columnList = computed(() => {
  let result = [
    { key: 'edit', name: '', type: Number, convert: item => item.box?.fix == -1 ? 2 : item.box?.fix },
    { key: 'index', name: 'No', type: Number, convert: x => x.box.index },
    { key: 'name', name: '名前', type: String, convert: x => x.box.name },
    { key: 'lv', name: 'Lv', type: Number },
    // { key: 'useCandy', name: '使用アメ', type: Number },
    // { key: 'useShard', name: '使用ゆめかけ', type: Number },
    
    { key: 'foodNameList', name: '食材', type: null, convert: x => x.box.foodList },
    { key: 'skillLv', name: 'ｽｷﾙ\nLv', type: null, convert: x => x.fixedSkillLv },
    { key: 'subSkill', name: 'サブスキル', type: null, convert: x => x.box.subSkillList },
    { key: 'natureName', name: '性格', type: null, convert: x => x.box.nature },
    { key: 'score', name: 'スコア', type: Number, fixed: 1 },
  ]

  if (config.simulation.selectInfo) {
    let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))
    result.push({ key: `evaluate_max`, name: `厳選\n(最大)`, template: 'evaluate', lv: 'max', percent: true })
    for(let lv of lvList) {
      result.push({ key: `evaluate_${lv}`, name: `厳選\n(${lv})`, template: 'evaluate', lv, percent: true })

      if (config.pokemonList.selectEnergy) {
        result.push({ key: `evaluate_energy_${lv}`, name: `エナジー\n(${lv})`, template: 'evaluate_energy', lv, type: Number })
      }
    }

  }
  if (config.simulation.specialtySelectInfo) {
    let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))
    result.push({ key: `specialty_percentile_max`, name: `得意厳選\n(最大)`, template: 'specialty', lv: 'max', percent: true })
    for(let lv of lvList) {
      result.push({ key: `specialty_percentile_${lv}`, name: `得意厳選\n(${lv})`, template: 'specialty', lv, percent: true })

      if (config.pokemonList.selectEnergy) {
        result.push({ key: `specialty_num_${lv}`, name: `得意数量\n(${lv})`, template: 'specialty_num', lv, type: Number })
      }
    }
  }

  if (config.pokemonList.candy) {
    result.push(
      { key: 'candy', name: '所持ｱﾒ', convert: x => config.candy.bag[x.base.candyName] },
      { key: 'training', name: '目標Lv', convert: x => x?.box.training },
      { key: 'nextExp', name: '次Lv迄\nのExp', convert: x => x?.box.nextExp },
      { key: 'normalCandyNum', name: '通常\nｱﾒ', type: Number },
      { key: 'normalCandyShard', name: '通常\nゆめかけ', type: Number },
      { key: 'boostCandyNum', name: 'ﾌﾞｰｽﾄ\nｱﾒ', type: Number },
      { key: 'boostCandyShard', name: 'ﾌﾞｰｽﾄ\nゆめかけ', type: Number },
      { key: 'bestBoostCandyNum', name: '最適\nﾌﾞｰｽﾄ', type: Number },
      { key: 'bestBoostCandyShard', name: '最適ﾌﾞｰｽﾄ\nゆめかけ', type: Number },
      { key: 'bestNormalCandyNum', name: '最適\n通常', type: Number },
      { key: 'bestNormalCandyShard', name: '最適通常\nゆめかけ', type: Number },
    )
  }

  if (config.pokemonList.baseInfo) {
    result.push(
      { key: 'afterList', name: '最終進化', convert: x => x.base.afterList },
      { key: 'berryName', name: 'きのみ', convert: x => x.base.berry.name },
      { key: 'skillName', name: 'スキル', convert: x => x.base.skill.name },
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
      // { key: 'dayHelpRate', name: '日中おてつ\nだい倍率', type: Number, percent: true },
      { key: 'dayHelpNum', name: '日中おてつ\nだい回数', type: Number, fixed: 2 },
      // { key: 'nightHelpRate', name: '夜間おてつ\nだい倍率', type: Number, percent: true },
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
      { key: 'bag', name: '所持\n数', type: Number },
      { key: 'bagFullHelpNum', name: 'いつ育\n到達回数', type: Number, fixed: 1 },
      { key: 'normalHelpNum', name: '通常おてつ\nだい回数', type: Number, fixed: 2 },
      { key: 'berryHelpNum', name: 'いつ育おてつ\nだい回数', type: Number, fixed: 2 },
      { key: 'fixedSkillLv', name: '補正後\nスキルLv', type: Number },
      { key: 'skillRate', name: 'スキル確率', type: Number, percent: true, fixed: 2 },
      { key: 'ceilSkillRate', name: '天井補正\nスキル確率', type: Number, percent: true, fixed: 2 },
      { key: 'skillPerDay', name: 'スキル\n回数/日', type: Number, fixed: 2 },
      { key: 'skillEnergyPerDay', name: 'スキル\nエナジー/日', type: Number, fixed: 1 },
      { key: 'shard', name: 'スキル\nゆめかけ/日', type: Number, fixed: 1 },
      { key: 'energyPerDay', name: 'エナジー\n/日', type: Number, fixed: 1 },
      { key: 'supportEnergyPerDay', name: 'サポート\nエナジー/日', type: Number, fixed: 1 },
      { key: 'supportShardPerDay', name: 'サポート\nゆめかけ/日', type: Number, fixed: 1 },
    )
  }

  return result;
})

async function showEditPopup(pokemon) {
  await asyncWatcher.wait;
  if(await Popup.show(EditPokemonPopup, { index: pokemon.box.index, evaluateTable, simulatedPokemonList: simulatedPokemonList.value })) {
    createPokemonList()
  }
}

async function addPokemon() {
  await asyncWatcher.wait;
  if(await Popup.show(EditPokemonPopup, { evaluateTable, simulatedPokemonList: simulatedPokemonList.value })) {
    createPokemonList()
  }
}

async function showTsvPopup() {
  if(await Popup.show(PokemonBoxTsvPopup)) {
    createPokemonList()
  }
}

async function showGoogleSpreadsheetPopup() {
  if(await Popup.show(GoogleSpreadsheetPopup)) {
    createPokemonList()
  }
}

function deletePokemon(index) {
  if (confirm(`${PokemonBox.list[index].name}(Lv${PokemonBox.list[index].lv})を削除します。よろしいですか？`)) {
    PokemonBox.delete(index);
    createPokemonList()
  }
}

async function toggleFix(data, newValue) {
  let pokemon = PokemonBox.list[data.box.index]
  if (newValue !== undefined) pokemon.fix = newValue;
  else if(pokemon.fix == null) pokemon.fix = 1;
  else if(pokemon.fix == 1) pokemon.fix = -1;
  else if(pokemon.fix == -1) pokemon.fix = null;
  data.fix = pokemon.fix;
  PokemonBox.post(pokemon, data.box.index)
  createPokemonList()
}

function updateGrowthInfo(data) {
  let pokemon = PokemonBox.list[data.box.index]
  PokemonBox.post(pokemon, data.box.index)

  processSimulatedPokemonList();
}

// 厳選詳細ポップアップを表示
function showSelectDetail(pokemon, after, lv) {
  Popup.show(SelectTableDetailPopup, {
    name: after,
    lv,
    foodIndexList: pokemon.box.foodList.map(f => Math.max(pokemon.base.foodList.findIndex(f2 => f2.name == f)), 0),
    subSkillList: pokemon.box.subSkillList,
    nature: pokemon.nature,
  })
}

</script>

<template>
  <div class="page">

    <div class="flex-row-start-start flex-wrap gap-5px">
      <CommonSetting @requireReload="createPokemonList(true)" />
      
      <SettingButton title="表示設定">
        <template #label>
          <div class="inline-flex-row-center">
            表示設定
          </div>
        </template>

        <SettingTable>
          <tr><th>サブスキル名省略</th><td><label><input type="checkbox" v-model="config.pokemonList.subSkillShort" />サブスキル名省略</label></td></tr>
          <tr>
            <th>厳選</th>
            <td>
              <div>
                <label><input type="checkbox" v-model="config.simulation.selectInfo" />厳選度</label>
                <div class="w-300px">
                  <small>厳選設定に基づいて計算されたエナジーでの厳選度を表示します。</small>
                </div>
              </div>
              <div class="mt-5px">
                <label><input type="checkbox" v-model="config.simulation.specialtySelectInfo" />とくい厳選度</label>
                <div class="w-300px">
                  <small>とくい分野の数値だけに限り評価した値です。<br>きのみ得意の場合はきのみの数、食材得意の場合は食材の数、スキル得意の場合はスキルの発動期待値で評価しています。</small>
                </div>
              </div>
              <div class="mt-5px">
                <label><input type="checkbox" v-model="config.pokemonList.selectEnergy" />厳選元値表示</label>
                <div class="w-300px">
                  <small>厳選度の場合はエナジー、とくい厳選度の場合はその分野の数量を表示するかどうかのオプションです。</small>
                </div>
              </div>
              <div class="mt-5px">
                <label><input type="checkbox" v-model="config.pokemonList.selectDetail" />最適でない進化先の厳選値も表示</label>
                <div class="w-300px">
                  <small>進化先が複数あるポケモンについて、最も適正が高い進化先以外の結果もすべて表示します。</small>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <th>アメ情報</th>
            <td>
              <div class="flex-column gap-5px">
                <div><label><input type="checkbox" v-model="config.pokemonList.candy" />アメ情報</label></div>
                <div>ブーストEXP倍率&nbsp;<input type="number" class="w-50px" v-model="config.candy.boostMultiply"> 倍</div>
                <div>ブーストかけら倍率&nbsp;<input type="number" class="w-50px" v-model="config.candy.boostShard"> 倍</div>
              </div>
            </td>
          </tr>
          <tr><th>基礎情報</th><td><label><input type="checkbox" v-model="config.pokemonList.baseInfo" />基礎情報</label></td></tr>
          <tr><th>食材数</th><td><label><input type="checkbox" v-model="config.pokemonList.foodInfo" />食材数</label></td></tr>
          <tr><th>シミュ詳細</th><td><label><input type="checkbox" v-model="config.pokemonList.simulatedInfo" />シミュ詳細</label></td></tr>
          <tr>
            <th>表示設定</th>
            <td>
              <div><label><input type="checkbox" v-model="config.pokemonList.fixScore" />スコアまで列固定</label></div>
              <div class="mt-5px">1ページ表示件数&nbsp;<input type="number" class="w-50px" v-model="config.pokemonList.pageUnit"> 件</div>
            </td>
          </tr>
        </SettingTable>
      </SettingButton>
    </div>

    <div class="pokemon-list mt-10px">

      <AsyncWatcherArea :asyncWatcher="asyncWatcher">
        <SortableTable :dataList="simulatedPokemonList" :columnList="columnList" v-model:setting="config.sortableTable.pokemonList2"
          :fixColumn="config.pokemonList.fixScore ? 10 : 4"
          :pager="config.pokemonList.pageUnit"
          scroll
        >

          <template #edit="{ data }">
            <div class="flex-row-start-center gap-3px">
              <svg viewBox="0 0 100 100" width="16" @click="showEditPopup(data)">
                <path d="M0,100 L0,80 L60,20 L80,40 L20,100z M65,15 L80,0 L100,20 L85,35z" fill="#888" />
              </svg>
              <template v-if="(config.sortableTable.pokemonList2.sort.length == 1 && config.sortableTable.pokemonList2.sort[0].key == 'index') || config.sortableTable.pokemonList2.sort.length == 0">
                <svg viewBox="0 0 100 100" width="14" @click="PokemonBox.move(data.box.index, -(config.sortableTable.pokemonList2.sort[0]?.direction ?? 1)); createPokemonList()">
                  <path d="M0,70 L50,20 L100,70z" fill="#888" />
                </svg>
                <svg viewBox="0 0 100 100" width="14" @click="PokemonBox.move(data.box.index, config.sortableTable.pokemonList2.sort[0]?.direction ?? 1); createPokemonList()">
                  <path d="M0,30 L50,80 L100,30z" fill="#888" />
                </svg>
              </template>
              <svg viewBox="0 0 100 100" width="14" @click="deletePokemon(data.box.index)">
                <path d="M10,30 L10,15 L40,15 L40,0 L60,0 L60,15 L90,15 L90,30z M30,100 L20,40 L80,40 L70,100" fill="#888" />
              </svg>
              <div title="チームのシミュレーションで固定・除外する設定">
                <!-- Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
                <svg v-if="data.box?.fix == null" viewBox="0 -110 640 640" width="16" @click="toggleFix(data)" @contextmenu.prevent="toggleFix(data, null)"><path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" fill="#888"/></svg>
                <svg v-if="data.box?.fix ==    1" viewBox="0 -110 640 640" width="16" @click="toggleFix(data)" @contextmenu.prevent="toggleFix(data, null)"><path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" fill="#6C4"/></svg>
                <svg v-if="data.box?.fix ==   -1" viewBox="0 -110 640 640" width="16" @click="toggleFix(data)" @contextmenu.prevent="toggleFix(data, null)"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L353.3 251.6C407.9 237 448 187.2 448 128C448 57.3 390.7 0 320 0C250.2 0 193.5 55.8 192 125.2L38.8 5.1zM264.3 304.3C170.5 309.4 96 387.2 96 482.3c0 16.4 13.3 29.7 29.7 29.7H514.3c3.9 0 7.6-.7 11-2.1l-261-205.6z" fill="#E40"/></svg>
              </div>
            </div>
          </template>

          <template #header.edit>
            <help-button style="color: #FFF;" title="この列について" markdown="この列でソートするとPTシミュへの固定/除外でソートできます。"></help-button>
          </template>

          <template #header.energyPerDay>
            エナジー<br>/日
            <help-button
              style="color: #FFF;" title="エナジー/日"
              markdown="おてつだいボーナスや他ポケモンに影響を与えるスキルの効果を抜きにして、自分自身だけで稼げるエナジーです。"
            />
          </template>

          <template #header.supportEnergyPerDay>
            サポート<br>エナジー/日
            <help-button
              style="color: #FFF;" title="サポートスコア/日"
              markdown="おてつだいボーナスやげんき回復系スキル、おてつだいサポートなどによる他ポケモンの効率上昇によって、追加で得られるであろうエナジーです。"
            />
          </template>

          <template #header.supportShardPerDay>
            サポート<br>ゆめかけ/日
            <help-button
              style="color: #FFF;" title="サポートゆめかけ/日"
              markdown="おてつだいボーナスやげんき回復系スキルによる他ポケモンの効率上昇、もしくはゆめのかけらボーナスやリサーチEXPボーナスによって、得られるであろうゆめのかけらの量です。
                現状の実装ではリサーチEXPボーナスもゆめのかけらとして扱ってこの値に含めています。
              "
            />
          </template>

          <template #index="{ data }">
            {{ data.box.index + 1 }}
          </template>

          <template #name="{ data }">
            <NameLabel :pokemon="data" />
          </template>

          <template #lv="{ data }">
            <LvLabel :pokemon="data" />
          </template>

          <template #foodNameList="{ data }">
            <div class="flex-row-center-center gap-2px">
              <div v-for="(food, i) of data.box.foodList"
                class="food"
                :class="{
                  disabled: i >= data.foodList.length,
                  error: data.base.foodNumListMap[food]?.[i] == null && food != null,
                }"
              >
                <template v-if="food">
                  <img :src="Food.map[food].img" />
                  <div class="num">{{ data.base.foodNumListMap[food]?.[i] }}</div>
                </template>
              </div>
            </div>
          </template>

          <template #skillLv="{ data }">
            <SkillLvLabel :pokemon="data" />
          </template>

          <template #subSkill="{ data }">
            <SubSkillLabelList class="sub-skill-list" :pokemon="data" />
          </template>

          <template #natureName="{ data }">
            <NatureInfo :nature="data.nature" />
          </template>

          <template #evaluate="{ data, column }">
            <EvaluateResult :pokemon="data" :lv="column.lv" />
          </template>

          <template #evaluate_energy="{ data, column }">
            <EvaluateResult :pokemon="data" :lv="column.lv" field="energy" />
          </template>

          <template #specialty="{ data, column }">
            <EvaluateResult :pokemon="data" :lv="column.lv" type="evaluateSpecialty" />
          </template>

          <template #specialty_num="{ data, column }">
            <EvaluateResult :pokemon="data" :lv="column.lv" type="evaluateSpecialty" field="num" />
          </template>

          <template #candy="{ data, column }">
            <input type="number" class="w-50px" v-model="config.candy.bag[data.base.candyName]" />
          </template>

          <template #training="{ data, column }">
            <input type="number" class="w-50px" v-model="PokemonBox.list[data.box.index].original.training" @input="updateGrowthInfo(data)" />
          </template>

          <template #nextExp="{ data, column }">
            <input type="number" class="w-50px" v-model="PokemonBox.list[data.box.index].original.nextExp" @input="updateGrowthInfo(data)" />
          </template>

          <!-- <template #nextExp="{ data, column }">
            <input type="number" class="w-50px" v-model="data.nextExp" @input="updateGrowthInfo(data)" />
          </template> -->

          <template #afterList="{ data, column }">
            <div style="width: 12em; font-size: 80%;">
              {{ data.base.afterList.length > 1 ? data.base.afterList[0] + '等' : data.base.afterList[0] }}
            </div>
          </template>

        </SortableTable>
      </AsyncWatcherArea>

      <div class="flex-row-start-center gap-5px">
        <button @click="addPokemon">ポケモン新規追加</button>
        <div>
          PTシミュは別ページに移りました
        </div>
        <!-- <button @click="simulationPrepareTeam">準備シミュ</button> -->
        <button @click="showGoogleSpreadsheetPopup" class="ml-auto">Googleスプレッドシート連携</button>
        <button @click="showTsvPopup">TSVインポート/エクスポート</button>
      </div>
    </div>


  </div>
</template>

<style lang="scss" scoped>

.page {
  display: flex;
  flex-direction: column;
  height: 100%;

  .pokemon-list {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    gap: 5px;

    label {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
    }

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
    .sortable-table {
      flex: 1 1 0;
    }
  }
}

</style>