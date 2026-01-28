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
import type { SimulatedPokemon } from '@/type.ts';
import Field from '@/data/field.ts';

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


// 設定から生成したチェックリスト
const list = ref(0);

const pokemonCheckList = computed(() => {
  const result = [];
  for (const item of config.summary.checklist.pokemonCondition.list) {
    const foodList: string[] = [];
    if (item.aaa) foodList.push('AAA');
    if (item.aab) foodList.push('AAB');
    if (item.aac) foodList.push('AAC');
    if (item.aba) foodList.push('ABA');
    if (item.abb) foodList.push('ABB');
    if (item.abc) foodList.push('ABC');
    const foodName = foodList.length == 6 ? '全て' : foodList.join('/');
    let pokemonList = null;

    if (item.type == 0) {
      pokemonList = filteredSaishuuShinkaPokemonList.value;
    }
    if (item.type == 1) {
      pokemonList = filteredSaishuuShinkaPokemonList.value.filter(p => p.specialty == item.target);
    }
    if (item.type == 2) {
      pokemonList = filteredSaishuuShinkaPokemonList.value.filter(p => p.name == item.target);
    }
    if (pokemonList != null) {
      for(let pokemon of pokemonList) {
        const hitPokemonList = simulatedPokemonList.value.flatMap(simulatedPokemon => {
          if (
            simulatedPokemon.evaluateResult[config.summary.checklist.pokemonCondition.selectLv]?.[pokemon.name]?.energy.score == null
            || simulatedPokemon.evaluateResult[config.summary.checklist.pokemonCondition.selectLv]?.[pokemon.name]?.specialty.score == null
            || foodList.indexOf(simulatedPokemon.foodCombination!) == -1
          ) return [];

          // 厳選度チェック
          let score = Number.NEGATIVE_INFINITY;
          if (item.energyBorder != null) {
            score = Math.max(score, simulatedPokemon.evaluateResult[config.summary.checklist.pokemonCondition.selectLv][pokemon.name].energy.score - item.energyBorder / 100);
          }
          if (item.specialtyBorder != null) {
            score = Math.max(score, simulatedPokemon.evaluateResult[config.summary.checklist.pokemonCondition.selectLv][pokemon.name].specialty.score - item.specialtyBorder / 100);
          }
          return [{ pokemon: simulatedPokemon, score }];
        }).sort((a, b) => b.score - a.score);

        const checked = hitPokemonList?.[0]?.score >= 0;
        const hitPokemon = hitPokemonList?.[0]?.pokemon;

        result.push({
          base: pokemon,
          name: pokemon.name,
          subName: foodName,
          checked,
          pokemon: hitPokemon,
          target: [(item.energyBorder != null ? `総合${item.energyBorder}%以上` : null), (item.specialtyBorder != null ? `とくい${item.specialtyBorder}%以上` : null)].join('\n'),
          energyScore: hitPokemon?.evaluateResult[config.summary.checklist.pokemonCondition.selectLv][pokemon.name].energy.score,
          specialtyScore: hitPokemon?.evaluateResult[config.summary.checklist.pokemonCondition.selectLv][pokemon.name].specialty.score,
        })
      }
    }
  }

  return {
    dataList: result,
    columnList: [
      { key: 'name', name: '厳選対象' },
      { key: 'specialty', name: 'とくい', type: String, convert: x => x.base?.specialty ?? '' },
      { key: 'berry', name: 'きのみ', type: String, convert: x => x.base?.berry.name ?? '' },
      { key: 'type', name: 'タイプ', type: String, convert: x => x.base?.berry.type ?? '' },
      { key: 'subName', name: '食材構成' },
      { key: 'target', name: '目標' },
      { key: 'checked', name: '厳選済', type: String, convert: x => x.checked ? '済' : '' },
      { key: 'energyScore', name: '総合厳選度', percent: true },
      { key: 'specialtyScore', name: 'とくい厳選度', percent: true },
      { key: 'pokemon', name: 'ポケモン' },
    ],
    targetPokemonList: result.filter(x => !x.checked).map(x => x.name),
  }
})

