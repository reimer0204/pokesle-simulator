<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  plugins
} from 'chart.js'
import Berry from '../data/berry';
import { Food, Cooking } from '../data/food_and_cooking';
import Pokemon from '../data/pokemon';
import Skill from '../data/skill';
import SubSkill from '../data/sub-skill';
import config from '../models/config';
import EvaluateTable from '../models/simulation/evaluate-table';
import HelpRate from '../models/help-rate';
import PokemonSimulator from '../models/simulation/pokemon-simulator';
import NatureInfo from './status/nature-info.vue';
import PopupBase from './util/popup-base.vue';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps({
  name: { type: String, required: true },
  lv: { type: Number, required: true },
  foodIndexList: { type: Array, required: true },
  subSkillList: { type: Array, required: true },
  nature: { type: Object, required: true },
  percentile: { type: Boolean, default: true },
})

const $emit = defineEmits(['close']);

const foodIndexList = computed(() => {
  return props.foodIndexList.slice(0, props.lv < 30 ? 1 : props.lv < 60 ? 2 : 3)
})

const evaluateTableLoaded = ref(false);
let evaluateTable = null;
(async () => {
  evaluateTableLoaded.value = false;
  evaluateTable = await EvaluateTable.load(config);
  evaluateTableLoaded.value = true;
})();

const percentile = computed(() => {
  return evaluateTable?.[props.name][props.lv][foodIndexList.value.slice(0, ).join('')] ?? null
})

let simulator: PokemonSimulator;
const simulatorLoaded = ref(false);
(async () => {
  await PokemonSimulator.isReady
  simulator = new PokemonSimulator(config, PokemonSimulator.MODE_SELECT)
  simulatorLoaded.value = true;
})()

const basePokemon = computed(() => Pokemon.map[props.name]);

// 厳選結果
const evaluateResult = computed(() => {
  if (!simulatorLoaded.value) return null;
  if (!evaluateTableLoaded.value) return null;

  const lv = props.lv;

  // サブスキルの組み合わせを列挙
  const subSkillNum = lv < 10 ? 0 : lv < 25 ? 1 : lv < 50 ? 2 : lv < 75 ? 3 : lv < 100 ? 4 : 5;
  let subSkillList: string[] = props.subSkillList;
  subSkillList = (config.selectEvaluate.silverSeedUse ? SubSkill.useSilverSeed(subSkillList) : subSkillList).slice(0, subSkillNum);

  const simulatedPokemon = simulator.fromEvaluate(
    basePokemon.value,
    props.lv,
    foodIndexList.value.map(f => basePokemon.value.foodList[f].name),
  )
  
  let result = simulator.selectEvaluate(
    simulatedPokemon, subSkillList.map(x => SubSkill.map[x]), props.nature,
    evaluateTable.scoreForHealerEvaluate[props.lv][''].energy, evaluateTable.scoreForSupportEvaluate[props.lv][''].energy)
  
  result.score = simulator.selectEvaluateToScore(
    result, 
    subSkillList.includes('ゆめのかけらボーナス'),
    subSkillList.includes('リサーチEXPボーナス')
  )
  result.evaluate = {
    energy: result.score,
    berry: result.berryNumPerDay,
    food: result.foodNumPerDay,
    skill: result.skillPerDay,
  }

  result.scoreForHealerEvaluate = evaluateTable.scoreForHealerEvaluate[lv][''].energy
  result.scoreForSupportEvaluate = evaluateTable.scoreForSupportEvaluate[lv][''].energy

  const helpRate = new HelpRate(config)
  result.healerHelpRate = helpRate.getHelpRate(result.otherHealList)
  result.defaultHelpRate = helpRate.getHelpRate([])

  return result;
})

const skillWeightList = computed(() => {
  return evaluateResult.value.skillWeightList.map(x => {
    return {
      ...x,
      lv: Math.min(evaluateResult.value.fixedSkillLv , x.skill.effect.length),
    }
  })
});

