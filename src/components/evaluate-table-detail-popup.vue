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

const evaluateTable = EvaluateTable.load(config);
const $emit = defineEmits(['close']);

const foodIndexList = computed(() => {
  return props.foodIndexList.slice(0, props.lv < 30 ? 1 : props.lv < 60 ? 2 : 3)
})

const percentile = computed(() => {
  return evaluateTable[props.name][props.lv][foodIndexList.value.slice(0, ).join('')].percentile
})
const specialtyPercentile = computed(() => {
  return evaluateTable[props.name][props.lv][foodIndexList.value.slice(0, ).join('')].specialtyNumList
})

let simulator: PokemonSimulator;
const simulatorLoaded = ref(false);
(async () => {
  await PokemonSimulator.isReady
  simulator = new PokemonSimulator(config, PokemonSimulator.MODE_SELECT)
  simulatorLoaded.value = true;
})()

const basePokemon = computed(() => Pokemon.map[props.name]);

const result = computed(() => {
  if (!simulatorLoaded.value) return null;

  const evaluateTable = EvaluateTable.load(config);
  const lv = props.lv;

  // サブスキルの組み合わせを列挙
  const subSkillNum = lv < 10 ? 0 : lv < 25 ? 1 : lv < 50 ? 2 : lv < 75 ? 3 : lv < 100 ? 4 : 5;
  let subSkillList: string[] = props.subSkillList;
  subSkillList = (config.selectEvaluate.silverSeedUse ? SubSkill.useSilverSeed(subSkillList) : subSkillList).slice(0, subSkillNum);

  // console.log(subSkillList)
  // console.log(foodIndexList.value.map(f => basePokemon.value.foodList[f]))
  // console.log(
  //   basePokemon.value,
  //   props.lv,
  //   foodIndexList.value.map(f => basePokemon.value.foodList[f].name),
  //   subSkillList.map(x => SubSkill.map[x]), props.nature,
  // )

  const simulatedPokemon = simulator.fromEvaluate(
    basePokemon.value,
    props.lv,
    foodIndexList.value.map(f => basePokemon.value.foodList[f].name),
  )
  
  let result = simulator.selectEvaluate(
    simulatedPokemon, subSkillList.map(x => SubSkill.map[x]), props.nature,
    evaluateTable.scoreForHealerEvaluate[props.lv], evaluateTable.scoreForSupportEvaluate[props.lv])
  
  result.score = simulator.selectEvaluateToScore(
    result, 
    subSkillList.includes('ゆめのかけらボーナス'),
    subSkillList.includes('リサーチEXPボーナス')
  )
  if (basePokemon.value.specialty == 'きのみ') result.specialtyScore = result.berryNumPerDay;
  if (basePokemon.value.specialty == '食材')   result.specialtyScore = result.foodNumPerDay;
  if (basePokemon.value.specialty == 'スキル') result.specialtyScore = result.skillPerDay;
  if (basePokemon.value.specialty == 'オール') result.specialtyScore = result.skillPerDay;

  result.scoreForHealerEvaluate = evaluateTable.scoreForHealerEvaluate[lv]
  result.scoreForSupportEvaluate = evaluateTable.scoreForSupportEvaluate[lv]

  const helpRate = new HelpRate(config)
  result.healerHelpRate = helpRate.getHelpRate(result.healList)
  result.defaultHelpRate = helpRate.getHelpRate([])

  return result;
})