const foodCheckList = computed(() => {
  const result = [];

  // 事前整理
  const foodScorePokemonMap: Record<string, any[]> = {};
  for(const simulatedPokemon of simulatedPokemonList.value) {
    for(let [name, { food }] of Object.entries(simulatedPokemon.evaluateResult[config.summary.checklist.food.borderLv] ?? {})) {
      if (Pokemon.map[name]) {
        const foodNumMap = {};
        let totalNum = 0;
        simulatedPokemon.box?.foodList.forEach((name, index) => {
          const num = simulatedPokemon.base.foodList.find(x => x.name == name)?.numList[index] ?? 0;
          foodNumMap[name] = (foodNumMap[name] ?? 0) + num;
          totalNum += num;
        })

        for(const key in foodNumMap) {
          const score = foodNumMap[key] / totalNum * food.value;
          if (foodScorePokemonMap[key] == null) foodScorePokemonMap[key] = [];
          foodScorePokemonMap[key].push({
            score,
            pokemon: simulatedPokemon,
          })
        }
      }
    }
  };

  const bestFoodScoreMap: Record<string, any[]> = {};
  for(let [name, lvMap] of Object.entries(promisedEvaluateTable.value)) {
    const pokemon = Pokemon.map[name];
    for(let [foodCombination, { food }] of Object.entries(lvMap[config.summary.checklist.food.borderLv] ?? {})) {

      const foodNumMap = {};
      let totalNum = 0;
      foodCombination.split('').forEach((abc, index) => {
        const food = pokemon.foodList[Number(abc)];
        foodNumMap[food.name] = (foodNumMap[food.name] ?? 0) + food.numList[index];
        totalNum += food.numList[index];
      })

      for(const key in foodNumMap) {
        const score = foodNumMap[key] / totalNum * food[100];
        if (bestFoodScoreMap[key] == null) bestFoodScoreMap[key] = [];
        bestFoodScoreMap[key].push({
          score,
          pokemon: pokemon,
          foodCombination: foodCombination,
        })
      }
    }
  }
  
  for(const food of Food.list) {
    if (
      bestFoodScoreMap[food.name] != null
      && config.summary.checklist.food.enableMap[food.name]
      && foodScorePokemonMap[food.name] != null
    ) {
      bestFoodScoreMap[food.name].sort((a, b) => b.score - a.score);
      foodScorePokemonMap[food.name].sort((a, b) => b.score - a.score);

      const maxNum = Math.max(...Cooking.list.map(x => x.foodList.find(f => f.name == food.name)?.num ?? 0), 0);
      const bestFoodScore = config.summary.checklist.food.borderType == 0
        ? bestFoodScoreMap[food.name]?.[0]?.score ?? 0
        : maxNum;
      const border = bestFoodScore * (config.summary.checklist.food.borderValue / 100);
      const targetBorder = bestFoodScore * (config.summary.checklist.food.targetValue / 100);

      let hitPokemon = foodScorePokemonMap[food.name][0];
      let checked = hitPokemon?.score >= border;
      let targetPokemonList = bestFoodScoreMap[food.name].filter(x => x.score >= targetBorder);
      result.push({
        food,
        bestFoodScore,
        maxNum: maxNum * 3,
        border,
        score: hitPokemon?.score,
        checked,
        pokemon: hitPokemon?.pokemon,
        rate: hitPokemon?.score / bestFoodScore,
        note: targetPokemonList.map(x => `${x.pokemon.name}${x.foodCombination.split('').map(x => String.fromCharCode(Number(x) + 65)).join('')} (${x.score.toFixed(1)})`).join('\n'),
        targetPokemonList,
      })
    }
  }

  return {
    dataList: result,
    columnList: [
      { key: 'food', name: '厳選対象', type: String, convert: x => x.food.name ?? '' },
      { key: 'bestFoodScore', name: '理論値', type: Number, fixed: 1 },
      { key: 'maxNum', name: '最大必要数✕3', type: Number, fixed: 0 },
      { key: 'border', name: '基準値', type: Number, fixed: 1 },
      { key: 'note', name: '対象ポケモン＋理論値' },
      { key: 'checked', name: '厳選済', type: String, convert: x => x.checked ? '済' : '' },
      { key: 'score', name: '最良個数', type: Number, fixed: 1 },
      { key: 'rate', name: '最良個数/最大値', percent: true },
      { key: 'pokemon', name: '最良ポケモン' },
    ],
    targetPokemonList: result.filter(x => !x.checked).flatMap(x => x.targetPokemonList).map(x => x.pokemon.name),
  }
})