const graphList = computed(() => {
  let result = [
    { key: 'energy', name: '総合スコア' }
  ]
  if(basePokemon.value.specialty == 'きのみ') result.push({ key: 'berry', name: 'きのみ' })
  if(basePokemon.value.specialty == '食材'  ) result.push({ key: 'food', name: '食材' })
  if(basePokemon.value.specialty == 'スキル') result.push({ key: 'skill', name: 'スキル' })
  if(result.every(x => x.key != 'berry')) result.push({ key: 'berry', name: 'きのみ' })
  if(result.every(x => x.key != 'food' )) result.push({ key: 'food', name: '食材' })
  if(result.every(x => x.key != 'skill')) result.push({ key: 'skill', name: 'スキル' })
  return result;
})

const evaluateGraph = computed(() => {
  if (percentile.value == null) return null;
  
  let thisResult = {}

  for(const { key, name } of graphList.value) {
    const score = evaluateResult.value.evaluate[key];
    let upper = Math.min(percentile.value[key].findIndex(x => x >= score), 100);
    if (upper == -1) upper = 100
    const lower = Math.max(percentile.value[key].findLastIndex(x => x <= score), 0);
    const thisPercentile = percentile.value[key][lower] == percentile.value[key][upper]
      ? upper
      : (score - percentile.value[key][lower]) / (percentile.value[key][upper] - percentile.value[key][lower]) + lower

    let horizontalLinePlugin = undefined
    if (config.simulation.selectType == 1) {
      horizontalLinePlugin = [{
        id: 'horizontalLine',
        afterDraw: (chart) => {
          const yValue = chart.scales.y.getPixelForValue(percentile.value[key][config.simulation.selectBorder]);
          const ctx = chart.ctx;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(chart.chartArea.left, yValue);
          ctx.lineTo(chart.chartArea.right, yValue);
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }]
    };

    thisResult[key] = {
      data: {
        datasets: [
          {
            label: '本個体',
            backgroundColor: '#E00',
            data: [{x: thisPercentile, y: score}],
          },
          {
            label: `${name}厳選度`,
            backgroundColor: '#8DD',
            data: percentile.value[key].map((y, x) => ({ x, y })),
          },
        ]
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          x: {
            type: 'linear',
          },
          y: {
            type: 'linear',
            // beginAtZero: true,
          },
        },
      },
      plugins: horizontalLinePlugin,
    }
  }

   return thisResult;
})

const specialtyEvaluateGraph = computed(() => {
  let upper = Math.min(specialtyPercentile.value.findIndex(x => x >= evaluateResult.value.specialtyScore), 100);
  if (upper == -1) upper = 100
  const lower = Math.max(specialtyPercentile.value.findLastIndex(x => x <= evaluateResult.value.specialtyScore), 0);
  const thisPercentile = upper == lower ? lower : (evaluateResult.value.specialtyScore - specialtyPercentile.value[lower]) / (specialtyPercentile.value[upper] - specialtyPercentile.value[lower]) + lower

  let horizontalLinePlugin = undefined
  if (config.simulation.selectType == 1) {
    horizontalLinePlugin = [{
      id: 'horizontalLine',
      afterDraw: (chart) => {
        const yValue = chart.scales.y.getPixelForValue(specialtyPercentile.value[config.simulation.selectBorder]);
        const ctx = chart.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(chart.chartArea.left, yValue);
        ctx.lineTo(chart.chartArea.right, yValue);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }]
  };

  return {
    data: {
      datasets: [
        {
          label: '本個体',
          backgroundColor: '#E00',
          data: [{x: thisPercentile, y: evaluateResult.value.specialtyScore}],
        },
        {
          label: '厳選度',
          backgroundColor: '#8D8',
          data: specialtyPercentile.value.map((y, x) => ({ x, y })),
        },
      ]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        x: {
          type: 'linear',
        },
        y: {
          type: 'linear',
          // beginAtZero: true,
        },
      },
    },
    plugins: horizontalLinePlugin,
  }
})

</script>

