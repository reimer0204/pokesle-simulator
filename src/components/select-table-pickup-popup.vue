<script setup>
import Pokemon from '../data/pokemon';
import SubSkill from '../data/sub-skill';
import SubSkillLabel from './sub-skill-label.vue';
import config from '../models/config';
import EvaluateTable from '../models/evaluate-table';
import MultiWorker from '../models/multi-worker';
import EvaluateTableWorker from '../worker/evaluate-table-worker?worker';
import PopupBase from './popup-base.vue';
import NatureInfo from './nature-info.vue';
import Berry from '../data/berry';
import Food from '../data/food';
import Cooking from '../data/cooking';
import Skill from '../data/skill';
import HelpRate from '../models/help-rate';

const props = defineProps({
  name: { type: String, required: true },
  foodIndexList: { type: String, required: true },
  lv: { type: Number, required: true },
  p: { type: Number, required: true },
})

const $emit = defineEmits(['close']);

const simulationResult = ref(null)

asyncWatcher.run(async (progressCounter) => {

  const evaluateTable = EvaluateTable.load();
  const lv = props.lv;
  
  function combination(r, n, s = 0) {
    if (n == 0) return [[]];
    let result = [];

    for(let i = s; i < r - n + 1; i++) {
      for(let subList of combination(r, n - 1, i + 1)) {
        result.push([i, ...subList])
      }
    }

    return result;
  }

  const multiWorker = new MultiWorker(EvaluateTableWorker, 1)

  // サブスキルの組み合わせを列挙
  const subSkillNum = lv < 10 ? 0 : lv < 25 ? 1 : lv < 50 ? 2 : lv < 75 ? 3 : lv < 100 ? 4 : 5;
  let subSkillCombinationMap = {};
  for(const indexes of combination(SubSkill.list.length, subSkillNum)) {
    let subSkillList = indexes.map(i => SubSkill.list[i].name);
    let subSkillSet = new Set(subSkillList);

    if (config.selectEvaluate.silverSeedUse) {
      if (subSkillSet.has('最大所持数アップM') && !subSkillSet.has('最大所持数アップL')) { subSkillSet.delete('最大所持数アップM'); subSkillSet.add('最大所持数アップL') };
      if (subSkillSet.has('最大所持数アップS') && !subSkillSet.has('最大所持数アップL')) { subSkillSet.delete('最大所持数アップS'); subSkillSet.add('最大所持数アップL') };
      if (subSkillSet.has('最大所持数アップS') && !subSkillSet.has('最大所持数アップM')) { subSkillSet.delete('最大所持数アップS'); subSkillSet.add('最大所持数アップM') };
      if (subSkillSet.has('スキルレベルアップS') && !subSkillSet.has('スキルレベルアップM')) { subSkillSet.delete('スキルレベルアップS'); subSkillSet.add('スキルレベルアップM') };
      if (subSkillSet.has('スキル確率アップS') && !subSkillSet.has('スキル確率アップM')) { subSkillSet.delete('スキル確率アップS'); subSkillSet.add('スキル確率アップM') };
      if (subSkillSet.has('食材確率アップS') && !subSkillSet.has('食材確率アップM')) { subSkillSet.delete('食材確率アップS'); subSkillSet.add('食材確率アップM') };
      if (subSkillSet.has('おてつだいスピードS') && !subSkillSet.has('おてつだいスピードM')) { subSkillSet.delete('おてつだいスピードS'); subSkillSet.add('おてつだいスピードM') };
    }

    let subSkillKey = [...subSkillSet].sort().join('/');
    subSkillCombinationMap[subSkillKey] = (subSkillCombinationMap[subSkillKey] ?? 0) + 1;
  }

  simulationResult.value = (await multiWorker.call(
    progressCounter,
    () => {
      return {
        lv,
        config: JSON.parse(JSON.stringify(config)),
        pokemonList: [Pokemon.map[props.name]],
        foodCombinationList: [props.foodIndexList],
        subSkillCombinationMap,
        scoreForHealerEvaluate: evaluateTable.scoreForHealerEvaluate[lv],
        scoreForSupportEvaluate: evaluateTable.scoreForSupportEvaluate[lv],
      }
    }
  ))[0].result[props.name][props.foodIndexList][props.p].eachResult
  simulationResult.value.scoreForHealerEvaluate = evaluateTable.scoreForHealerEvaluate[lv]
  simulationResult.value.scoreForSupportEvaluate = evaluateTable.scoreForSupportEvaluate[lv]
})

const basePokemon = computed(() => Pokemon.map[props.name]);

