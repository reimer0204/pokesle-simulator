<script setup>
import Pokemon from '../data/pokemon';
import SubSkill from '../data/sub-skill';
import SubSkillLabel from './sub-skill-label.vue';
import config from '../models/config';
import EvaluateTable from '../models/evaluate-table';
import MultiWorker from '../models/multi-worker';
import PopupBase from './popup-base.vue';
import NatureInfo from './nature-info.vue';
import Berry from '../data/berry';
import Food from '../data/food';
import Cooking from '../data/cooking';
import Skill from '../data/skill';
import HelpRate from '../models/help-rate';
import PokemonSimulator from '../models/pokemon-simulator';

const props = defineProps({
  name: { type: String, required: true },
  lv: { type: Number, required: true },
  foodIndexList: { type: Array, required: true },
  subSkillList: { type: Array, required: true },
  nature: { type: Object, required: true },
  percentile: { type: Boolean, default: true },
})

const evaluateTable = EvaluateTable.load();
const $emit = defineEmits(['close']);

const foodIndexList = computed(() => {
  return props.foodIndexList.slice(0, props.lv < 30 ? 1 : props.lv < 60 ? 2 : 3)
})

const percentile = computed(() => {
  return evaluateTable[props.name][props.lv][foodIndexList.value.slice(0, ).join('')].percentile
})
const simulator = new PokemonSimulator(config, PokemonSimulator.MODE_SELECT)

const basePokemon = computed(() => Pokemon.map[props.name]);

const result = computed(() => {
  const evaluateTable = EvaluateTable.load();
  const lv = props.lv;

  // サブスキルの組み合わせを列挙
  const subSkillNum = lv < 10 ? 0 : lv < 25 ? 1 : lv < 50 ? 2 : lv < 75 ? 3 : lv < 100 ? 4 : 5;
  let subSkillList = props.subSkillList.slice(0, subSkillNum);
  subSkillList = SubSkill.useSilverSeed(subSkillList);

  let foodList = foodIndexList.value.map((f, i) => {
    const food = Food.map[basePokemon.value.foodList[f]?.name];
    if (food == null) return null;
    return {
      name: basePokemon.value.foodList[f].name,
      num: basePokemon.value.foodList[f].numList[i],
      energy: food.energy * basePokemon.value.foodList[f].numList[i]
        * ((food.bestRate * Cooking.maxRecipeBonus - 1) * config.selectEvaluate.foodEnergyRate / 100 + 1),
    }
  });

  let result = simulator.selectEvaluate(
    basePokemon.value, props.lv, foodList, subSkillList, props.nature,
    evaluateTable.scoreForHealerEvaluate[lv], evaluateTable.scoreForSupportEvaluate[lv])

  result.scoreForHealerEvaluate = evaluateTable.scoreForHealerEvaluate[lv]
  result.scoreForSupportEvaluate = evaluateTable.scoreForSupportEvaluate[lv]

  return result;
})

const percentilePosition = computed(() => {
  return {
    upper: Math.min(percentile.value.findIndex(x => x >= result.value.energyPerDay), 100),
    lower: Math.max(percentile.value.findLastIndex(x => x <= result.value.energyPerDay), 0),
  }
})

</script>

