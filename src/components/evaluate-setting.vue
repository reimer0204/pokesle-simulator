<script setup lang="ts">
import Pokemon from '@/data/pokemon.ts';
import Skill from '@/data/skill';
import Exp from '@/data/exp.ts';
import { Cooking } from '@/data/food_and_cooking.ts';
import SubSkill from '@/data/sub-skill.ts';
import { createEvaluateRule, createEvaluateRuleSetting } from '@/models/evaluate-setting';

const props = withDefaults(
  defineProps<{ settingConfig: any; evaluateConfig: any; isTmpEvaluate?: boolean }>(),
  {
    isTmpEvaluate: false,
  },
);
const specialtyList = ['きのみ', '食材', 'スキル', 'オール'];
const skillListWithEnergySetting = computed(() =>
  Skill.list.filter((skill) => skill.evaluateEnergy != null),
);
const pokemonList = computed(() => Pokemon.nameSortList);
const lastPokemonList = computed(() => pokemonList.value.filter((pokemon) => pokemon.isLast));

function addEvaluateRule() {
  props.evaluateConfig.ruleList.push(createEvaluateRule());
}

function removeEvaluateRule(index: number) {
  props.evaluateConfig.ruleList.splice(index, 1);
}

function addEvaluateRuleSetting(rule: any) {
  rule.settingList.push(createEvaluateRuleSetting());
}

function removeEvaluateRuleSetting(rule: any, index: number) {
  rule.settingList.splice(index, 1);
}

function getRuleTargetType(rule: any) {
  if (rule.target.type != null) return rule.target.type;
  if (rule.target.all) return 'all';
  if (rule.target.pokemonNameList.length) return 'pokemon';
  return 'condition';
}

function setRuleTargetType(rule: any, type: string) {
  rule.target.type = type;
  rule.target.all = type === 'all';
  if (type !== 'condition') {
    for (const specialty of specialtyList) rule.target.specialties[specialty] = false;
    rule.target.skillNameList = [];
  }
  if (type !== 'pokemon') rule.target.pokemonNameList = [];
}

function getRuleTargetLabel(rule: any) {
  const type = getRuleTargetType(rule);
  if (type === 'all') return '全員';
  if (type === 'pokemon') return `ポケモン：${rule.target.pokemonNameList.join('・')}`;

  const targetList = [
    ...specialtyList
      .filter((specialty) => rule.target.specialties[specialty])
      .map((specialty) => `${specialty}とくい`),
    ...rule.target.skillNameList,
  ];
  return targetList.length ? targetList.join('・') : '条件で指定（未選択）';
}

function getConditionPokemonList(rule: any) {
  const selectedSpecialtyList = specialtyList.filter(
    (specialty) => rule.target.specialties[specialty],
  );
  if (!selectedSpecialtyList.length && !rule.target.skillNameList.length) return [];

  return lastPokemonList.value.filter((pokemon) => {
    if (selectedSpecialtyList.length && !selectedSpecialtyList.includes(pokemon.specialty))
      return false;
    if (rule.target.skillNameList.length && !rule.target.skillNameList.includes(pokemon.skill.name))
      return false;
    return true;
  });
}

function getRuleSettingValue(setting: any) {
  return setting.type === 'skillLv' ? `skillLv:${setting.skillName}` : setting.type;
}

function setRuleSetting(setting: any, value: string) {
  if (value.startsWith('skillLv:')) {
    setting.type = 'skillLv';
    setting.skillName = value.slice('skillLv:'.length);
    return;
  }
  setting.type = value;
  setting.skillName = null;
}