const skillCheckList = computed(() => {
  const result = [];

  // 事前整理
  const skillScorePokemonMap: Record<string, any[]> = {};
  for(const simulatedPokemon of simulatedPokemonList.value) {
    for(let [name, { skill }] of Object.entries(simulatedPokemon.evaluateResult[config.summary.checklist.skill.borderLv] ?? {})) {
      if (Pokemon.map[name]) {
        const skillName = Pokemon.map[name].skill.name;
        const score = skill.value;
        if (skillScorePokemonMap[skillName] == null) skillScorePokemonMap[skillName] = [];
        skillScorePokemonMap[skillName].push({
          score,
          pokemon: simulatedPokemon,
        })
      }
    }
  };

  const bestSkillScoreMap: Record<string, any[]> = {};
  for(let [name, lvMap] of Object.entries(promisedEvaluateTable.value)) {
    const pokemon = Pokemon.map[name];
    if (pokemon) {
      const skillName = pokemon.skill.name;
      let score = 0;
      for(let [_, { skill }] of Object.entries(lvMap[config.summary.checklist.skill.borderLv] ?? {})) {
        score = Math.max(score, skill[100]);
      }
      if (bestSkillScoreMap[skillName] == null) bestSkillScoreMap[skillName] = [];
      bestSkillScoreMap[skillName].push({
        score,
        pokemon: pokemon,
      })
    }
  }
  
  for(const skill of Skill.list) {
    if (
      bestSkillScoreMap[skill.name] != null
      && config.summary.checklist.skill.enableMap[skill.name]
      && skillScorePokemonMap[skill.name] != null
    ) {
      bestSkillScoreMap[skill.name].sort((a, b) => b.score - a.score);
      skillScorePokemonMap[skill.name].sort((a, b) => b.score - a.score);

      const bestSkillScore = bestSkillScoreMap[skill.name]?.[0]?.score ?? 0;
      const border = bestSkillScore * (config.summary.checklist.skill.borderValue / 100);
      const targetBorder = bestSkillScore * (config.summary.checklist.skill.targetValue / 100);

      let hitPokemon = skillScorePokemonMap[skill.name][0];
      let checked = hitPokemon?.score >= border
      let targetPokemonList = bestSkillScoreMap[skill.name].filter(x => x.score >= targetBorder);

      result.push({
        skill: skill,
        bestSkillScore,
        border,
        score: hitPokemon?.score,
        checked,
        pokemon: hitPokemon?.pokemon,
        rate: hitPokemon?.score / bestSkillScore,
        note: targetPokemonList.map(x => `${x.pokemon.name} (${x.score.toFixed(1)})`).join('\n'),
        targetPokemonList,
      })
    }
  }

  return {
    dataList: result,
    columnList: [
      { key: 'skill', name: '厳選対象', type: String, convert: x => x.skill.name ?? '' },
      { key: 'bestSkillScore', name: '理論値', type: Number, fixed: 1 },
      { key: 'skillBorder', name: '基準値', type: Number, fixed: 1 },
      { key: 'note', name: '対象ポケモン＋理論値' },
      { key: 'checked', name: '厳選済', type: String, convert: x => x.checked ? '済' : '' },
      { key: 'score', name: '最良回数', type: Number, fixed: 1 },
      { key: 'rate', name: '最良回数/最大値', percent: true },
      { key: 'pokemon', name: '最良ポケモン' },
    ],
    targetPokemonList: result.filter(x => !x.checked).flatMap(x => x.targetPokemonList).map(x => x.pokemon.name),
  }
})

const checklist = computed(() => {
  if (list.value === 0) {
    return pokemonCheckList.value;
  }

  if (list.value == 1) {
    console.log(foodCheckList.value)
    return foodCheckList.value;
  }

  if (list.value == 2) {
    return skillCheckList.value;
  }

  return {
    dataList: [],
    columnList: [],
    targetPokemonList: [],
  }
})