<template>
  <PopupBase @close="$emit('close')">
    <template #headerText>{{ props.name }}(<template v-for="foodIndex in foodIndexList">
      <img class="food" :src="Food.map[basePokemon.foodList[foodIndex].name].img" />
    </template>)の厳選詳細</template>

    <h2>エナジー期待値：{{ Math.round(result.energyPerDay).toLocaleString() }}</h2>

    <ToggleArea class="mt-10px" :open="props.percentile">
      <template #headerText>パーセンタイル</template>

      <table>
        <template v-for="i in 101">
          <template v-for="j in 2">
            <tr>
              <th v-if="j == 1" rowspan="2">{{ 101 - i }}%</th>
              <td v-if="j == 1" rowspan="2">{{ Math.round(percentile[101 - i]).toLocaleString() }}</td>

              <template v-if="percentilePosition.upper != percentilePosition.lower">
                <template v-if="i == 1 && j == 1"><td></td></template>
                <template v-if="j == 2">
                  <td :rowspan="i == 101 ? 1 : 2">
                    <template v-if="percentilePosition.upper == 101 - i">{{ Math.round(result.energyPerDay).toLocaleString() }}</template>
                    <template v-else-if="i != 101">&nbsp;</template>
                  </td>
                </template>
              </template>
              <template v-else>
                <template v-if="j == 1">
                  <td rowspan="2">
                    <template v-if="percentilePosition.upper == 101 - i">{{ Math.round(result.energyPerDay).toLocaleString() }}</template>
                    <template v-else>&nbsp;</template>
                  </td>
                </template>
              </template>

              <!-- 
              <td v-if="i == 1"></td>
              <td v-else rowspan="2"></td> -->
              <!-- <template v-if="i == 1">
                <td :rowspan="(100 - percentilePosition.upper) * 2 + (percentilePosition.upper == percentilePosition.lower ? 0 : 1)"></td>
              </template>
              <template v-if="percentilePosition.upper == 101 - i">
                <td rowspan="2">{{ Math.round(result.energyPerDay).toLocaleString() }}</td>
              </template> -->
            </tr>
          
          </template>
        </template>
      </table>
    </ToggleArea>

    <ToggleArea class="mt-10px" open>
      <template #headerText>エナジー期待値計算</template>
      <table v-if="result">
        <tr>
          <th rowspan="5">個体</th>
          <th>サブスキル</th>
          <td>
            <div class="flex-row-start-center gap-5px">
            <SubSkillLabel v-for="subSkill in result.enableSubSkillList" :subSkill="subSkill" />
          </div>
          </td>
        </tr>
        <tr>
          <th>せいかく</th>
          <td>
            <NatureInfo v-if="result.nature" :nature="result.nature" />
            <template v-else>無補正</template>
          </td>
        </tr>
        <tr>
          <th>食材確率</th>
          <td>
            {{ (result.foodRate * 100).toFixed(1) }}%<br>
            <template v-if="result.enableSubSkillList.includes('食材確率アップS') || result.enableSubSkillList.includes('食材確率アップM')">
              × (100%{{ result.enableSubSkillList.includes('食材確率アップS') ? ' + 18%' : '' }}{{ result.enableSubSkillList.includes('食材確率アップM') ? ' + 36%' : '' }}) ※サブスキル<br>
            </template>
            <template v-if="result.nature?.good == '食材お手伝い確率'">× 120% ※せいかく<br></template>
            <template v-if="result.nature?.weak == '食材お手伝い確率'">× 80% ※せいかく<br></template>
            ＝ {{ (result.fixedFoodRate * 100).toFixed(1) }}%
          </td>
        </tr>
        <tr>
          <th>所持数</th>
          <td>
            {{ result.base.bag }}<br>
            <template v-if="result.base.evolveLv > 1">+ 5 × {{ result.base.evolveLv - 1 }} ※進化回数分<br></template>
            <template v-if="result.enableSubSkillList.includes('最大所持数アップS')">+ 6 ※サブスキル<br></template>
            <template v-if="result.enableSubSkillList.includes('最大所持数アップM')">+ 12 ※サブスキル<br></template>
            <template v-if="result.enableSubSkillList.includes('最大所持数アップL')">+ 18 ※サブスキル<br></template>
            ＝ {{ result.fixedBag }}
          </td>
        </tr>
        <tr>
          <th>所持数最大まで<br>おてつだい回数</th>
          <td>
            {{ result.fixedBag }} ÷ (<br>
            &emsp;{{ result.berryNum }} × (100% - {{ (result.fixedFoodRate * 100).toFixed(1) }}%) ※きのみ分<br>
            &emsp;+ ({{ result.enableFoodList.map(x => x.num).join(' + ') }}) ÷ {{ result.enableFoodList.length }} × {{ (result.fixedFoodRate * 100).toFixed(1) }}% ※食材分<br>
            )<br>
            + 4 (おてつだいキュー)<br>
            ＝ {{ (result.bagFullHelpNum).toFixed(2) }}
          </td>
        </tr>

        <tr>
          <th rowspan="8">お手伝い</th>
          <th>おてつだいスピード</th>
          <td>
            {{ result.help }}<br>
            × (100% - ({{ result.lv }} - 1) × 0.2%) ※Lv補正<br>
            × (100% - {{ (result.speedBonus * 100).toFixed(0) }}%)<br>
            <template v-if="result.nature?.good == '手伝いスピード'">× 90% ※せいかく<br></template>
            <template v-if="result.nature?.weak == '手伝いスピード'">× 110% ※せいかく<br></template>
            ＝ {{ (result.speed).toFixed(0) }}
          </td>
        </tr>
        <tr>
          <th>げんき回復量</th>
          <td>
            {{ (result.selfHealEffect || result.otherHealEffect || config.selectEvaluate.healer).toFixed(1) }}
            <template v-if="result.nature?.good == 'げんき回復量'">× 120% ※せいかく</template>
            <template v-if="result.nature?.weak == 'げんき回復量'">× 88% ※せいかく</template>
            ＝ {{ (result.healEffect).toFixed(1) }}
          </td>
        </tr>
        <tr>
          <th>日中手伝い回数</th>
          <td>
            (24 - {{ config.sleepTime }}) × 3600 ÷ {{ result.speed }}<br>
            × {{ (result.dayHelpNum / (24 - config.sleepTime) / 3600 * result.speed * 100).toFixed(1) }}% ※げんき補正<br>
            ＝ {{ (result.dayHelpNum).toFixed(2) }}
          </td>
        </tr>
        <tr>
          <th>夜間手伝い回数</th>
          <td>
            {{ config.sleepTime }} × 3600 ÷ {{ result.speed }}<br>
            × {{ (result.nightHelpNum / (config.sleepTime) / 3600 * result.speed * 100).toFixed(1) }}% ※げんき補正<br>
            ＝ {{ (result.nightHelpNum).toFixed(2) }}
          </td>
        </tr>
        <tr>
          <th>通常手伝い回数</th>
          <td>
            min({{ result.dayHelpNum.toFixed(2) }} ÷ {{ config.checkFreq - 1 }}, {{ (result.bagFullHelpNum).toFixed(2) }}) × {{ config.checkFreq - 1 }} ※{{ config.checkFreq - 1 }}は日中チェック回数から朝イチの1回を引いた数<br>
            + min({{ result.nightHelpNum.toFixed(2) }}, {{ (result.bagFullHelpNum).toFixed(2) }})<br>
            ＝ {{ (result.normalHelpNum).toFixed(2) }}
          </td>
        </tr>
        <tr>
          <th>いつ育回数</th>
          <td>
            {{ (result.dayHelpNum).toFixed(2) }} + {{ (result.nightHelpNum).toFixed(2) }} - {{ (result.normalHelpNum).toFixed(2) }}<br>
            ＝ {{ (result.berryHelpNum).toFixed(2) }}
          </td>
        </tr>

        <tr>
          <th>きのみエナジー</th>
          <td>
            max({{ Berry.map[result.base.berry].energy }} + {{ result.lv }} - 1, {{ Berry.map[result.base.berry].energy }} × 102.5% ^ ({{ result.lv }} - 1))<br>
            × {{ result.berryNum }} ※きのみの数<br>
            <template v-if="config.selectEvaluate.berryMatchAll || result.specialty == 'きのみ'">× 2 ※好物前提のため2倍<br></template>
            × ({{ (result.normalHelpNum).toFixed(2) }} × (100% - {{ (result.fixedFoodRate * 100).toFixed(1) }}%) + {{ (result.berryHelpNum).toFixed(2) }}) ※通常手伝い×きのみ率＋いつ育<br>
            ＝ {{ result.berryEnergyPerDay.toFixed(1) }}
          </td>
        </tr>

        <tr>
          <th>食材エナジー</th>
          <td>
            {{ (result.normalHelpNum).toFixed(2) }} × {{ (result.fixedFoodRate * 100).toFixed(1) }}% ※通常手伝い×食材率<br>
            × (<br>
            <template v-for="(food, i) in result.enableFoodList">
            &emsp;<template v-if="i">+ </template>{{ Food.map[food.name].energy }} × {{ food.num }} × (({{ (Food.map[food.name].bestRate * 100).toFixed(0) }}% × {{ Cooking.maxRecipeBonus * 100 }}% - 100%) × {{ config.selectEvaluate.foodEnergyRate }}% + 100%)<br>
            </template>
            )<br>
            ÷ {{ result.enableFoodList.length }}<br>
            ＝ {{ result.foodEnergyPerDay.toFixed(1) }}
          </td>
        </tr>

        <tr>
          <th :rowspan="result.skillList.length + 6">スキル</th>
          <th>スキル確率</th>
          <td>
            {{ (result.skillRate * 100).toFixed(2) }}%<br>
            <template v-if="result.enableSubSkillList.includes('スキル確率アップS') || result.enableSubSkillList.includes('スキル確率アップM')">
              × (100%{{ result.enableSubSkillList.includes('スキル確率アップS') ? ' + 18%' : '' }}{{ result.enableSubSkillList.includes('スキル確率アップM') ? ' + 36%' : '' }}) ※サブスキル<br>
            </template>
            <template v-if="result.nature?.good == 'メインスキル発生確率'">× 120% ※せいかく<br></template>
            <template v-if="result.nature?.weak == 'メインスキル発生確率'">× 80% ※せいかく<br></template>
            ＝ {{ (result.fixedSkillRate * 100).toFixed(2) }}%
          </td>
        </tr>
        <tr>
          <th>天井</th>
          <td>
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
            {{ (result.fixedSkillRate * 100).toFixed(2) }}% ÷ (100% - (100% - {{ (result.fixedSkillRate * 100).toFixed(2) }}%) ^ {{ result.specialty == 'スキル' ? (40 * 3600 / result.help).toFixed(1) : 78 }})<br>
            ＝ {{ (result.ceilSkillRate * 100).toFixed(2) }}%
          </td>
        </tr>
        <tr>
          <th>スキル回数</th>
          <td>
            {{ (result.ceilSkillRate * 100).toFixed(2) }}% × {{ (result.normalHelpNum).toFixed(2) }}<br>
            ＝ {{ (result.skillPerDay).toFixed(2) }}
          </td>
        </tr>
        <tr>
          <th>スキルLv</th>
          <td>
            <template v-if="config.selectEvaluate.skillLevel[result.skill.name]">
              {{ config.selectEvaluate.skillLevel[result.skill.name] }} ※設定値
            </template>
            <template v-else>
              {{ result.evolveLv }} ※進化段階
              <template v-if="result.enableSubSkillList.includes('スキルレベルアップS')">+ 1 (サブスキル)<br></template>
              <template v-if="result.enableSubSkillList.includes('スキルレベルアップM')">+ 2 (サブスキル)<br></template>
              ＝ {{ result.fixedSkillLv }}
            </template>
          </td>
        </tr>
        <tr v-for="skill of result.skillList">
          <th>{{ skill.name }}</th>
          <td>
            <template v-if="skill.name == 'エナジーチャージS' || skill.name == 'エナジーチャージS(ランダム)' || skill.name == 'エナジーチャージM'">
              {{ skill.effect[result.fixedSkillLv - 1] }}<br>
              <template v-if="result.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
            </template>
            <template v-if="skill.name == '食材ゲットS'">
              (<br>
              <template v-for="(food, i) in Food.list">
                {{ i ? '+ ' : '' }}{{ food.energy }} × (({{ (food.bestRate * 100).toFixed(0) }}% × {{ Cooking.maxRecipeBonus * 100 }}% - 100%) × {{ config.selectEvaluate.foodEnergyRate }}% + 100%) ※{{ food.name }}<br>
              </template>
              )<br>
              ÷ {{ Food.list.length }}<br>
              × {{ skill.effect[result.fixedSkillLv - 1] }}<br>
              <template v-if="result.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
            </template>
            
            <template v-if="skill.name == 'げんきチャージS'">
              げんき回復量で計算済み
            </template>
            
            <template v-if="skill.name == 'おてつだいサポートS' || skill.name == 'おてつだいブースト'">
              {{ result.scoreForSupportEvaluate.toFixed(1) }} ※厳選度{{ config.selectEvaluate.supportBorder }}%の上位33%のおてつだいあたりのエナジーの平均値<br>
              × {{ skill.effect[result.fixedSkillLv - 1] }}<template v-if="skill.name == 'おてつだいブースト'"> × 5</template><br>
              <template v-if="result.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
            </template>
            
            <template v-if="skill.name == 'げんきエールS' || skill.name == 'げんきオールS'">
              <template v-if="result.skill.name != 'ゆびをふる' || (result.skill.name == 'ゆびをふる' && skill.name == 'げんきエールS')">
                1日の1匹あたりの回復量：{{ result.otherHealEffect.toFixed(1) }}<br>
                <br>
                {{ result.scoreForHealerEvaluate.toFixed(1) }} ※厳選度{{ config.selectEvaluate.supportBorder }}%の上位33%のげんき補正なしエナジーの平均値<br>
                × (<br>
                &emsp;({{ (HelpRate.getHelpRate(result.otherHealEffect, config.dayHelpParameter) * 100).toFixed(1) }}% * (24 - {{ config.sleepTime }}) + {{ (HelpRate.getHelpRate(result.otherHealEffect, config.nightHelpParameter) * 100).toFixed(1) }}% * {{ config.sleepTime }}) ※ヒーラーありのおてつだい倍率<br>
                &emsp;÷ ({{ (HelpRate.getHelpRate(0, config.dayHelpParameter) * 100).toFixed(1) }}% * (24 - {{ config.sleepTime }}) + {{ (HelpRate.getHelpRate(0, config.nightHelpParameter) * 100).toFixed(1) }}% * {{ config.sleepTime }}) ※ヒーラーなしのおてつだい倍率<br>
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
              {{ skill.effect[result.fixedSkillLv - 1] }} × {{ config.selectEvaluate.shardEnergy }} ※{{ config.selectEvaluate.shardEnergy }}はゆめのかけらゲット評価の設定値<br>
              <template v-if="result.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
            </template>

            <template v-if="skill.name == '料理パワーアップS'">
              {{ Cooking.cookingPowerUpEnergy.toFixed(1) }} × {{ skill.effect[result.fixedSkillLv - 1] }}
              ※{{ Cooking.cookingPowerUpEnergy.toFixed(1) }}は全料理内最大料理と{{ Cooking.potMax }}以下の最大料理のエナジー差を食材数で割った値<br>
              <template v-if="result.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
            </template>

            <template v-if="skill.name == '料理チャンスS'">
              週の効果量<br>
              {{ skill.effect[result.fixedSkillLv - 1] }} × {{ result.skillPerDay.toFixed(2) }} × 7<br>
              <template v-if="result.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
              ＝{{ (skill.effect[result.fixedSkillLv - 1] * result.skillPerDay * 7 / (result.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1)).toFixed(1) }}<br>
              <br>
              ({{ Cooking.getChanceWeekEffect(skill.effect[result.fixedSkillLv - 1] * result.skillPerDay * 7 / (result.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1) / 100).total.toFixed(2) }}
              - 24.6) ※週の効果量から料理倍率の期待値を計算し、通常時からの増分を計算<br>
              × {{ Cooking.maxEnergy.toFixed(0) }} ※今一番いい料理<br>
              ÷ ({{ result.skillPerDay.toFixed(2) }} × 7) ※週の発動回数で割って1回あたりの効果にする<br>
            </template>

            <template v-if="result.skillEnergyMap[skill.name]">
              ＝ {{ result.skillEnergyMap[skill.name]?.toFixed(0) }}
            </template>
          </td>
        </tr>
        <tr>
          <th>スキルエナジー</th>
          <td>
            {{ result.skillEnergy.toFixed(0) }} × {{ result.skillPerDay.toFixed(2) }}<br>
            ＝{{ result.skillEnergyPerDay.toFixed(1) }}
          </td>
        </tr>
        <tr>
          <th colspan="2">小計</th>
          <td>
            {{ result.berryEnergyPerDay.toFixed(1) }}
            + {{ result.foodEnergyPerDay.toFixed(1) }}
            + {{ result.skillEnergyPerDay.toFixed(1) }}<br>
            ＝ {{ (result.berryEnergyPerDay + result.foodEnergyPerDay + result.skillEnergyPerDay).toFixed(0) }}<br>
          </td>
        </tr>
        <tr>
          <th colspan="2">総計</th>
          <td>
            ({{ result.berryEnergyPerDay.toFixed(1) }}
            + {{ result.foodEnergyPerDay.toFixed(1) }}
            + {{ result.skillEnergyPerDay.toFixed(1) }})<br>
            <template v-if="result.enableSubSkillList.includes('おてつだいボーナス')">÷ (100% - {{ 25 - config.selectEvaluate.helpBonus }}%) ※おてつだいボーナスによる最終補正<br></template>
            <template v-if="result.enableSubSkillList.includes('ゆめのかけらボーナス')">× (100% + 6% × {{ config.selectEvaluate.shardBonus }}%) ※ゆめのかけらボーナス<br></template>
            <template v-if="result.enableSubSkillList.includes('リサーチEXPボーナス')">× (100% + 6% × {{ config.selectEvaluate.shardBonus }}% ÷ 2) ※リサーチEXPボーナス<br></template>
            ＝ {{ result.energyPerDay.toFixed(0) }}<br>
          </td>
        </tr>

      </table>
    </ToggleArea>

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