const maxEnergyPerExp = computed(() => {
  return Pokemon.list
    .filter((x) => x.isLast)
    .map((pokemon) => {
      let beforeEnergy = 0;
      let maxEnergyPerExp = { score: 0, lv: 0 } as any;
      for (let lv = 1; lv <= Exp.list.length; lv++) {
        const energy =
          (Math.max(pokemon.berry.energy + lv - 1, pokemon.berry.energy * Math.pow(1.025, lv - 1)) *
            (pokemon.specialty == 'きのみ' || pokemon.specialty == 'オール' ? 3 : 2) *
            86400) /
          pokemon.help /
          0.45 /
          0.65 /
          0.9 /
          (1 - (lv - 1) * 0.002);
        if (lv >= 30) {
          const requireExp = (Exp.list[lv - 1].total - Exp.list[lv - 2].total) * pokemon.exp;
          const score = (energy - beforeEnergy) / requireExp;
          if (maxEnergyPerExp.score < score)
            maxEnergyPerExp = { score, lv, requireExp, energy, beforeEnergy };
        }
        beforeEnergy = energy;
      }
      return { ...maxEnergyPerExp, name: pokemon.name };
    })
    .sort((a, b) => b.score - a.score)[0];
});
</script>

<template>
  <div class="setting">
    <ToggleArea open>
      <template #headerText>基本設定</template>
      <SettingList>
        <div>
          <label>睡眠時間</label>
          <div><InputNumber type="number" step="0.1" v-model="settingConfig.sleepTime" /> 時間</div>
        </div>
        <div>
          <label>日中タップ回数</label>
          <div><InputNumber type="number" step="1" v-model="settingConfig.checkFreq" /> 回</div>
        </div>
        <div>
          <label>おてつだいボーナス評価</label>
          <div>
            <InputNumber
              type="number"
              class="w-80px"
              v-model="evaluateConfig.teamHelpBonus"
              step="1"
              min="0"
              max="4"
            />
            匹
          </div>
          <small>
            自分以外の4匹におてつだいボーナスが何匹いるか指定します。<br>
            3匹にすると、おてボ＋おてスピMが最も高く評価されます。
          </small>
        </div>
        <div>
          <label>銀種前提厳選</label>
          <div class="flex-row flex-wrap gap-10px">
            <InputCheckbox
              v-for="subSkill in SubSkill.list
                .filter((x) => x.next != null)
                .sort((a, b) => b.name.localeCompare(a.name))"
              v-model="evaluateConfig.silverSeed[subSkill.name]"
              >{{ subSkill.name }}</InputCheckbox
            >
          </div>
          <small>銀種を使うサブスキルを設定してください。</small>
        </div>
        <div v-if="!props.isTmpEvaluate">
          <label>厳選レベル</label>
          <div class="flex-row-start-center gap-5px">
            <InputCheckbox
              v-for="lv in [10, 25, 30, 50, 60, 70, 80]"
              v-model="evaluateConfig.levelList[lv]"
              >{{ lv }}</InputCheckbox
            >
          </div>
          <small>どのLv時点の評価で厳選するか設定します。</small>
        </div>
      </SettingList>
    </ToggleArea>

    <ToggleArea open>
      <template #headerText>経験値関連補正</template>
      <div>
        経験値に関するサブスキル・せいかく・スキルはエナジーには直接影響を与えないため、あなたのプレイスタイルに応じて補正値を設定できます。
      </div>
      <div class="experience-setting-list mt-10px gap-10px">
        <div class="design-table-scroll">
          <DesignTable
            ><thead>
              <tr>
                <th></th>
                <th>加算</th>
                <th>倍率</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>睡眠EXPボーナス</th>
                <td>
                  ＋<InputNumber
                    class="w-50px"
                    v-model="evaluateConfig.subSkill.suiminExpBonus.add"
                  />
                </td>
                <td>
                  <InputNumber
                    percent
                    class="w-50px"
                    v-model="evaluateConfig.subSkill.suiminExpBonus.rate"
                  />
                  %
                </td>
              </tr>
              <tr>
                <th>EXP獲得量▲▲</th>
                <td>＋<InputNumber class="w-50px" v-model="evaluateConfig.nature.expUp.add" /></td>
                <td>
                  <InputNumber percent class="w-50px" v-model="evaluateConfig.nature.expUp.rate" />
                  %
                </td>
              </tr>
              <tr>
                <th>EXP獲得量▼▼</th>
                <td>
                  ＋<InputNumber class="w-50px" v-model="evaluateConfig.nature.expDown.add" />
                </td>
                <td>
                  <InputNumber
                    percent
                    class="w-50px"
                    v-model="evaluateConfig.nature.expDown.rate"
                  />
                  %
                </td>
              </tr>
            </tbody></DesignTable
          >
        </div>
        <SettingList
          ><div>
            <label>経験値のエナジー換算</label>
            <div>
              <InputNumber
                type="number"
                class="w-40px"
                v-model="evaluateConfig.energyPerCandy"
                step="1"
                min="0"
                max="100"
              />
              エナジー / 25経験値
            </div>
            <small
              >アメを獲得するスキルのエナジー計算に利用されます。<br>
              参考値:{{ (maxEnergyPerExp.score * 25).toFixed(0) }} エナジー / 日 / アメ

              <HelpButton title="経験値のエナジー換算" :markdown="`
                # 参考情報
                Lv30以降で1レベル上がることで増加する1日のきのみエナジーの理論値/経験値の最大値は ${(maxEnergyPerExp.score).toFixed(2)} です。
                ※Lvが低いうちはきのみエナジーの計算式が異なるので30以降で計算

                上記値になるケース
                ${maxEnergyPerExp.name}
                Lv${maxEnergyPerExp.lv - 1}: ${Math.round(maxEnergyPerExp.beforeEnergy)}エナジー
                Lv${maxEnergyPerExp.lv}: ${Math.round(maxEnergyPerExp.energy)}エナジー
                 (必要経験値: ${maxEnergyPerExp.requireExp})

                よって、アメ1個あたりの数値に直すと ${(maxEnergyPerExp.score * 25).toFixed(0)}
                その育てたポケモンを1週間運用する場合は ${(maxEnergyPerExp.score * 25 * 7).toFixed(0)}
                その育てたポケモンを30日運用する場合は ${(maxEnergyPerExp.score * 25 * 30).toFixed(0)}

                理論値で計算しているのでその点については高めに出ている一方、サブスキルの解放は考慮していない値のため、概ねこの値を設定しておけばそれっぽい数値になるかと思います。
                育てたポケモンを平均何日運用するかで調整してください。
              `" />
            </small>
          </div></SettingList
        >
      </div>
    </ToggleArea>

    <ToggleArea open>
      <template #headerText>計算設定</template>
      <SettingList>
        <div>
          <label>エナジー/ゆめのかけら</label>
          <div>
            <InputNumber
              type="number"
              class="w-80px"
              v-model="evaluateConfig.shardEnergyRate"
              step="1"
            />
          </div>
          <small>
            ゆめのかけら1個を得る<br />のに必要なエナジー

            <HelpButton title="エナジー/ゆめのかけらの設定値について" markdown="
              # 結論
              EXフィールド＆リサーチランクカンストを見据えるなら 50
              そうでないなら 120
              睡眠スコアが100でない場合はその分増やしてください(睡眠スコアが50なら倍)

              # 計算
              基本的に約12000ねむけパワーにつき1ゆめのかけらが得られます。
              睡眠スコアが100と考えると、120エナジー/ゆめのかけら となります。

              リサーチランクがカンストしていると、およそ半分ほどのリサーチEXPもゆめのかけらになるので、80エナジー/ゆめのかけら となります。

              更にEXフィールドだと、ゆめのかけら・リサーチEXPは8割ほど多く手に入るため、50エナジー/ゆめのかけら となります。
            " />
          </small>
        </div>
        <div>
          <label>ゆめのかけらゲット評価</label>
          <div>
            <InputNumber
              type="number"
              class="w-80px"
              v-model="evaluateConfig.shardEnergy"
              step="1"
            />
          </div>
          <small>
            1個あたり何エナジー<br />として換算するか

            <HelpButton title="ゆめのかけらゲット評価値の設定について" markdown="
              # 結論
              ゆめのかけらゲットを編成したい日に応じて、エナジー/ゆめのかけら 設定値に対し、以下を掛け算した値
              月曜～：1/4
              火曜～：1/3.5
              水曜～：1/3
              木曜～：1/2.5
              金曜～：1/2
              土曜～：1/1.5
              日曜～：1/1

              # 計算
              エナジー/ゆめのかけら の設定値のデフォルトは50ですが、つまり月曜に50エナジーを稼ぐと、7回のリサーチにかかるので実質 50エナジー / 7ゆめのかけら になり、7エナジー / 1ゆめのかけら になります。

              ゆめのかけらゲットが真価を発揮するのはエナジーを稼いでも評価回数が少ない週の後半になります。
              日曜からなら1日だけなので、エナジー/ゆめのかけら 設定と同じ 50 を設定するのが良いでしょう。
            " />
          </small>
        </div>
        <div>
          <label>ゆめのかけらボーナス評価</label>
          <div>
            <InputNumber
              type="number"
              class="w-80px"
              v-model="evaluateConfig.shardBonus"
              step="1"
            />
            %
          </div>
          <small>0%:エナジー換算しない<br />100%:エナジー6%アップとして評価</small>
        </div>
        <div v-if="!props.isTmpEvaluate">
          <label>サポートスキル評価用</label>
          <div>
            厳選ライン：<InputNumber
              type="number"
              class="w-40px"
              v-model="evaluateConfig.supportBorder"
              step="1"
            />
            %
          </div>
          <div>
            上位：<InputNumber
              type="number"
              class="w-40px"
              v-model="evaluateConfig.supportRankNum"
              step="1"
            />
            %
          </div>
          <small class="w-120px"
            >サポートスキル評価時に参照する他ポケモンの厳選度と上位何%を使用するか</small
          >
        </div>
        <div>
          <label>料理パワーアップ評価方法</label>
          <div>
            <InputRadio v-model="evaluateConfig.cookingPowerUpType" :value="0"
              >3種のうち最大</InputRadio
            ><InputRadio v-model="evaluateConfig.cookingPowerUpType" :value="1"
              >3種の平均</InputRadio
            >
          </div>
          <div>
            上記の
            <InputNumber
              type="number"
              class="w-40px"
              v-model="evaluateConfig.cookingPowerUpRate"
              step="1"
            />
            %
          </div>
          <small class="w-120px"
            >なべ拡張の1個分を何エナジーとして評価するか。現在の平均は
            {{ Cooking.cookingPowerUpEnergyAverage.toFixed(1) }} エナジーです。

            <HelpButton title="料理パワーアップの評価方法" :markdown="`
              # 考え方
              いいキャンプチケットを使用しない場合は、料理パワーアップを発動することでより良い料理が作れるようになります。
              10個分拡大して10000エナジー高い料理が作れる場合、1個分の拡大あたり1000エナジーの価値があると考えられます。
              その考えに基づき、現在のなべの最大値で作れる料理と最も良い料理のエナジー差と、食材数の差から価値を計算しています。

              この時、料理3種それぞれで差が異なるので、そのどれを使用するかを設定できます。
              現環境では以下の通りです。
              カレー：${Cooking.cookingPowerUpEnergyMap['カレー'].toFixed(1)}エナジー
              サラダ：${Cooking.cookingPowerUpEnergyMap['サラダ'].toFixed(1)}エナジー
              デザート：${Cooking.cookingPowerUpEnergyMap['デザート'].toFixed(1)}エナジー
              平均：${Cooking.cookingPowerUpEnergyAverage.toFixed(1)}エナジー
              
              また、食材が十分用意された状態では料理パワーアップの価値は上記の通り計算できますが、これから食材も集める場合は料理パワーアップだけでは意味がないので、食材担当と併用する運用が基本の場合は100%ではなく50%などの値にする必要があります。
            `" />
          </small>
        </div>
        <div>
          <label>仮定ヒーラー</label>
          <div>
            <InputNumber type="number" class="w-80px" v-model="evaluateConfig.healer" step="1" />
          </div>
          <small>性格のげんき補正評価用の<br />1日の回復量</small>
        </div>
        <div>
          <label>げんき計算</label>
          <div>
            <InputCheckbox v-model="evaluateConfig.genkiFullIfSelfHeal"
              >げんきチャージ持ちは<br />常時げんき100%とする</InputCheckbox
            >
            <small>ONにするとせいかくのげんき補正が無視されます</small>
          </div>
        </div>
        <div>
          <label>おやすみリボン</label>
          <div>
            <InputNumber type="number" class="w-50px" v-model="evaluateConfig.pokemonSleepTime" />
            時間
          </div>
        </div>
      </SettingList>
    </ToggleArea>

    <ToggleArea open>
      <template #headerText>
        下振れ計算設定
        <HelpButton class="ml-5px" title="下振れ考慮について" markdown="
          # 下振れ考慮について
          1%で当たるものを100回試行した時の期待値は1%×100で1回ですが、1回以上当たる確率は63.4%程度しかありません。
          つまり、下振れして1回も当たらない確率が36.6%あるということです。
          試行回数がもっと多ければ期待値に収束していきますが、1日のおてつだい回数は多くて100回前後なので、頻繁に上振れ・下振れが発生します。
          特に料理関係は下振れすると困ることが多いので、この下振れ前提で評価させるようにすると、より安定した個体が評価されるようになります。
          (遅くても確率が高い方が高く評価されます)

          # サブスキル・せいかく評価への影響
          「期待値」によって計算する場合、食材やスキルだけに限って考えると、確率アップとおてつだいスピードの短縮はほぼ等価です(実際は所持数溢れのためおてつだいスピードの方が若干評価が劣ります)。
          「下振れ考慮」によって計算する場合、確率が高い方が下振れが起きにくいので確率アップの方が若干高く評価されます。

          # その他、通常期待値との違い
          とくい分野の厳選度はより実態に即したものに近づきます。
          総合スコアの厳選度は通常の期待値より食材・スキルが少なく見積もられることになるので、相対的にきのみの数Sなどが高く評価されることになります。
          食材とくいは収束しにくいABCだと食材の価値が若干低く見積もられ、相対的にきのみとスキルに関連するサブスキルが高く評価されることになります。
        " />
      </template>
      下振れすると困る要素にチェックをつけておくと、その点において下振れしにくいポケモンがより高い評価になります。
      <SettingList class="mt-5px">
        <div>
          <label>下振れ考慮ボーダー</label>
          <div>
            <InputNumber
              type="number"
              class="w-40px"
              v-model="evaluateConfig.expectType.border"
              step="1"
              min="0"
              max="100"
            />&nbsp;%
          </div>
          <small class="mt-5px w-150px">設定した確率で下回らない値を評価に使います。</small>
        </div>
        <div>
          <label>食材評価</label>
          <div class="flex-column-start-start gap-5px">
            <InputRadio v-model="evaluateConfig.expectType.food" :value="0">通常期待値</InputRadio>
            <InputRadio v-model="evaluateConfig.expectType.food" :value="1">下振れ考慮</InputRadio>
          </div>
        </div>
        <div class="fall-down-skill-setting">
          <label>下振れ考慮するスキル</label>
          <div class="flex-column-start-start gap-10px">
            <div v-for="category in Skill.categoryList" :key="category.id">
              <SettingSectionTitle>{{ category.name }}</SettingSectionTitle>
              <div class="flex-row flex-wrap gap-10px mt-5px">
                <InputCheckbox
                  v-for="skill in category.skillList"
                  :key="skill.name"
                  :model-value="evaluateConfig.expectType[skill.name] == 1"
                  @update:model-value="evaluateConfig.expectType[skill.name] = $event ? 1 : 0"
                >
                  {{ skill.name }}
                </InputCheckbox>
              </div>
            </div>
          </div>
          <small>未選択のスキルは通常期待値で評価します。</small>
        </div>
      </SettingList>
    </ToggleArea>

    <ToggleArea open>
      <template #headerText>とくい毎設定</template>
      <div class="design-table-scroll">
        <DesignTable class="specialty-setting-table"
          ><thead>
            <tr>
              <th></th>
              <th v-for="specialty in specialtyList">{{ specialty }}</th>
              <th>備考</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>きのみ評価</th>
              <td v-for="specialty in specialtyList" class="white-space-nowrap">
                <InputNumber
                  class="w-40px"
                  v-model="evaluateConfig.specialty[specialty].berryEnergyRate"
                />
                %
              </td>
              <td>
                <small>100%:好みと合わせない前提<br />200%:好みと合わせる前提<br />240%:EXやイベントボーナスを想定</small>
              </td>
            </tr>
            <tr>
              <th>食材評価</th>
              <td v-for="specialty in specialtyList" class="white-space-nowrap">
                <InputNumber
                  class="w-40px"
                  v-model="evaluateConfig.specialty[specialty].foodEnergyRate"
                />
                %
              </td>
              <td>
                <small>0%:基礎エナジー<br />100%:最良料理×最大レシピLv</small>
              </td>
            </tr>
            <tr>
              <th>食材ゲット評価</th>
              <td v-for="specialty in specialtyList" class="white-space-nowrap">
                <InputNumber
                  class="w-40px"
                  v-model="evaluateConfig.specialty[specialty].foodGetRate"
                />
                %
              </td>
              <td>
                <small>0%:基礎エナジー<br />100%:最良料理×最大レシピLv</small>
              </td>
            </tr>
            <tr>
              <th>スキルレベル設定</th>
              <td v-for="specialty in specialtyList" class="white-space-nowrap">
                <InputRadio v-model="evaluateConfig.specialty[specialty].skillLvType" :value="1"
                  >最大進化時Lv</InputRadio
                >
                <InputRadio v-model="evaluateConfig.specialty[specialty].skillLvType" :value="2"
                  >最大Lv</InputRadio
                >
              </td>
              <td><small>「最大進化時Lv」は、例えばライチュウならLv3です。</small></td>
            </tr>
          </tbody></DesignTable
        >
      </div>
    </ToggleArea>

    <ToggleArea open>
      <template #headerText>スキルレベル設定</template>

      とくい問わずスキルレベルを最大にしたいスキルを選択してください。
      <div class="flex-column-start-start gap-10px mt-10px">
        <div v-for="category in Skill.categoryList" :key="category.id">
          <SettingSectionTitle>{{ category.name }}</SettingSectionTitle>
          <div class="flex-row flex-wrap gap-10px mt-5px">
            <InputCheckbox
              v-for="skill in category.skillList"
              :key="skill.name"
              :model-value="evaluateConfig.maxSkillLvSkillNameList.includes(skill.name)"
              @update:model-value="
                $event
                  ? evaluateConfig.maxSkillLvSkillNameList.push(skill.name)
                  : evaluateConfig.maxSkillLvSkillNameList.splice(
                      evaluateConfig.maxSkillLvSkillNameList.indexOf(skill.name),
                      1,
                    )
              "
            >
              {{ skill.name }}
            </InputCheckbox>
          </div>
        </div>
      </div>
    </ToggleArea>

    <ToggleArea open>
      <template #headerText>ポケモン詳細設定</template>
      <p>とくい毎設定・スキルレベル設定を更に細かい条件で上書き出来ます。</p>
      <div class="evaluate-rule-list mt-10px">
        <div v-for="(rule, index) in evaluateConfig.ruleList" class="evaluate-rule">
          <div class="evaluate-rule-header">
            <SettingSectionTitle type="item">設定 {{ index + 1 }}</SettingSectionTitle>
            <FormButton type="button" @click="removeEvaluateRule(index)">削除</FormButton>
          </div>
          <div class="evaluate-rule-body">
            <div class="rule-target">
              <SettingSectionTitle type="field">対象</SettingSectionTitle>
              <SettingButton title="対象を設定" class="rule-target-button" fit-viewport>
                <template #label>{{ getRuleTargetLabel(rule) }}</template>
                <div class="rule-target-popup">
                  <div class="rule-target-type">
                    <InputRadio
                      :model-value="getRuleTargetType(rule)"
                      value="all"
                      @update:model-value="setRuleTargetType(rule, $event)"
                      >全員</InputRadio
                    >
                    <InputRadio
                      :model-value="getRuleTargetType(rule)"
                      value="condition"
                      @update:model-value="setRuleTargetType(rule, $event)"
                      >条件で指定</InputRadio
                    >
                    <InputRadio
                      :model-value="getRuleTargetType(rule)"
                      value="pokemon"
                      @update:model-value="setRuleTargetType(rule, $event)"
                      >ポケモンで指定</InputRadio
                    >
                  </div>
                  <template v-if="getRuleTargetType(rule) === 'condition'">
                    <div class="condition-target-list">
                      <div>
                        <h3>とくい</h3>
                        <InputCheckbox
                          v-for="specialty in specialtyList"
                          v-model="rule.target.specialties[specialty]"
                          >{{ specialty }}とくい</InputCheckbox
                        >
                      </div>
                      <strong class="condition-and">かつ</strong>
                      <div>
                        <h3>スキル</h3>
                        <template v-for="category in Skill.categoryList" :key="category.id">
                          <h4>{{ category.name }}</h4>
                          <InputCheckbox
                            v-for="skill in category.skillList"
                            :key="skill.name"
                            :model-value="rule.target.skillNameList.includes(skill.name)"
                            @update:model-value="
                              $event
                                ? rule.target.skillNameList.push(skill.name)
                                : rule.target.skillNameList.splice(
                                    rule.target.skillNameList.indexOf(skill.name),
                                    1,
                                  )
                            "
                            >{{ skill.name }}</InputCheckbox
                          >
                        </template>
                      </div>
                    </div>
                    <div class="matched-pokemon-list">
                      <strong>対象ポケモン</strong
                      ><span v-for="pokemon in getConditionPokemonList(rule)">{{
                        pokemon.name
                      }}</span
                      ><span v-if="!getConditionPokemonList(rule).length">該当なし</span>
                    </div>
                  </template>
                  <div
                    v-else-if="getRuleTargetType(rule) === 'pokemon'"
                    class="pokemon-target-list"
                  >
                    <InputCheckbox
                      v-for="pokemon in lastPokemonList"
                      :model-value="rule.target.pokemonNameList.includes(pokemon.name)"
                      @update:model-value="
                        $event
                          ? rule.target.pokemonNameList.push(pokemon.name)
                          : rule.target.pokemonNameList.splice(
                              rule.target.pokemonNameList.indexOf(pokemon.name),
                              1,
                            )
                      "
                      >{{ pokemon.name }}</InputCheckbox
                    >
                  </div>
                </div>
              </SettingButton>
            </div>
            <div class="rule-settings">
              <SettingList v-for="(setting, settingIndex) in rule.settingList">
                <div>
                  <label>上書き設定値</label>
                  <div class="rule-setting">
                    <InputSelect
                      :model-value="getRuleSettingValue(setting)"
                      @update:model-value="setRuleSetting(setting, $event)"
                    >
                      <option value="berryEnergyRate">きのみ評価</option>
                      <option value="foodEnergyRate">食材評価</option>
                      <option value="foodGetRate">食材ゲット評価</option>
                      <optgroup
                        v-for="category in Skill.categoryList"
                        :key="category.id"
                        :label="category.name"
                      >
                        <option
                          v-for="skill in category.skillList"
                          :key="skill.name"
                          :value="`skillLv:${skill.name}`"
                        >
                          {{ skill.name }}
                        </option>
                      </optgroup>
                    </InputSelect>
                    <div v-if="setting.type != 'skillLv'" class="rule-setting-value">
                      <InputNumber class="w-60px" v-model="setting.value" /> %
                    </div>
                    <div v-else class="rule-setting-value flex-column-start-start gap-5px">
                      <InputRadio v-model="setting.skillLvType" :value="1">最大進化時Lv</InputRadio>
                      <InputRadio v-model="setting.skillLvType" :value="2">最大Lv</InputRadio>
                      <InputRadio v-model="setting.skillLvType" :value="3"
                        >指定レベル
                        <InputNumber
                          class="w-50px"
                          v-model="setting.skillLv"
                          :disabled="setting.skillLvType != 3"
                      /></InputRadio>
                    </div>
                    <FormButton type="button" @click="removeEvaluateRuleSetting(rule, settingIndex)"
                      >削除</FormButton
                    >
                  </div>
                </div>
              </SettingList>
              <FormButton type="button" @click="addEvaluateRuleSetting(rule)"
                >上書き設定値を追加</FormButton
              >
            </div>
          </div>
        </div>
      </div>
      <FormButton class="mt-10px" type="button" @click="addEvaluateRule">設定を追加</FormButton>
    </ToggleArea>

    <ToggleArea open>
      <template #headerText>
        スキルエナジー設定
        <HelpButton class="ml-5px" title="デフォルト値の理由" markdown="
          スキルコピーやほっぺすりすりの対象はエナジーチャージM相当で評価しています。
          エナジーチャージMより強いスキルも一部ありますが、げんきオールや料理チャンスは積めば積むほど効果量が薄くなり、でんせつポケモンのスキルは1匹しか入れられないので、これらを基準にすると過剰に評価してしまいます。
          そのため、固定値で4匹固められる可能性のあるエナジーチャージMを基準にしています。

          ## ほっぺすりすりのデフォルト値
          エナジーチャージM持ちの中でもスキル確率の高いウソッキー(9%)に合わせ、補正が諸々かかった15%前提で計算しています。
        " />
      </template>
      <SettingList>
        <div v-for="skill in skillListWithEnergySetting">
          <label>{{ skill.name }}のエナジー換算</label>
          <div v-for="(energy, i) in skill.evaluateEnergy">
            Lv{{ i + 1 }}：<InputNumber
              class="w-60px"
              v-model="evaluateConfig.skillEnergy[skill.name][i]"
              :placeholder="energy"
            />
          </div>
        </div>
      </SettingList>
    </ToggleArea>

    <ToggleArea open>
      <template #headerText>その他設定</template>
      <SettingList
        ><div>
          <label>スレッド数</label>
          <div>
            <InputNumber
              type="number"
              step="1"
              v-model="settingConfig.workerNum"
              min="1"
              max="100"
            /><small>ワーカースレッドの数を指定します。</small>
          </div>
        </div></SettingList
      >
    </ToggleArea>
    <slot name="append" />
  </div>
</template>

<style lang="scss" scoped>
.setting {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.toggle-area {
  width: 100%;
}
.design-table-scroll {
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}
.specialty-setting-table tr > th:first-child {
  min-width: 50px;
}
.specialty-setting-table tr > :nth-last-child(3),
.specialty-setting-table tr > :last-child {
  min-width: 100px;
}
.experience-setting-list {
  display: flex;
  align-items: flex-start;
}
.evaluate-rule-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
}
.evaluate-rule {
  width: 100%;
  max-width: 450px;
  box-sizing: border-box;
  border: 1px solid var(--color-line);
  border-radius: 7px;
  padding: 10px;
}
.evaluate-rule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.evaluate-rule-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  margin-top: 10px;
}
.rule-target {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  min-width: 0;
}
.rule-target-button {
  max-width: 100%;
}
.rule-target-popup {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.rule-target-type {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-line);
}
.condition-target-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  flex: 1 1 auto;
  min-height: 0;
  gap: 15px;
  align-items: stretch;
  margin-top: 15px;
}
.condition-target-list > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  overflow: auto;
}
.condition-target-list h3 {
  margin: 0 0 5px;
  font-size: 1em;
  color: var(--color-primary-strong);
}
.condition-and {
  display: flex;
  align-items: center;
  color: var(--color-primary-strong);
}
.matched-pokemon-list {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 20vh;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 5px 10px;
  height: 20vh;
  margin-top: 15px;
  padding-top: 10px;
  overflow: auto;
  border-top: 1px solid var(--color-line);
}
.matched-pokemon-list strong {
  width: 100%;
  color: var(--color-primary-strong);
}
.pokemon-target-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  flex: 1 1 auto;
  min-height: 0;
  gap: 5px 10px;
  margin-top: 15px;
  overflow: auto;
}
.rule-settings {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  gap: 5px;
}
.rule-settings > .setting-list {
  width: 100%;
}
.rule-setting {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 10px;
}
.rule-setting > select {
  flex: 0 0 180px;
  width: 180px;
}
.rule-setting-value {
  flex: 1 1 auto;
  min-width: 0;
}
.rule-setting :deep(.form-button) {
  flex: 0 0 auto;
  margin-left: auto;
}
@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .experience-setting-list {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  .design-table-scroll {
    width: 100%;
  }
  .specialty-setting-table tr > th:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
  }
  .rule-target-popup {
    width: 100%;
  }
  .condition-target-list {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .condition-and {
    justify-content: center;
  }
  .pokemon-target-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