<template>
  <PopupBase @close="$emit('close')">
    <template #headerText>{{ props.name }}(<template v-for="foodIndex in foodIndexList">
      <img class="food" :src="Food.map[basePokemon.foodNameList[foodIndex]]?.img" />
    </template>)の厳選詳細</template>

    <template v-if="evaluateResult">
      <h2>厳選スコア：{{ Math.round(evaluateResult.score).toLocaleString() }}</h2>

      <template v-for="{key, name} in graphList">
        <ToggleArea class="mt-10px" :open="props.percentile">
          <template #headerText>{{ name }}パーセンタイル</template>
          <div><Line class="w-100 h-300px" v-bind="evaluateGraph[key]" v-if="evaluateGraph?.[key]" /></div>
        </ToggleArea>
      </template>

      <ToggleArea class="mt-10px" open>
        <template #headerText>エナジー期待値計算</template>
        <table v-if="evaluateResult">
          <tr>
            <th rowspan="5">個体</th>
            <th>サブスキル</th>
            <td colspan="2">
              <div class="flex-row-start-center gap-5px">
                <SubSkillLabel v-for="subSkill in evaluateResult.subSkillList" :subSkill="subSkill" />
              </div>
            </td>
          </tr>
          <tr>
            <th>せいかく</th>
            <td colspan="2">
              <NatureInfo v-if="evaluateResult.nature" :nature="evaluateResult.nature" />
              <template v-else>無補正</template>
            </td>
          </tr>
          <tr>
            <th>食材確率</th>
            <td>
              {{ (evaluateResult.base.foodRate * 100).toFixed(1) }}%<br>
              <template v-if="evaluateResult.subSkillNameList.includes('食材確率アップS') || evaluateResult.subSkillNameList.includes('食材確率アップM')">
                × (100%{{ evaluateResult.subSkillNameList.includes('食材確率アップS') ? ' + 18%' : '' }}{{ evaluateResult.subSkillNameList.includes('食材確率アップM') ? ' + 36%' : '' }}) ※サブスキル<br>
              </template>
              <template v-if="evaluateResult.nature?.good == '食材お手伝い確率'">× 120% ※せいかく<br></template>
              <template v-if="evaluateResult.nature?.weak == '食材お手伝い確率'">× 80% ※せいかく<br></template>
            </td>
            <td>{{ (evaluateResult.foodRate * 100).toFixed(1) }}%</td>
          </tr>
          <tr>
            <th>所持数</th>
            <td>
              {{ evaluateResult.base.bag }}<br>
              <template v-if="evaluateResult.base.evolveLv > 1">+ 5 × {{ evaluateResult.base.evolveLv - 1 }} ※進化回数分<br></template>
              <template v-if="evaluateResult.subSkillNameList.includes('最大所持数アップS')">+ 6 ※最大所持数アップS<br></template>
              <template v-if="evaluateResult.subSkillNameList.includes('最大所持数アップM')">+ 12 ※最大所持数アップM<br></template>
              <template v-if="evaluateResult.subSkillNameList.includes('最大所持数アップL')">+ 18 ※最大所持数アップL<br></template>
              <template v-if="evaluateResult.sleepTime >= 2000">+ 8 ※睡眠2000時間<br></template>
              <template v-else-if="evaluateResult.sleepTime >= 1000">+ 6 ※睡眠1000時間<br></template>
              <template v-else-if="evaluateResult.sleepTime >=  500">+ 3 ※睡眠500時間<br></template>
              <template v-else-if="evaluateResult.sleepTime >=  200">+ 1 ※睡眠200時間<br></template>
            </td>
            <td>{{ evaluateResult.bag }}</td>
          </tr>
          <tr>
            <th>所持数最大まで<br>おてつだい回数</th>
            <td>
              {{ evaluateResult.bag }} ÷ (<br>
              &emsp;{{ evaluateResult.berryNum }} × (100% - {{ (evaluateResult.foodRate * 100).toFixed(1) }}%) ※きのみ分<br>
              &emsp;+ ({{ evaluateResult.foodList.map(x => x.num).join(' + ') }}) ÷ {{ evaluateResult.foodList.length }} × {{ (evaluateResult.foodRate * 100).toFixed(1) }}% ※食材分<br>
              )<br>
              + 4 (おてつだいキュー)<br>
            </td>
            <td>{{ (evaluateResult.bagFullHelpNum).toFixed(2) }}</td>
          </tr>

          <tr>
            <th rowspan="8">お手伝い</th>
            <th>おてつだいスピード</th>
            <td>
              {{ evaluateResult.base.help }}<br>
              × (100% - ({{ evaluateResult.lv }} - 1) × 0.2%) ※Lv補正<br>
              × (100% - {{ (evaluateResult.speedBonus * 100).toFixed(0) }}%)<br>
              <template v-if="evaluateResult.nature?.good == '手伝いスピード'">× 90% ※せいかく<br></template>
              <template v-if="evaluateResult.nature?.weak == '手伝いスピード'">× 107.5% ※せいかく<br></template>
            </td>
            <td>{{ (evaluateResult.speed).toFixed(0) }}</td>
          </tr>
          <tr>
            <th>げんき回復量</th>
            <td>
              {{ evaluateResult.allHealList.reduce((a, x) => a + x.effect, 0).toFixed(1) }}<br>
              <template v-if="evaluateResult.nature?.good == 'げんき回復量'">× 120% ※せいかく<br></template>
              <template v-else-if="evaluateResult.nature?.weak == 'げんき回復量'">× 88% ※せいかく<br></template>
              <template v-else>× 100% ※せいかく<br></template>
            </td>
            <td>{{ (evaluateResult.allHealList.reduce((a, x) => a + x.effect, 0) * evaluateResult.natureGenkiMultiplier).toFixed(1) }}</td>
          </tr>
          <tr>
            <th>日中手伝い回数</th>
            <td>
              (24 - {{ config.sleepTime }}) × 3600 ÷ {{ evaluateResult.speed }}<br>
              × {{ (evaluateResult.dayHelpNum / (24 - config.sleepTime) / 3600 * evaluateResult.speed * 100).toFixed(1) }}% ※げんき補正<br>
            </td>
            <td>{{ (evaluateResult.dayHelpNum).toFixed(2) }}</td>
          </tr>
          <tr>
            <th>夜間手伝い回数</th>
            <td>
              {{ config.sleepTime }} × 3600 ÷ {{ evaluateResult.speed }}<br>
              × {{ (evaluateResult.nightHelpNum / (config.sleepTime) / 3600 * evaluateResult.speed * 100).toFixed(1) }}% ※げんき補正<br>
            </td>
            <td>{{ (evaluateResult.nightHelpNum).toFixed(2) }}</td>
          </tr>
          <tr>
            <th>通常手伝い回数</th>
            <td>
              min({{ evaluateResult.dayHelpNum.toFixed(2) }} ÷ {{ config.checkFreq - 1 }}, {{ (evaluateResult.bagFullHelpNum).toFixed(2) }}) × {{ config.checkFreq - 1 }} ※{{ config.checkFreq - 1 }}は日中チェック回数から朝イチの1回を引いた数<br>
              + min({{ evaluateResult.nightHelpNum.toFixed(2) }}, {{ (evaluateResult.bagFullHelpNum).toFixed(2) }})<br>
            </td>
            <td>{{ (evaluateResult.normalHelpNum).toFixed(2) }}</td>
          </tr>
          <tr>
            <th>いつ育回数</th>
            <td>
              {{ (evaluateResult.dayHelpNum).toFixed(2) }} + {{ (evaluateResult.nightHelpNum).toFixed(2) }} - {{ (evaluateResult.normalHelpNum).toFixed(2) }}<br>
            </td>
            <td>{{ (evaluateResult.berryHelpNum).toFixed(2) }}</td>
          </tr>

          <tr>
            <th>きのみエナジー</th>
            <td>
              max({{ evaluateResult.base.berry.energy }} + {{ evaluateResult.lv }} - 1, {{ evaluateResult.base.berry.energy }} × 102.5% ^ ({{ evaluateResult.lv }} - 1))<br>
              × {{ evaluateResult.berryNum }} ※きのみの数<br>
              <template v-if="config.selectEvaluate.specialty[evaluateResult.base.specialty].berryEnergyRate != 100">× {{ config.selectEvaluate.specialty[evaluateResult.base.specialty].berryEnergyRate }}% ※好物補正<br></template>
              × ({{ (evaluateResult.normalHelpNum).toFixed(2) }} × (100% - {{ (evaluateResult.foodRate * 100).toFixed(1) }}%) + {{ (evaluateResult.berryHelpNum).toFixed(2) }}) ※通常手伝い×きのみ率＋いつ育<br>
            </td>
            <td>{{ evaluateResult.berryEnergyPerDay.toFixed(1) }}</td>
          </tr>

          <tr>
            <th>食材エナジー</th>
            <td>
              <template v-if="config.selectEvaluate.expectType.food == 0">
                {{ (evaluateResult.normalHelpNum).toFixed(2) }} × {{ (evaluateResult.foodRate * 100).toFixed(1) }}% ※通常手伝い×食材率<br>
                × (<br>
                <template v-for="(food, i) in evaluateResult.foodList">
                &emsp;<template v-if="i">+ </template>{{ Food.map[food.name].energy }} × {{ food.num }} × (({{ (Food.map[food.name].bestRate * 100).toFixed(0) }}% × {{ Cooking.maxRecipeBonus * 100 }}% - 100%) × {{ config.selectEvaluate.specialty[evaluateResult.base.specialty].foodEnergyRate }}% + 100%)<br>
                </template>
                )<br>
                ÷ {{ evaluateResult.foodList.length }}<br>
              </template>
              <template v-else>
                <template v-for="food in Food.list">
                  <template v-if="evaluateResult[food.name]">
                    {{ Food.map[food.name].energy }}エナジー × {{ evaluateResult[food.name].toFixed(1) }}個 × (({{ (Food.map[food.name].bestRate * 100).toFixed(0) }}% × {{ Cooking.maxRecipeBonus * 100 }}% - 100%) × {{ config.selectEvaluate.specialty[evaluateResult.base.specialty].foodEnergyRate }}% + 100%) ※{{ food.name }}<br>
                  </template>
                </template>
              </template>
            </td>
            <td>{{ evaluateResult.foodEnergyPerDay.toFixed(1) }}</td>
          </tr>

          <tr>
            <th :rowspan="evaluateResult.skillWeightList.length + 6">スキル</th>
            <th>スキル確率</th>
            <td>
              {{ (evaluateResult.base.skillRate * 100).toFixed(2) }}%<br>
              <template v-if="evaluateResult.subSkillNameList.includes('スキル確率アップS') || evaluateResult.subSkillNameList.includes('スキル確率アップM')">
                × (100%{{ evaluateResult.subSkillNameList.includes('スキル確率アップS') ? ' + 18%' : '' }}{{ evaluateResult.subSkillNameList.includes('スキル確率アップM') ? ' + 36%' : '' }}) ※サブスキル<br>
              </template>
              <template v-if="evaluateResult.nature?.good == 'メインスキル発生確率'">× 120% ※せいかく<br></template>
              <template v-if="evaluateResult.nature?.weak == 'メインスキル発生確率'">× 80% ※せいかく<br></template>
            </td>
            <td>{{ (evaluateResult.skillRate * 100).toFixed(2) }}%</td>
          </tr>
          <tr>
            <th>天井</th>
            <td>
              <template v-if="evaluateResult.base.specialty == 'スキル'">
                40 × 3600 ÷ {{ evaluateResult.base.help }}<br>
                ※スキルタイプは40時間÷基礎おてつだい時間(小数点以下の扱い不明)
              </template>
              <template v-else>
                スキルタイプ以外は78回固定
              </template>
            </td>
            <td>
              {{ evaluateResult.skillCeil }}
            </td>
          </tr>
          <tr>
            <th>天井補正後<br>スキル確率</th>
            <td>
              {{ (evaluateResult.skillRate * 100).toFixed(2) }}% ÷ (100% - (100% - {{ (evaluateResult.skillRate * 100).toFixed(2) }}%) ^ {{ evaluateResult.skillCeil }})<br>
            </td>
            <td>{{ (evaluateResult.ceilSkillRate * 100).toFixed(2) }}%</td>
          </tr>
          <tr>
            <th>スキル回数</th>
            <td>
              {{ (evaluateResult.ceilSkillRate * 100).toFixed(2) }}% × {{ (evaluateResult.normalHelpNum).toFixed(2) }}<br>
            </td>
            <td>{{ (evaluateResult.skillPerDay).toFixed(2) }}</td>
          </tr>
          <tr>
            <th>スキルLv</th>
            <td>
              {{ evaluateResult.skillLv }}
              <template v-if="evaluateResult.subSkillNameList.includes('スキルレベルアップS')">+ 1 (サブスキル)<br></template>
              <template v-if="evaluateResult.subSkillNameList.includes('スキルレベルアップM')">+ 2 (サブスキル)<br></template>
            </td>
            <td>{{ evaluateResult.fixedSkillLv }}</td>
          </tr>
          <tr v-for="{ skill, weight, lv } of skillWeightList">
            <th>{{ skill.name }}</th>
            <td>
              <template v-if="skill.name == 'エナジーチャージS' || skill.name == 'エナジーチャージS(ランダム)' || skill.name == 'エナジーチャージM'">
                {{ skill.effect[lv - 1] }}<br>
                <template v-if="evaluateResult.base.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
              </template>
              <template v-if="skill.name == '食材ゲットS'">
                (<br>
                <template v-for="(food, i) in Food.list">
                  {{ i ? '+ ' : '' }}{{ food.energy }} × (({{ (food.bestRate * 100).toFixed(0) }}% × {{ Cooking.maxRecipeBonus * 100 }}% - 100%) × {{ config.selectEvaluate.specialty[evaluateResult.base.specialty].foodGetRate }}% + 100%) ※{{ food.name }}<br>
                </template>
                )<br>
                ÷ {{ Food.list.length }}<br>
                × {{ skill.effect[lv - 1] }}<br>
                <template v-if="evaluateResult.base.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
              </template>
              
              <template v-if="skill.name == 'げんきチャージS'">
                げんき回復量で計算済み
              </template>
              
              <template v-if="skill.name == 'おてつだいサポートS' || skill.name == 'おてつだいブースト'">
                {{ evaluateResult.scoreForSupportEvaluate.toFixed(1) }} ※厳選度{{ config.selectEvaluate.supportBorder }}%の上位{{ config.selectEvaluate.supportRankNum }}%のおてつだいあたりのエナジーの平均値<br>
                <template v-if="skill.name == 'おてつだいブースト'">× {{ skill.effect[lv - 1].max }} × 5</template>
                <template v-else>× {{ skill.effect[lv - 1] }}</template><br>
                <template v-if="evaluateResult.base.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
              </template>
              
              <div v-if="skill.genki && skill.team" class="skill-description">
                <template v-if="evaluateResult.base.skill.name != 'ゆびをふる' || (evaluateResult.base.skill.name == 'ゆびをふる' && skill.name == 'げんきエールS')">
                  1日の1匹あたりの回復量：{{ evaluateResult.otherHealList.reduce((a, x) => a + x.effect, 0).toFixed(1) }}<br>
                  <!-- 起床時：{{ (result.otherMorningHealEffect * 100).toFixed(1) }}<br>
                  日中：{{ (result.otherDayHealEffect * 100).toFixed(1) }}<br> -->
                  <br>
                  {{ evaluateResult.scoreForHealerEvaluate.toFixed(1) }} ※厳選度{{ config.selectEvaluate.supportBorder }}%の上位{{ config.selectEvaluate.supportRankNum }}%のげんき補正なしエナジーの平均値<br>
                  × (<br>
                  &emsp;({{ (evaluateResult.healerHelpRate.day * 100).toFixed(1) }}% * (24 - {{ config.sleepTime }}) + {{ (evaluateResult.healerHelpRate.night * 100).toFixed(1) }}% * {{ config.sleepTime }}) ※ヒーラーありのおてつだい倍率<br>
                  &emsp;÷ ({{ (evaluateResult.defaultHelpRate.day * 100).toFixed(1) }}% * (24 - {{ config.sleepTime }}) + {{ (evaluateResult.defaultHelpRate.night * 100).toFixed(1) }}% * {{ config.sleepTime }}) ※ヒーラーなしのおてつだい倍率<br>
                  &emsp;- 1<br>
                  )<br>
                  × 4 ※4匹分<br>
                  ÷ {{ evaluateResult.skillPerDay.toFixed(2) }} ※スキル発動回数で割って1回あたりの効果にする<br>
                </template>
                <template v-else>
                  げんきエールSに含む
                </template>
              </div>

              <template v-if="skill.name == 'ゆめのかけらゲットS' || skill.name == 'ゆめのかけらゲットS(ランダム)'">
                {{ skill.effect[lv - 1] }}
                <template v-if="evaluateResult.base.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
                ＝ {{ (skill.effect[lv - 1] * weight).toFixed(1) }}
              </template>

              <div v-if="skill.name == '料理パワーアップS' || skill.name == 'マイナス(料理パワーアップS)'" class="skill-description">
                <template v-for="{ effect, num } in [
                  (() => {
                    let effect = (skill.name == '料理パワーアップS' ? skill.effect[lv - 1] : skill.effect[lv - 1].main)
                    let num = evaluateResult.skillPerDay / (evaluateResult.base.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1)
                    return {
                      effect,
                      num,
                    }
                  })()
                ]">
                  <template v-for="{ i, name, eachNum, limit, mainEffect, remainEffect } in [0, 1, 2].map(i => {
                    let eachNum = Math.floor(num / 3) + Math.min(Math.max(0, num - Math.floor(num / 3) * 3 - i), 1);
                    let limit = Cooking.maxFoodNum - Cooking.potMax;
                    let mainEffect = Cooking.cookingPowerUpEnergy * Math.min(limit, effect * eachNum)
                    let remainEffect = Food.averageEnergy * Math.max(effect * eachNum - limit, 0)
                    return {
                      i,
                      name: '朝昼晩'[i],
                      eachNum,
                      limit,
                      mainEffect,
                      remainEffect,
                    }
                  })">
                    <br v-if="i">
                    <div>{{ name }}：{{ effect }} × {{ eachNum.toFixed(2) }}回＝{{ (effect * eachNum).toFixed(1) }}</div>
                    <div>有効範囲エナジー：{{ Cooking.cookingPowerUpEnergy.toFixed(1) }} × min({{ limit }}, {{ (effect * eachNum).toFixed(1) }})＝{{ mainEffect.toFixed(1) }}</div>
                    <div>&emsp;余剰分エナジー：{{ Food.averageEnergy.toFixed(1) }} × max({{ (effect * eachNum).toFixed(1) }} - {{ limit }}, 0)＝{{ remainEffect.toFixed(1) }}</div>
                  </template>

                  <br>
                  <div>計：{{ evaluateResult.skillEnergyPerDay.toFixed(1) }}</div>
                  <div>1回あたりのエナジー：{{ evaluateResult.skillEnergyPerDay.toFixed(1) }} ÷ {{ num.toFixed(2) }}＝{{ (evaluateResult.skillEnergyPerDay / num).toFixed(1) }}</div>

                  <br>
                  <div>
                    ※{{ Cooking.cookingPowerUpEnergy.toFixed(1) }}は全料理中の最大エナジーと食材数{{ Cooking.potMax }}以下の最大エナジーの差を食材数の差で割った値
                  </div>
                </template>
              </div>

              <template v-if="skill.name == '料理チャンスS'">
                週の効果量<br>
                {{ skill.effect[lv - 1] }} × {{ evaluateResult.skillPerDay.toFixed(2) }} × 7<br>
                <template v-if="evaluateResult.base.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
                ＝{{ (skill.effect[lv - 1] * evaluateResult.skillPerDay * 7 / (evaluateResult.base.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1)).toFixed(1) }}<br>
                <br>
                ({{ Cooking.getChanceWeekEffect(skill.effect[lv - 1] * evaluateResult.skillPerDay * 7 / (evaluateResult.base.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1) / 100).total.toFixed(2) }}
                - 24.6) ※週の効果量から料理倍率の期待値を計算し、通常時からの増分を計算<br>
                × {{ Cooking.maxEnergy.toFixed(0) }} ※今一番いい料理<br>
                ÷ ({{ evaluateResult.skillPerDay.toFixed(2) }} × 7) ※週の発動回数で割って1回あたりの効果にする<br>
              </template>

            </td>
            <td>
              <template v-if="evaluateResult.skillEnergyMap[skill.name]">
                {{ evaluateResult.skillEnergyMap[skill.name]?.toFixed(0) }}
              </template>
            </td>
          </tr>
          <tr>
            <th>スキルエナジー</th>
            <td>
              {{ evaluateResult.skillEnergy.toFixed(0) }} × {{ evaluateResult.skillPerDay.toFixed(2) }}<br>
            </td>
            <td>{{ evaluateResult.skillEnergyPerDay.toFixed(1) }}</td>
          </tr>
          <tr>
            <th colspan="2">小計</th>
            <td>
              {{ evaluateResult.berryEnergyPerDay.toFixed(1) }}
              + {{ evaluateResult.foodEnergyPerDay.toFixed(1) }}
              + {{ evaluateResult.skillEnergyPerDay.toFixed(1) }}<br>
            </td>
            <td>{{ (evaluateResult.berryEnergyPerDay + evaluateResult.foodEnergyPerDay + evaluateResult.skillEnergyPerDay).toFixed(0) }}</td>
          </tr>
          <tr>
            <th colspan="2">総計</th>
            <td>
              {{ (evaluateResult.berryEnergyPerDay + evaluateResult.foodEnergyPerDay + evaluateResult.skillEnergyPerDay).toFixed(0) }}<br>
              <!-- <template v-if="result.subSkillNameList.includes('おてつだいボーナス')">÷ (100% - {{ 25 - config.selectEvaluate.helpBonus }}%) ※おてつだいボーナスによる最終補正<br></template> -->
              <template v-if="evaluateResult.subSkillNameList.includes('おてつだいボーナス')">× {{
                (((1 - evaluateResult.speedBonus) * (
                  1 / (1 - config.selectEvaluate.teamHelpBonus * 0.05 - 0.05)
                  - 1 / (1 - config.selectEvaluate.teamHelpBonus * 0.05)
                ) * 4 + 1) * 100).toFixed(1) }}% ※おてつだいボーナスによる最終補正<br></template>
              <template v-if="evaluateResult.subSkillNameList.includes('ゆめのかけらボーナス')">× (100% + 6% × {{ config.selectEvaluate.shardBonus }}%) ※ゆめのかけらボーナス<br></template>
              <template v-if="evaluateResult.subSkillNameList.includes('リサーチEXPボーナス')">× (100% + 9% × {{ config.selectEvaluate.shardBonus }}% ÷ 2) ※リサーチEXPボーナス<br></template>
              <template v-if="evaluateResult.shard">+ {{ evaluateResult.shard.toFixed(1) }} × {{ config.selectEvaluate.shardEnergy }} × {{ config.selectEvaluate.shardBonus }}% ※ゆめのかけらゲット<br></template>
            </td>
            <td>{{ evaluateResult.score.toFixed(0) }}</td>
          </tr>

        </table>
      </ToggleArea>
    </template>

  </PopupBase>
</template>

<style lang="scss" scoped>
.popup-base {

  img.food {
    width: 1.5em;
  }

  h2 {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  table {
    border-collapse: collapse;
  }
  td, th {
    padding: 5px 5px;
    border: 1px #CCC solid;
  }

  .skill-description + .skill-description {
    margin-top: 1em;
  }
}
</style>