</script>

<template>
  <PopupBase @close="$emit('close')">
    <template #headerText>厳選テーブル詳細</template>

    <h2>
      {{ props.name }}(
      <template v-for="foodIndex in props.foodIndexList.split('')">
        <img :src="Food.map[basePokemon.foodList[foodIndex].name].img" />
      </template>
      )の {{ p }} %
    </h2>

    <table v-if="simulationResult">
      <tr>
        <th rowspan="5">個体</th>
        <th>サブスキル</th>
        <td>
          <div class="flex-row-start-center gap-5px">
          <SubSkillLabel v-for="subSkill in simulationResult.enableSubSkillList" :subSkill="subSkill" />
        </div>
        </td>
      </tr>
      <tr>
        <th>せいかく</th>
        <td>
          <NatureInfo v-if="simulationResult.nature" :nature="simulationResult.nature" />
          <template v-else>無補正</template>
        </td>
      </tr>
      <tr>
        <th>食材確率</th>
        <td>
          {{ (simulationResult.foodRate * 100).toFixed(1) }}%<br>
          <template v-if="simulationResult.enableSubSkillList.includes('食材確率アップS') || simulationResult.enableSubSkillList.includes('食材確率アップM')">
            × (100%{{ simulationResult.enableSubSkillList.includes('食材確率アップS') ? ' + 18%' : '' }}{{ simulationResult.enableSubSkillList.includes('食材確率アップM') ? ' + 36%' : '' }}) ※サブスキル<br>
          </template>
          <template v-if="simulationResult.nature?.good == '食材お手伝い確率'">× 120% ※せいかく<br></template>
          <template v-if="simulationResult.nature?.weak == '食材お手伝い確率'">× 80% ※せいかく<br></template>
          ＝ {{ (simulationResult.fixedFoodRate * 100).toFixed(1) }}%
        </td>
      </tr>
      <tr>
        <th>所持数</th>
        <td>
          {{ simulationResult.base.bag }}<br>
          <template v-if="simulationResult.base.evolveLv > 1">+ 5 × {{ simulationResult.base.evolveLv - 1 }} ※進化回数分<br></template>
          <template v-if="simulationResult.enableSubSkillList.includes('最大所持数アップS')">+ 6 ※サブスキル<br></template>
          <template v-if="simulationResult.enableSubSkillList.includes('最大所持数アップM')">+ 12 ※サブスキル<br></template>
          <template v-if="simulationResult.enableSubSkillList.includes('最大所持数アップL')">+ 18 ※サブスキル<br></template>
          ＝ {{ simulationResult.fixedBag }}
        </td>
      </tr>
      <tr>
        <th>所持数最大まで<br>おてつだい回数</th>
        <td>
          {{ simulationResult.fixedBag }} ÷ (<br>
          &emsp;{{ simulationResult.berryNum }} × (100% - {{ (simulationResult.fixedFoodRate * 100).toFixed(1) }}%) ※きのみ分<br>
          &emsp;+ ({{ simulationResult.enableFoodList.map(x => x.num).join(' + ') }}) ÷ {{ simulationResult.enableFoodList.length }} × {{ (simulationResult.fixedFoodRate * 100).toFixed(1) }}% ※食材分<br>
          )<br>
          + 4 (おてつだいキュー)<br>
          ＝ {{ (simulationResult.bagFullHelpNum).toFixed(2) }}
        </td>
      </tr>

      <tr>
        <th rowspan="8">お手伝い</th>
        <th>おてつだいスピード</th>
        <td>
          {{ simulationResult.help }}<br>
          × (100% - ({{ simulationResult.lv }} - 1) × 0.2%) ※Lv補正<br>
          × (100% - {{ (simulationResult.speedBonus * 100).toFixed(0) }}%)<br>
          <template v-if="simulationResult.nature?.good == '手伝いスピード'">× 90% ※せいかく<br></template>
          <template v-if="simulationResult.nature?.weak == '手伝いスピード'">× 110% ※せいかく<br></template>
          ＝ {{ (simulationResult.speed).toFixed(0) }}
        </td>
      </tr>
      <tr>
        <th>げんき回復量</th>
        <td>
          {{ (simulationResult.selfHealEffect || simulationResult.otherHealEffect || config.selectEvaluate.healer).toFixed(1) }}
          <template v-if="simulationResult.nature?.good == 'げんき回復量'">× 120% ※せいかく</template>
          <template v-if="simulationResult.nature?.weak == 'げんき回復量'">× 88% ※せいかく</template>
          ＝ {{ (simulationResult.healEffect).toFixed(1) }}
        </td>
      </tr>
      <tr>
        <th>日中手伝い回数</th>
        <td>
          (24 - {{ config.sleepTime }}) × 3600 ÷ {{ simulationResult.speed }}<br>
          × {{ (simulationResult.dayHelpNum / (24 - config.sleepTime) / 3600 * simulationResult.speed * 100).toFixed(1) }}% ※げんき補正<br>
          ＝ {{ (simulationResult.dayHelpNum).toFixed(2) }}
        </td>
      </tr>
      <tr>
        <th>夜間手伝い回数</th>
        <td>
          {{ config.sleepTime }} × 3600 ÷ {{ simulationResult.speed }}<br>
          × {{ (simulationResult.nightHelpNum / (config.sleepTime) / 3600 * simulationResult.speed * 100).toFixed(1) }}% ※げんき補正<br>
          ＝ {{ (simulationResult.nightHelpNum).toFixed(2) }}
        </td>
      </tr>
      <tr>
        <th>通常手伝い回数</th>
        <td>
          min({{ simulationResult.dayHelpNum.toFixed(2) }} ÷ {{ config.checkFreq - 1 }}, {{ (simulationResult.bagFullHelpNum).toFixed(2) }}) × {{ config.checkFreq - 1 }} ※{{ config.checkFreq - 1 }}は日中チェック回数から朝イチの1回を引いた数<br>
          + min({{ simulationResult.nightHelpNum.toFixed(2) }}, {{ (simulationResult.bagFullHelpNum).toFixed(2) }})<br>
          ＝ {{ (simulationResult.normalHelpNum).toFixed(2) }}
        </td>
      </tr>
      <tr>
        <th>いつ育回数</th>
        <td>
          {{ (simulationResult.dayHelpNum).toFixed(2) }} + {{ (simulationResult.nightHelpNum).toFixed(2) }} - {{ (simulationResult.normalHelpNum).toFixed(2) }}<br>
          ＝ {{ (simulationResult.berryHelpNum).toFixed(2) }}
        </td>
      </tr>

      <tr>
        <th>きのみエナジー</th>
        <td>
          ({{ (simulationResult.normalHelpNum).toFixed(2) }} × (100% - {{ (simulationResult.fixedFoodRate * 100).toFixed(1) }}%) + {{ (simulationResult.berryHelpNum).toFixed(2) }}) ※通常手伝い×きのみ率＋いつ育<br>
          × max({{ Berry.map[simulationResult.base.berry].energy }} + {{ simulationResult.lv }} - 1, {{ Berry.map[simulationResult.base.berry].energy }} × 102.5% ^ ({{ simulationResult.lv }} - 1))<br>
          × {{ simulationResult.berryNum }} ※きのみの数<br>
          × 2 ※好物前提のため2倍<br>
          ＝ {{ simulationResult.berryEnergyPerDay.toFixed(1) }}
        </td>
      </tr>

      <tr>
        <th>食材エナジー</th>
        <td>
          {{ (simulationResult.normalHelpNum).toFixed(2) }} × {{ (simulationResult.fixedFoodRate * 100).toFixed(1) }}% ※通常手伝い×食材率<br>
          × (<br>
          <template v-for="(food, i) in simulationResult.enableFoodList">
          &emsp;<template v-if="i">+ </template>{{ Food.map[food.name].energy }} × {{ food.num }} × (({{ (Food.map[food.name].bestRate * 100).toFixed(0) }}% × {{ Cooking.maxRecipeBonus * 100 }}% - 100%) × {{ config.selectEvaluate.foodEnergyRate }}% + 100%)<br>
          </template>
          )<br>
          ÷ {{ simulationResult.enableFoodList.length }}<br>
          ＝ {{ simulationResult.foodEnergyPerDay.toFixed(1) }}
        </td>
      </tr>

      <tr>
        <th :rowspan="simulationResult.skillList.length + 6">スキル</th>
        <th>スキル確率</th>
        <td>
          {{ (simulationResult.skillRate * 100).toFixed(2) }}%<br>
          <template v-if="simulationResult.enableSubSkillList.includes('スキル確率アップS') || simulationResult.enableSubSkillList.includes('スキル確率アップM')">
            × (100%{{ simulationResult.enableSubSkillList.includes('スキル確率アップS') ? ' + 18%' : '' }}{{ simulationResult.enableSubSkillList.includes('スキル確率アップM') ? ' + 36%' : '' }}) ※サブスキル<br>
          </template>
          <template v-if="simulationResult.nature?.good == 'メインスキル発生確率'">× 120% ※せいかく<br></template>
          <template v-if="simulationResult.nature?.weak == 'メインスキル発生確率'">× 80% ※せいかく<br></template>
          ＝ {{ (simulationResult.fixedSkillRate * 100).toFixed(2) }}%
        </td>
      </tr>
      <tr>
        <th>天井</th>
        <td>
          <template v-if="simulationResult.specialty == 'スキル'">
            40 × 3600 ÷ {{ simulationResult.help }} ＝ {{ (40 * 3600 / simulationResult.help).toFixed(1) }} ※スキルタイプは40時間÷基礎おてつだい時間(小数点以下の扱い不明)
          </template>
          <template v-else>
            78 ※スキルタイプ以外は78回固定
          </template>
        </td>
      </tr>
      <tr>
        <th>天井補正後<br>スキル確率</th>
        <td>
          {{ (simulationResult.fixedSkillRate * 100).toFixed(2) }}% ÷ (100% - (100% - {{ (simulationResult.fixedSkillRate * 100).toFixed(2) }}%) ^ {{ simulationResult.specialty == 'スキル' ? (40 * 3600 / simulationResult.help).toFixed(1) : 78 }})<br>
          ＝ {{ (simulationResult.ceilSkillRate * 100).toFixed(2) }}%
        </td>
      </tr>
      <tr>
        <th>スキル回数</th>
        <td>
          {{ (simulationResult.ceilSkillRate * 100).toFixed(2) }}% × {{ (simulationResult.normalHelpNum).toFixed(2) }}<br>
          ＝ {{ (simulationResult.skillPerDay).toFixed(2) }}
        </td>
      </tr>
      <tr>
        <th>スキルLv</th>
        <td>
          <template v-if="config.selectEvaluate.skillLevel[simulationResult.skill.name]">
            {{ config.selectEvaluate.skillLevel[simulationResult.skill.name] }} ※設定値
          </template>
          <template v-else>
            {{ simulationResult.evolveLv }} ※進化段階
            <template v-if="simulationResult.enableSubSkillList.includes('スキルレベルアップS')">+ 1 (サブスキル)<br></template>
            <template v-if="simulationResult.enableSubSkillList.includes('スキルレベルアップM')">+ 2 (サブスキル)<br></template>
            ＝ {{ simulationResult.fixedSkillLv }}
          </template>
        </td>
      </tr>
      <tr v-for="skill of simulationResult.skillList">
        <th>{{ skill.name }}</th>
        <td>
          <template v-if="skill.name == 'エナジーチャージS' || skill.name == 'エナジーチャージS(ランダム)' || skill.name == 'エナジーチャージM'">
            {{ skill.effect[simulationResult.fixedSkillLv - 1] }}<br>
            <template v-if="simulationResult.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
          </template>
          <template v-if="skill.name == '食材ゲットS'">
            (<br>
            <template v-for="(food, i) in Food.list">
              {{ i ? '+ ' : '' }}{{ food.energy }} × (({{ (food.bestRate * 100).toFixed(0) }}% × {{ Cooking.maxRecipeBonus * 100 }}% - 100%) × {{ config.selectEvaluate.foodEnergyRate }}% + 100%) ※{{ food.name }}<br>
            </template>
            )<br>
            ÷ {{ Food.list.length }}<br>
            × {{ skill.effect[simulationResult.fixedSkillLv - 1] }}<br>
            <template v-if="simulationResult.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
          </template>
          
          <template v-if="skill.name == 'げんきチャージS'">
            げんき回復量で計算済み
          </template>
          
          <template v-if="skill.name == 'おてつだいサポートS' || skill.name == 'おてつだいブースト'">
            {{ simulationResult.scoreForSupportEvaluate.toFixed(1) }} ※厳選度{{ config.selectEvaluate.supportBorder }}%の上位33%のおてつだいあたりのエナジーの平均値<br>
            × {{ skill.effect[simulationResult.fixedSkillLv - 1] }}<template v-if="skill.name == 'おてつだいブースト'"> × 5</template><br>
            <template v-if="simulationResult.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
          </template>
          
          <template v-if="skill.name == 'げんきエールS' || skill.name == 'げんきオールS'">
            <template v-if="simulationResult.skill.name != 'ゆびをふる' || (simulationResult.skill.name == 'ゆびをふる' && skill.name == 'げんきエールS')">
              1日の1匹あたりの回復量：{{ simulationResult.otherHealEffect.toFixed(1) }}<br>
              <br>
              {{ simulationResult.scoreForHealerEvaluate.toFixed(1) }} ※厳選度{{ config.selectEvaluate.supportBorder }}%の上位33%のげんき補正なしエナジーの平均値<br>
              × (<br>
              &emsp;({{ (HelpRate.getHelpRate(simulationResult.otherHealEffect, config.dayHelpParameter) * 100).toFixed(1) }}% * (24 - {{ config.sleepTime }}) + {{ (HelpRate.getHelpRate(simulationResult.otherHealEffect, config.nightHelpParameter) * 100).toFixed(1) }}% * {{ config.sleepTime }}) ※ヒーラーありのおてつだい倍率<br>
              &emsp;÷ ({{ (HelpRate.getHelpRate(0, config.dayHelpParameter) * 100).toFixed(1) }}% * (24 - {{ config.sleepTime }}) + {{ (HelpRate.getHelpRate(0, config.nightHelpParameter) * 100).toFixed(1) }}% * {{ config.sleepTime }}) ※ヒーラーなしのおてつだい倍率<br>
              &emsp;- 1<br>
              )<br>
              × 4 ※4匹分<br>
              ÷ {{ simulationResult.skillPerDay.toFixed(2) }} ※スキル発動回数で割って1回あたりの効果にする<br>
            </template>
            <template v-else>
              げんきエールSに含む
            </template>
          </template>

          <template v-if="skill.name == 'ゆめのかけらゲットS' || skill.name == 'ゆめのかけらゲットS(ランダム)'">
            {{ skill.effect[simulationResult.fixedSkillLv - 1] }} × {{ config.selectEvaluate.shardEnergy }} ※{{ config.selectEvaluate.shardEnergy }}はゆめのかけらゲット評価の設定値<br>
            <template v-if="simulationResult.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
          </template>

          <template v-if="skill.name == '料理パワーアップS'">
            {{ Cooking.cookingPowerUpEnergy.toFixed(1) }} × {{ skill.effect[simulationResult.fixedSkillLv - 1] }}
            ※{{ Cooking.cookingPowerUpEnergy.toFixed(1) }}は全料理内最大料理と{{ Cooking.potMax }}以下の最大料理のエナジー差を食材数で割った値<br>
            <template v-if="simulationResult.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
          </template>

          <template v-if="skill.name == '料理チャンスS'">
            週の効果量<br>
            {{ skill.effect[simulationResult.fixedSkillLv - 1] }} × {{ simulationResult.skillPerDay.toFixed(2) }} × 7<br>
            <template v-if="simulationResult.skill.name == 'ゆびをふる'">÷ {{ Skill.metronomeTarget.length }}<br></template>
            ＝{{ (skill.effect[simulationResult.fixedSkillLv - 1] * simulationResult.skillPerDay * 7 / (simulationResult.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1)).toFixed(1) }}<br>
            <br>
            ({{ Cooking.getChanceWeekEffect(skill.effect[simulationResult.fixedSkillLv - 1] * simulationResult.skillPerDay * 7 / (simulationResult.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1) / 100).total.toFixed(2) }}
            - 24.6) ※週の効果量から料理倍率の期待値を計算し、通常時からの増分を計算<br>
            × {{ Cooking.maxEnergy.toFixed(0) }} ※今一番いい料理<br>
            ÷ ({{ simulationResult.skillPerDay.toFixed(2) }} × 7) ※週の発動回数で割って1回あたりの効果にする<br>
          </template>

          <template v-if="simulationResult.skillEnergyMap[skill.name]">
            ＝ {{ simulationResult.skillEnergyMap[skill.name]?.toFixed(0) }}
          </template>
        </td>
      </tr>
      <tr>
        <th>スキルエナジー</th>
        <td>
          {{ simulationResult.skillEnergy.toFixed(0) }} × {{ simulationResult.skillPerDay.toFixed(2) }}<br>
          ＝{{ simulationResult.skillEnergyPerDay.toFixed(1) }}
        </td>
      </tr>
      <tr>
        <th colspan="2">総計</th>
        <td>
          {{ simulationResult.berryEnergyPerDay.toFixed(1) }}
          + {{ simulationResult.foodEnergyPerDay.toFixed(1) }}
          + {{ simulationResult.skillEnergyPerDay.toFixed(1) }}<br>
          ＝ {{ simulationResult.energyPerDay.toFixed(0) }}<br>
        </td>
      </tr>

    </table>

  </PopupBase>
</template>

<style lang="scss" scoped>
.popup-base {
  width: 900px;

  h2 {
    display: flex;
    justify-content: flex-start;
    align-items: center;

    img {
      width: 1.5em;
    }
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