const evaluateGraph = computed(() => {
  const upper = Math.min(percentile.value.findIndex(x => x >= result.value.score), 100);
  const lower = Math.max(percentile.value.findLastIndex(x => x <= result.value.score), 0);
  const thisPercentile = upper == lower ? lower : (result.value.score - percentile.value[lower]) / (percentile.value[upper] - percentile.value[lower]) + lower

  let horizontalLinePlugin = undefined
  if (config.simulation.selectType == 1) {
    horizontalLinePlugin = [{
      id: 'horizontalLine',
      afterDraw: (chart) => {
        const yValue = chart.scales.y.getPixelForValue(percentile.value[config.simulation.selectBorder]);
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
          data: [{x: thisPercentile, y: result.value.score}],
        },
        {
          label: '厳選度',
          backgroundColor: '#8DD',
          data: percentile.value.map((y, x) => ({ x, y })),
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

const specialtyEvaluateGraph = computed(() => {
  const upper = Math.min(specialtyPercentile.value.findIndex(x => x >= result.value.specialtyScore), 100);
  const lower = Math.max(specialtyPercentile.value.findLastIndex(x => x <= result.value.specialtyScore), 0);
  const thisPercentile = upper == lower ? lower : (result.value.specialtyScore - specialtyPercentile.value[lower]) / (specialtyPercentile.value[upper] - specialtyPercentile.value[lower]) + lower

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
          data: [{x: thisPercentile, y: result.value.specialtyScore}],
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

    <template v-if="result">
      <h2>厳選スコア：{{ Math.round(result.score).toLocaleString() }}</h2>

      <ToggleArea class="mt-10px" :open="props.percentile">
        <template #headerText>総合スコアパーセンタイル</template>
        <div><Line class="w-100 h-300px" v-bind="evaluateGraph" /></div>
      </ToggleArea>

      <ToggleArea class="mt-10px" :open="props.percentile">
        <template #headerText>とくい分野パーセンタイル</template>
        <div><Line class="w-100 h-300px" v-bind="specialtyEvaluateGraph" /></div>
      </ToggleArea>

      <ToggleArea class="mt-10px" open>
        <template #headerText>エナジー期待値計算</template>
        <table v-if="result">
          <tr>
            <th rowspan="5">個体</th>
            <th>サブスキル</th>
            <td colspan="2">
              <div class="flex-row-start-center gap-5px">
                <SubSkillLabel v-for="subSkill in result.subSkillList" :subSkill="subSkill" />
              </div>
            </td>
          </tr>
          <tr>
            <th>せいかく</th>
            <td colspan="2">
              <NatureInfo v-if="result.nature" :nature="result.nature" />
              <template v-else>無補正</template>
            </td>
          </tr>
          <tr>
            <th>食材確率</th>
            <td>
              {{ (result.base.foodRate * 100).toFixed(1) }}%<br>
              <template v-if="result.subSkillNameList.includes('食材確率アップS') || result.subSkillNameList.includes('食材確率アップM')">
                × (100%{{ result.subSkillNameList.includes('食材確率アップS') ? ' + 18%' : '' }}{{ result.subSkillNameList.includes('食材確率アップM') ? ' + 36%' : '' }}) ※サブスキル<br>
              </template>
              <template v-if="result.nature?.good == '食材お手伝い確率'">× 120% ※せいかく<br></template>
              <template v-if="result.nature?.weak == '食材お手伝い確率'">× 80% ※せいかく<br></template>
            </td>
            <td>{{ (result.foodRate * 100).toFixed(1) }}%</td>
          </tr>
          <tr>
            <th>所持数</th>
            <td>
              {{ result.base.bag }}<br>
              <template v-if="result.base.evolveLv > 1">+ 5 × {{ result.base.evolveLv - 1 }} ※進化回数分<br></template>
              <template v-if="result.subSkillNameList.includes('最大所持数アップS')">+ 6 ※最大所持数アップS<br></template>
              <template v-if="result.subSkillNameList.includes('最大所持数アップM')">+ 12 ※最大所持数アップM<br></template>
              <template v-if="result.subSkillNameList.includes('最大所持数アップL')">+ 18 ※最大所持数アップL<br></template>
              <template v-if="result.sleepTime >= 2000">+ 8 ※睡眠2000時間<br></template>
              <template v-else-if="result.sleepTime >= 1000">+ 6 ※睡眠2000時間<br></template>
              <template v-else-if="result.sleepTime >=  500">+ 3 ※睡眠2000時間<br></template>
              <template v-else-if="result.sleepTime >=  200">+ 1 ※睡眠2000時間<br></template>
            </td>
            <td>{{ result.bag }}</td>
          </tr>
          <tr>
            <th>所持数最大まで<br>おてつだい回数</th>
            <td>
              {{ result.bag }} ÷ (<br>
              &emsp;{{ result.berryNum }} × (100% - {{ (result.foodRate * 100).toFixed(1) }}%) ※きのみ分<br>
              &emsp;+ ({{ result.foodList.map(x => x.num).join(' + ') }}) ÷ {{ result.foodList.length }} × {{ (result.foodRate * 100).toFixed(1) }}% ※食材分<br>
              )<br>
              + 4 (おてつだいキュー)<br>
            </td>
            <td>{{ (result.bagFullHelpNum).toFixed(2) }}</td>
          </tr>

          <tr>
            <th rowspan="8">お手伝い</th>
            <th>おてつだいスピード</th>
            <td>
              {{ result.base.help }}<br>
              × (100% - ({{ result.lv }} - 1) × 0.2%) ※Lv補正<br>
              × (100% - {{ (result.speedBonus * 100).toFixed(0) }}%)<br>
              <template v-if="result.nature?.good == '手伝いスピード'">× 90% ※せいかく<br></template>
              <template v-if="result.nature?.weak == '手伝いスピード'">× 107.5% ※せいかく<br></template>
            </td>
            <td>{{ (result.speed).toFixed(0) }}</td>
          </tr>
          <tr>
            <th>げんき回復量</th>
            <td>
              {{ result.allHealList.reduce((a, x) => a + x.effect, 0).toFixed(1) }}<br>
              <template v-if="result.nature?.good == 'げんき回復量'">× 120% ※せいかく<br></template>
              <template v-else-if="result.nature?.weak == 'げんき回復量'">× 88% ※せいかく<br></template>
              <template v-else>× 100% ※せいかく<br></template>
            </td>
            <td>{{ (result.allHealList.reduce((a, x) => a + x.effect, 0) * result.natureGenkiMultiplier).toFixed(1) }}</td>
          </tr>
          <tr>
            <th>日中手伝い回数</th>
            <td>
              (24 - {{ config.sleepTime }}) × 3600 ÷ {{ result.speed }}<br>
              × {{ (result.dayHelpNum / (24 - config.sleepTime) / 3600 * result.speed * 100).toFixed(1) }}% ※げんき補正<br>
            </td>
            <td>{{ (result.dayHelpNum).toFixed(2) }}</td>
          </tr>
          <tr>
            <th>夜間手伝い回数</th>
            <td>
              {{ config.sleepTime }} × 3600 ÷ {{ result.speed }}<br>
              × {{ (result.nightHelpNum / (config.sleepTime) / 3600 * result.speed * 100).toFixed(1) }}% ※げんき補正<br>
            </td>
            <td>{{ (result.nightHelpNum).toFixed(2) }}</td>
          </tr>
          <tr>
            <th>通常手伝い回数</th>
            <td>
              min({{ result.dayHelpNum.toFixed(2) }} ÷ {{ config.checkFreq - 1 }}, {{ (result.bagFullHelpNum).toFixed(2) }}) × {{ config.checkFreq - 1 }} ※{{ config.checkFreq - 1 }}は日中チェック回数から朝イチの1回を引いた数<br>
              + min({{ result.nightHelpNum.toFixed(2) }}, {{ (result.bagFullHelpNum).toFixed(2) }})<br>
            </td>
            <td>{{ (result.normalHelpNum).toFixed(2) }}</td>
          </tr>
          <tr>
            <th>いつ育回数</th>
            <td>
              {{ (result.dayHelpNum).toFixed(2) }} + {{ (result.nightHelpNum).toFixed(2) }} - {{ (result.normalHelpNum).toFixed(2) }}<br>
            </td>
            <td>{{ (result.berryHelpNum).toFixed(2) }}</td>
          </tr>

          <tr>
            <th>きのみエナジー</th>
            <td>
              max({{ result.base.berry.energy }} + {{ result.lv }} - 1, {{ result.base.berry.energy }} × 102.5% ^ ({{ result.lv }} - 1))<br>
              × {{ result.berryNum }} ※きのみの数<br>
              <template v-if="config.selectEvaluate.specialty[result.base.specialty].berryEnergyRate != 100">× {{ config.selectEvaluate.specialty[result.base.specialty].berryEnergyRate }}% ※好物補正<br></template>
              × ({{ (result.normalHelpNum).toFixed(2) }} × (100% - {{ (result.foodRate * 100).toFixed(1) }}%) + {{ (result.berryHelpNum).toFixed(2) }}) ※通常手伝い×きのみ率＋いつ育<br>
            </td>
            <td>{{ result.berryEnergyPerDay.toFixed(1) }}</td>
          </tr>

          <tr>
            <th>食材エナジー</th>
            <td>
              <template v-if="config.selectEvaluate.expectType.food == 0">
                {{ (result.normalHelpNum).toFixed(2) }} × {{ (result.foodRate * 100).toFixed(1) }}% ※通常手伝い×食材率<br>
                × (<br>
                <template v-for="(food, i) in result.foodList">
                &emsp;<template v-if="i">+ </template>{{ Food.map[food.name].energy }} × {{ food.num }} × (({{ (Food.map[food.name].bestRate * 100).toFixed(0) }}% × {{ Cooking.maxRecipeBonus * 100 }}% - 100%) × {{ config.selectEvaluate.specialty[result.base.specialty].foodEnergyRate }}% + 100%)<br>
                </template>
                )<br>
                ÷ {{ result.foodList.length }}<br>
              </template>
              <template v-else>
                <template v-for="food in Food.list">
                  <template v-if="result[food.name]">
                    {{ Food.map[food.name].energy }}エナジー × {{ result[food.name].toFixed(1) }}個 × (({{ (Food.map[food.name].bestRate * 100).toFixed(0) }}% × {{ Cooking.maxRecipeBonus * 100 }}% - 100%) × {{ config.selectEvaluate.specialty[result.base.specialty].foodEnergyRate }}% + 100%) ※{{ food.name }}<br>
                  </template>
                </template>
              </template>
            </td>
            <td>{{ result.foodEnergyPerDay.toFixed(1) }}</td>
          </tr>

          <tr>
            <th :rowspan="result.skillWeightList.length + 6">スキル</th>
            <th>スキル確率</th>
            <td>
              {{ (result.base.skillRate * 100).toFixed(2) }}%<br>
              <template v-if="result.subSkillNameList.includes('スキル確率アップS') || result.subSkillNameList.includes('スキル確率アップM')">
                × (100%{{ result.subSkillNameList.includes('スキル確率アップS') ? ' + 18%' : '' }}{{ result.subSkillNameList.includes('スキル確率アップM') ? ' + 36%' : '' }}) ※サブスキル<br>
              </template>
              <template v-if="result.nature?.good == 'メインスキル発生確率'">× 120% ※せいかく<br></template>
              <template v-if="result.nature?.weak == 'メインスキル発生確率'">× 80% ※せいかく<br></template>
            </td>
            <td>{{ (result.skillRate * 100).toFixed(2) }}%</td>
          </tr>
          <tr>
            <th>天井</th>
            <td colspan="2">
              <template v-if="result.specialty == 'スキル'">
                40 × 3600 ÷ {{ result.help }} ＝ {{ (40 * 3600 / result.help).toFixed(1) }} ※スキルタイプは40時間÷基礎おてつだい時間(小数点以下の扱い不明)
              </template>
              <template v-else>
                78 ※スキルタイプ以外は78回固定
              </template>
            </td>
          </tr>
          <tr>
            <th>天井補正後<br>スキル確率</th>
            <td>
              {{ (result.skillRate * 100).toFixed(2) }}% ÷ (100% - (100% - {{ (result.skillRate * 100).toFixed(2) }}%) ^ {{ result.specialty == 'スキル' ? (40 * 3600 / result.help).toFixed(1) : 78 }})<br>
            </td>
            <td>{{ (result.ceilSkillRate * 100).toFixed(2) }}%</td>
          </tr>
          <tr>
            <th>スキル回数</th>
            <td>
              {{ (result.ceilSkillRate * 100).toFixed(2) }}% × {{ (result.normalHelpNum).toFixed(2) }}<br>
            </td>
            <td>{{ (result.skillPerDay).toFixed(2) }}</td>
          </tr>
          <tr>
            <th>スキルLv</th>
            <td>
              {{ result.skillLv }}
              <template v-if="result.subSkillNameList.includes('スキルレベルアップS')">+ 1 (サブスキル)<br></template>
              <template v-if="result.subSkillNameList.includes('スキルレベルアップM')">+ 2 (サブスキル)<br></template>
            </td>
            <td>{{ result.fixedSkillLv }}</td>
          </tr>
          <tr v-for="{ skill, weight } of result.skillWeightList">
            <th>{{ skill.name }}</th>
            <td>
              <template v-if="skill.name == 'エナジーチャージS' || skill.name == 'エナジーチャージS(ランダム)' || skill.name == 'エナジーチャージM'">
                {{ skill.effect[result.fixedSkillLv - 1] }}<br>
                <template v-if="result.base.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
              </template>
              <template v-if="skill.name == '食材ゲットS'">
                (<br>
                <template v-for="(food, i) in Food.list">
                  {{ i ? '+ ' : '' }}{{ food.energy }} × (({{ (food.bestRate * 100).toFixed(0) }}% × {{ Cooking.maxRecipeBonus * 100 }}% - 100%) × {{ config.selectEvaluate.specialty[result.base.specialty].foodGetRate }}% + 100%) ※{{ food.name }}<br>
                </template>
                )<br>
                ÷ {{ Food.list.length }}<br>
                × {{ skill.effect[result.fixedSkillLv - 1] }}<br>
                <template v-if="result.base.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
              </template>
              
              <template v-if="skill.name == 'げんきチャージS'">
                げんき回復量で計算済み
              </template>
              
              <template v-if="skill.name == 'おてつだいサポートS' || skill.name == 'おてつだいブースト'">
                {{ result.scoreForSupportEvaluate.toFixed(1) }} ※厳選度{{ config.selectEvaluate.supportBorder }}%の上位{{ config.selectEvaluate.supportRankNum }}%のおてつだいあたりのエナジーの平均値<br>
                <template v-if="skill.name == 'おてつだいブースト'">× {{ skill.effect[result.fixedSkillLv - 1].max }} × 5</template>
                <template v-else>× {{ skill.effect[result.fixedSkillLv - 1] }}</template><br>
                <template v-if="result.base.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
              </template>
              
              <template v-if="skill.genki && skill.team">
                <template v-if="result.base.skill.name != 'ゆびをふる' || (result.base.skill.name == 'ゆびをふる' && skill.name == 'げんきエールS')">
                  1日の1匹あたりの回復量：{{ result.healList.reduce((a, x) => a + x.effect, 0).toFixed(1) }}<br>
                  <!-- 起床時：{{ (result.otherMorningHealEffect * 100).toFixed(1) }}<br>
                  日中：{{ (result.otherDayHealEffect * 100).toFixed(1) }}<br> -->
                  <br>
                  {{ result.scoreForHealerEvaluate.toFixed(1) }} ※厳選度{{ config.selectEvaluate.supportBorder }}%の上位{{ config.selectEvaluate.supportRankNum }}%のげんき補正なしエナジーの平均値<br>
                  × (<br>
                  &emsp;({{ (result.healerHelpRate.day * 100).toFixed(1) }}% * (24 - {{ config.sleepTime }}) + {{ (result.healerHelpRate.night * 100).toFixed(1) }}% * {{ config.sleepTime }}) ※ヒーラーありのおてつだい倍率<br>
                  &emsp;÷ ({{ (result.defaultHelpRate.day * 100).toFixed(1) }}% * (24 - {{ config.sleepTime }}) + {{ (result.defaultHelpRate.night * 100).toFixed(1) }}% * {{ config.sleepTime }}) ※ヒーラーなしのおてつだい倍率<br>
                  &emsp;- 1<br>
                  )<br>
                  × 4 ※4匹分<br>
                  ÷ {{ result.skillPerDay.toFixed(2) }} ※スキル発動回数で割って1回あたりの効果にする<br>
                </template>
                <template v-else>
                  げんきエールSに含む
                </template>
              </template>

              <template v-if="skill.name == 'ゆめのかけらゲットS' || skill.name == 'ゆめのかけらゲットS(ランダム)'">
                {{ skill.effect[result.fixedSkillLv - 1] }}
                <template v-if="result.base.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
                ＝ {{ (skill.effect[result.fixedSkillLv - 1] * weight).toFixed(1) }}
              </template>

              <template v-if="skill.name == '料理パワーアップS'">
                (<br>
                &emsp;{{ Cooking.cookingPowerUpEnergy.toFixed(1) }} × {{ skill.effect[result.fixedSkillLv - 1] }} × {{ Math.min(result.skillPerDay / (result.base.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1), Math.ceil((Cooking.maxFoodNum - Cooking.potMax) / skill.effect[result.fixedSkillLv - 1]) * 3).toFixed(2) }} ※{{ Cooking.cookingPowerUpEnergy.toFixed(1) }}は最良エナジーと{{ Cooking.potMax }}以下の最良エナジー差を食材数で割った値<br>
                &emsp;+ {{ Food.averageEnergy.toFixed(1) }} × {{ skill.effect[result.fixedSkillLv - 1] }} × {{ Math.max(result.skillPerDay / (result.base.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1) - Math.ceil((Cooking.maxFoodNum - Cooking.potMax) / skill.effect[result.fixedSkillLv - 1]) * 3, 0).toFixed(2) }}<br>
                )<br>
                ÷ {{ result.skillPerDay.toFixed(2) }}<br>
              </template>

              <template v-if="skill.name == '料理チャンスS'">
                週の効果量<br>
                {{ skill.effect[result.fixedSkillLv - 1] }} × {{ result.skillPerDay.toFixed(2) }} × 7<br>
                <template v-if="result.base.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
                ＝{{ (skill.effect[result.fixedSkillLv - 1] * result.skillPerDay * 7 / (result.base.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1)).toFixed(1) }}<br>
                <br>
                ({{ Cooking.getChanceWeekEffect(skill.effect[result.fixedSkillLv - 1] * result.skillPerDay * 7 / (result.base.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1) / 100).total.toFixed(2) }}
                - 24.6) ※週の効果量から料理倍率の期待値を計算し、通常時からの増分を計算<br>
                × {{ Cooking.maxEnergy.toFixed(0) }} ※今一番いい料理<br>
                ÷ ({{ result.skillPerDay.toFixed(2) }} × 7) ※週の発動回数で割って1回あたりの効果にする<br>
              </template>

            </td>
            <td>
              <template v-if="result.skillEnergyMap[skill.name]">
                {{ result.skillEnergyMap[skill.name]?.toFixed(0) }}
              </template>
            </td>
          </tr>
          <tr>
            <th>スキルエナジー</th>
            <td>
              {{ result.skillEnergy.toFixed(0) }} × {{ result.skillPerDay.toFixed(2) }}<br>
            </td>
            <td>{{ result.skillEnergyPerDay.toFixed(1) }}</td>
          </tr>
          <tr>
            <th colspan="2">小計</th>
            <td>
              {{ result.berryEnergyPerDay.toFixed(1) }}
              + {{ result.foodEnergyPerDay.toFixed(1) }}
              + {{ result.skillEnergyPerDay.toFixed(1) }}<br>
            </td>
            <td>{{ (result.berryEnergyPerDay + result.foodEnergyPerDay + result.skillEnergyPerDay).toFixed(0) }}</td>
          </tr>
          <tr>
            <th colspan="2">総計</th>
            <td>
              {{ (result.berryEnergyPerDay + result.foodEnergyPerDay + result.skillEnergyPerDay).toFixed(0) }}<br>
              <!-- <template v-if="result.subSkillNameList.includes('おてつだいボーナス')">÷ (100% - {{ 25 - config.selectEvaluate.helpBonus }}%) ※おてつだいボーナスによる最終補正<br></template> -->
              <template v-if="result.subSkillNameList.includes('おてつだいボーナス')">× {{
                (((1 - result.speedBonus) * (
                  1 / (1 - config.selectEvaluate.teamHelpBonus * 0.05 - 0.05)
                  - 1 / (1 - config.selectEvaluate.teamHelpBonus * 0.05)
                ) * 4 + 1) * 100).toFixed(1) }}% ※おてつだいボーナスによる最終補正<br></template>
              <template v-if="result.subSkillNameList.includes('ゆめのかけらボーナス')">× (100% + 6% × {{ config.selectEvaluate.shardBonus }}%) ※ゆめのかけらボーナス<br></template>
              <template v-if="result.subSkillNameList.includes('リサーチEXPボーナス')">× (100% + 9% × {{ config.selectEvaluate.shardBonus }}% ÷ 2) ※リサーチEXPボーナス<br></template>
              <template v-if="result.shard">+ {{ result.shard.toFixed(1) }} × {{ config.selectEvaluate.shardEnergy }} × {{ config.selectEvaluate.shardBonus }}% ※ゆめのかけらゲット<br></template>
            </td>
            <td>{{ result.score.toFixed(0) }}</td>
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
}
</style>