const fieldList = computed(() => {
  const targetPokemonSet = new Set([
    ...pokemonCheckList.value.targetPokemonList,
    ...foodCheckList.value.targetPokemonList,
    ...skillCheckList.value.targetPokemonList,
  ]);

  let pokemonList = Pokemon.list.filter(pokemon => {
    if (!config.summary.checklist.field.shinkago && pokemon.evolve.before != null) return false;

    for(const after of pokemon.afterList) {
      if (targetPokemonSet.has(after)) {
        return true;
      }
    }

    return false;
  }).map(pokemon => ({
    ...pokemon,
  }))

  if (config.summary.checklist.field.bakecchaMatome && pokemonList.some(x => x.name.startsWith('バケッチャ'))) {
    const bakecchaList = pokemonList.filter(x => x.name.startsWith('バケッチャ'));
    pokemonList = pokemonList.filter(x => !x.name.startsWith('バケッチャ'));
    pokemonList.push({
      ...bakecchaList[0],
      name: 'バケッチャ',
    })
  }

  return {
    dataList: [
      ...Field.list.map(x => x.name),
      ...Field.list.filter(x => x.ex).map(x => `${x.name}EX`),
    ].map(fieldName => {
      return {
        name: fieldName,
        'うとうと': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'うとうと')),
        'すやすや': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'すやすや')),
        'ぐっすり': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'ぐっすり')),
      }
    }),
    columnList: [
      { key: 'name', name: 'フィールド' },
      { key: 'type1', name: 'うとうと', type: String, convert: x => x['うとうと'].map(p => p.name).join('\n') },
      { key: 'type2', name: 'すやすや', type: String, convert: x => x['すやすや'].map(p => p.name).join('\n') },
      { key: 'type3', name: 'ぐっすり', type: String, convert: x => x['ぐっすり'].map(p => p.name).join('\n') },
      { key: 'type1_num', name: 'うとうと(匹)', type: Number, convert: x => x['うとうと'].length },
      { key: 'type2_num', name: 'すやすや(匹)', type: Number, convert: x => x['すやすや'].length },
      { key: 'type3_num', name: 'ぐっすり(匹)', type: Number, convert: x => x['ぐっすり'].length },
      { key: 'num', name: '合計(匹)', type: Number, convert: x => x['うとうと'].length + x['すやすや'].length + x['ぐっすり'].length },
      { key: 'ave', name: '相乗平均(匹)', type: Number, fixed: 1, convert: x => (x['うとうと'].length * x['すやすや'].length * x['ぐっすり'].length) ** (1/3) },
    ],
  }
})

</script>

<template>
  <div class="page">
    
    <div>
      <SettingButton title="厳選チェックリスト設定">
        <template #label>
          厳選チェックリスト設定
        </template>

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
                  <svg viewBox="0 0 100 100" width="14" @click="config.summary.checklist.pokemonCondition.list.splice(index, 1)">
                    <path d="M10,30 L10,15 L40,15 L40,0 L60,0 L60,15 L90,15 L90,30z M30,100 L20,40 L80,40 L70,100" fill="#888" />
                  </svg>
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
                  <div class="gap-5px" style="display: grid; grid-template-columns: repeat(2, 265px);">
                    <InputCheckbox
                      v-for="skill in Skill.list"
                      v-model="config.summary.checklist.skill.enableMap[skill.name]"
                    >
                      {{ skill.name }}
                    </InputCheckbox>
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
      </SettingButton>
    </div>
    
    <div class="tab-list mt-10px">
      <div @click="list = 0" :class="{ active: list == 0 }" class="cursor-pointer">ポケモン</div>
      <div @click="list = 1" :class="{ active: list == 1 }" class="cursor-pointer">食材</div>
      <div @click="list = 2" :class="{ active: list == 2 }" class="cursor-pointer">スキル</div>
      <div @click="list = 3" :class="{ active: list == 3 }" class="cursor-pointer">フィールド別</div>
    </div>

    <!-- チェックリスト表示 -->
    
    <div class="pokemon-list mt-10px">
      <AsyncWatcherArea :asyncWatcher="asyncWatcher" class="flex-110 flex-column">
        <template v-if="list < 3">
          <SortableTable
            :key="list"
            class="flex-110"
            :dataList="checklist.dataList"
            :columnList="checklist.columnList"
            scroll
          >
            <template #pokemon="{ value }">
              <PokemonInfo :pokemon="value" nature />
            </template>
            <template #foodList="{ data, value }">
              <FoodList :pokemon="data" />
            </template>
            <template #food="{ data, value }">
              <img :src="data.food.img" class="w-20px h-20px" />{{ data.food.name }}
            </template>
            <template #berry="{ data, value }">
              <img :src="data.base.berry.img" class="w-20px h-20px" />{{ data.base.berry.name }}
            </template>
            <template #border="{ data, value }">
              {{ data.bestFoodScore.toFixed(1) }} ✕ {{ config.summary.checklist.food.borderValue }}% = {{ (data.bestFoodScore * (config.summary.checklist.food.borderValue / 100)).toFixed(1) }}
            </template>
            <template #skillBorder="{ data, value }">
              {{ data.bestSkillScore.toFixed(1) }} ✕ {{ config.summary.checklist.skill.borderValue }}% = {{ (data.bestSkillScore * (config.summary.checklist.skill.borderValue / 100)).toFixed(1) }}
            </template>
          </SortableTable>
        </template>
        <template v-if="list == 3">
          <SortableTable
            :key="list"
            class="flex-110"
            :dataList="fieldList.dataList"
            :columnList="fieldList.columnList"
            scroll
          >
          </SortableTable>
        </template>
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