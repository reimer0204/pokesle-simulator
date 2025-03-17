<script setup>
import SettingList from '../components/util/setting-list.vue';
import Skill from '../data/skill';
import config from '../models/config';
import EvaluateTable from '../models/evaluate-table';

let editConfig = reactive(config.clone());
let result = ref(null)

async function save() {
  asyncWatcher.run(async (progressCounter) => {
    let isNew = !editConfig.initSetting;

    // let parameter = await HelpRate.inferParameter(editConfig, genkiCounter);
    // editConfig.healEffectParameter = parameter.healEffectParameter;
    // editConfig.dayHelpParameter = parameter.dayHelpParameter;
    // editConfig.nightHelpParameter = parameter.nightHelpParameter;

    await EvaluateTable.simulation(editConfig, progressCounter);
    editConfig.initSetting = true;
    // editConfig.version.helpRate = HelpRate.VERSION;
    editConfig.version.evaluateTable = EvaluateTable.VERSION;
    editConfig.version.evaluateTableSleepTime = config.sleepTime
    editConfig.version.evaluateTableCheckFreq = config.checkFreq

    config.save(editConfig);

    result.value = {
      isNew,
    }
  })

}

const specialtyList = ['きのみ', '食材', 'スキル']

</script>

<template>
  <div class="page">

    <DangerAlert v-if="config.version.evaluateTable == null">
      この設定を反映すると、あなたの設定に応じた厳選情報を計算します。<br>
      設定や端末のスペックによりますが、3～10分ほどかかるのでお待ちください。
    </DangerAlert>
    <DangerAlert v-else-if="config.version.evaluateTable != EvaluateTable.VERSION">
      ポケモン情報、もしくは厳選計算アルゴリズムが修正されています。時間のある時に再計算の実行をお願いします。
    </DangerAlert>
    <DangerAlert v-else-if="!EvaluateTable.isEnableEvaluateTable(config)">
      睡眠時間、チェック回数が変更されたため厳選テーブルの再計算が必要です。
    </DangerAlert>

    <ToggleArea open>
      <template #headerText>基本設定</template>

      <SettingList>
        <div>
          <label>睡眠時間</label>
          <div><input type="number" step="0.1" v-model="editConfig.sleepTime"> 時間</div>
        </div>

        <div>
          <label>日中タップ回数</label>
          <div><input type="number" step="1" v-model="editConfig.checkFreq"> 回</div>
        </div>
      </SettingList>
    </ToggleArea>

    <ToggleArea open>
      <template #headerText>厳選設定</template>

      <SettingList>
        <div>
          <label>下振れ考慮ボーダー</label>
          <div class="flex-column gap-5px">
            <div><input type="number" class="w-40px" v-model="editConfig.selectEvaluate.expectType.border" step="1" min="0" max="100" >&nbsp;%</div>
          </div>
          <small class="mt-5px w-150px">
            下振れ考慮するかどうかは次の「とくい毎設定・詳細設定」にあります。<br>
            下振れ考慮について
            
            <HelpButton title="下振れ考慮について" markdown="
              # 下振れ考慮について
              1%で当たるものを100回試行した時の期待値は1%×100で1回ですが、1回以上当たる確率は63.4%程度しかありません。
              つまり、下振れして1回も当たらない確率が36.6%あるということです。
              試行回数がもっと多ければ期待値に収束していきますが、ポケモンを日々入れ替える場合は試行回数が少ないため下振れすることも多いです。
              そのために、「XX%の確率で少なくとも1日n回は当たる」という方法で計算できるようにしたのが下振れ考慮です。

              # サブスキル・せいかく評価への影響
              「期待値」によって計算する場合、食材やスキルだけに限って考えると、確率アップとおてつだいスピードの短縮はほぼ等価です(実際は所持数溢れのためおてつだいスピードの方が若干評価が劣ります)。
              「下振れ考慮」によって計算する場合、確率が高い方が下振れが起きにくいので確率アップの方が若干高く評価されます。

              # その他、通常期待値との違い
              とくい分野の厳選度はより実態に即したものに近づきます。
              総合スコアの厳選度は通常の期待値より食材・スキルが少なく見積もられることになるので、相対的にきのみの数Sなどが高く評価されることになります。
              食材とくいは収束しにくいABCだと食材の価値が若干低く見積もられ、相対的にきのみとスキルに関連するサブスキルが高く評価されることになります。
            " />
          </small>
        </div>
        <div>
          <label>エナジー/ゆめのかけら</label>
          <div><input type="number" class="w-80px" v-model="editConfig.selectEvaluate.shardEnergyRate" step="1"></div>
          <small>ゆめのかけら1個を得る<br>のに必要なエナジー</small>
        </div>
        <div>
          <label>ゆめのかけらゲット評価</label>
          <div><input type="number" class="w-80px" v-model="editConfig.selectEvaluate.shardEnergy" step="1"></div>
          <small>
            1個あたり何エナジー<br>として換算するか<br>
            <HelpButton title="ゆめのかけらゲット評価値の設定について" markdown="
              # デフォルト値が20の理由
              睡眠スコアが100のとき、概ね「120エナジー≒1ゆめのかけら」となります。
              リサーチランクがカンストしている場合、ゆめのかけらのおよそ半分であるリサーチEXPもゆめのかけらになるので、「80エナジー≒1ゆめのかけら」となります。
              月曜に稼いだエナジーは7回評価されるため、日給80エナジーのPTで稼げるゆめのかけらは、1+2+3+4+5+6+7で28になります。
              つまり、
              「80エナジー/日＝約28ゆめのかけら/週＝約4ゆめのかけら/日」
              となるため、1ゆめのかけらは20エナジー相当としています。

              上記計算の通り、これは1週間ずっと編成する運用をする場合の厳選設定になるので、例えば日曜にしか組み込む予定がない場合はそのまま80エナジー＝1ゆめのかけらになるので、80を設定してください。
              
              # エナジー換算するとすごい数字になるけど？
              スキルレベル7のゆめのかけら1800個になるとエナジー換算で数万ほどで評価されるぶっ壊れになりますが、実際それだけのゆめのかけらを稼ぐには平均54,000エナジー必要であり、ゆめのかけらゲット持ちの厳選はスキルの発動が最優先だと思われるので、この数値で概ね問題ないと思います。
              この値は厳選時のみで、ポケモン一覧でのスコア表示や、チーム用のシミュレーションの際はゆめのかけらの評価度を設定できるので、10%～30%程度にしておけば使いやすいと思います。
            " />
          </small>
        </div>
        <div>
          <label>ゆめのかけらボーナス評価</label>
          <div><input type="number" class="w-80px" v-model="editConfig.selectEvaluate.shardBonus" step="1"> %</div>
          <small>
            0%:エナジー換算しない<br>
            100%:エナジー6%アップとして評価
          </small>
        </div>
        <div>
          <label>サポートスキル評価用</label>
          <div>厳選ライン：<input type="number" class="w-40px" v-model="editConfig.selectEvaluate.supportBorder" step="1"> %</div>
          <div>上位：<input type="number" class="w-40px" v-model="editConfig.selectEvaluate.supportRankNum" step="1"> %</div>
          <small class="w-120px">
            サポートスキル評価時に参照する他ポケモンの厳選度と上位何%を使用するか
          </small>
        </div>
        <div>
          <label>仮定ヒーラー</label>
          <div><input type="number" class="w-80px" v-model="editConfig.selectEvaluate.healer" step="1"></div>
          <small>
            性格のげんき補正評価用の<br>1日の回復量
          </small>
        </div>
        <div>
          <label>銀種前提厳選</label>
          <div>
            <label><input type="checkbox" v-model="editConfig.selectEvaluate.silverSeedUse">銀種前提</label>
            <small>チェックを外す方が重いです。</small>
          </div>
        </div>
        <div>
          <label>おてつだいボーナス評価</label>
          <div><input type="number" class="w-80px" v-model="editConfig.selectEvaluate.helpBonus" step="1" min="0" max="25"> %</div>
          <small>
            おてつだいボーナスが短縮する割合を指定します。<br>
            25%にした場合、おてつだいスピードMは10%分しか評価されません。<br>
            25%未満の場合、余りは単に倍率になります。<br>
            (20%の場合、結果を更に0.95で割る)
          </small>
        </div>
        <div>
          <label>厳選レベル</label>
          <div>
            <label><input type="checkbox" v-model="editConfig.selectEvaluate.levelList[10]">10</label>
            <label><input type="checkbox" v-model="editConfig.selectEvaluate.levelList[25]">25</label>
            <label><input type="checkbox" v-model="editConfig.selectEvaluate.levelList[30]">30</label>
            <label><input type="checkbox" v-model="editConfig.selectEvaluate.levelList[50]">50</label>
            <label><input type="checkbox" v-model="editConfig.selectEvaluate.levelList[60]">60</label>
            <label><input type="checkbox" v-model="editConfig.selectEvaluate.levelList[75]">75</label>
            <label><input type="checkbox" v-model="editConfig.selectEvaluate.levelList[100]">100</label>
            <small>どのLv時点の評価で厳選するか設定します。<br>100Lvは組合せが多く計算が重いのと、100Lvに強い<br>サブスキルがあっても育成が大変なため省略推奨です。</small>
          </div>
        </div>
        <div>
          <label>おやすみリボン</label>
          <div>
            <div><input type="number" class="w-50px" v-model="editConfig.selectEvaluate.pokemonSleepTime"> 時間</div>
          </div>
        </div>
      </SettingList>
    </ToggleArea>

    <ToggleArea open>
      <template #headerText>とくい毎設定・詳細設定</template>

      <DesignTable>
        <thead>
          <tr>
            <th></th>
            <th>きのみ</th>
            <th>食材</th>
            <th>スキル</th>
            <th>下振れ考慮</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>きのみ評価</th>
            <td v-for="specialty in specialtyList">
              <div><input type="number" class="w-50px" v-model="editConfig.selectEvaluate.specialty[specialty].berryEnergyRate" step="1"> %</div>
            </td>
            <td></td>
            <td>
              <small>
              100%:好みと合わせない前提<br>
              200%:好みと合わせる前提
              </small>
            </td>
          </tr>
          <tr>
            <th>食材評価</th>
            <td v-for="specialty in specialtyList">
              <div><input type="number" class="w-50px" v-model="editConfig.selectEvaluate.specialty[specialty].foodEnergyRate" step="1"> %</div>
            </td>
            <td>
              <div class="flex-column-start-start gap-5px">
                <InputRadio v-model="editConfig.selectEvaluate.expectType.food" :value="0">通常期待値(確率×回数)</InputRadio>
                <InputRadio v-model="editConfig.selectEvaluate.expectType.food" :value="1">下振れ考慮</InputRadio>
              </div>
            </td>
            <td>
              <small>
              0%:基礎エナジー<br>
              100%:最良料理×最大レシピLv
              </small>
            </td>
          </tr>
          <tr>
            <th>
              食材ゲット評価
            </th>
            <td v-for="specialty in specialtyList">
              <div><input type="number" class="w-50px" v-model="editConfig.selectEvaluate.specialty[specialty].foodGetRate" step="1"> %</div>
            </td>
            <td></td>
            <td class="w-200px">
              <small>
                食材ゲットで手に入る食材を全て料理に使用するのは大抵の場合難しいため、食材評価より低い数値を設定します。<br>
                0%:基礎エナジー<br>
                100%:最良料理×最大レシピLv<br>
              </small>
            </td>
          </tr>
          <tr v-for="skill in Skill.list">
            <th>
              <div>{{ skill.name }}</div>
              <div>のスキルレベル</div>
            </th>
            <td v-for="specialty in specialtyList">
              <div>
                <InputRadio v-model="editConfig.selectEvaluate.specialty[specialty].skillLv[skill.name].type" :value="1">最終進化時Lv</InputRadio>
                <InputRadio v-model="editConfig.selectEvaluate.specialty[specialty].skillLv[skill.name].type" :value="2">最大Lv</InputRadio>
                <InputRadio v-model="editConfig.selectEvaluate.specialty[specialty].skillLv[skill.name].type" :value="3">
                  <div class="flex-row-start-center white-space-nowrap gap-5px">
                    指定レベル
                    <input type="number" class="w-50px" :value="editConfig.selectEvaluate.specialty[specialty].skillLv[skill.name].lv"
                      @input="editConfig.selectEvaluate.specialty[specialty].skillLv[skill.name].lv = $event.target.value ? Number($event.target.value) : null"
                      :disabled="editConfig.selectEvaluate.specialty[specialty].skillLv[skill.name].type != 3">
                  </div>
                </InputRadio>
              </div>
            </td>
            <td>
              <div class="flex-column-start-start gap-5px">
                <!-- <InputRadio v-model="editConfig.selectEvaluate.expectType[skill.name]" :value="0">通常期待値(確率×回数)</InputRadio>
                <InputRadio v-model="editConfig.selectEvaluate.expectType[skill.name]" :value="1">下振れ考慮</InputRadio> -->
                <InputRadio :value="0" disabled>通常期待値(確率×回数)</InputRadio>
                <InputRadio :value="1" disabled>下振れ考慮</InputRadio>
                <div>※将来機能</div>
              </div>
            </td>
            <td>
              <small>
                「最終進化時Lv」は例えばライチュウなら3になります。
              </small>
            </td>
          </tr>
        </tbody>
      </DesignTable>
    </ToggleArea>

    <ToggleArea open>
      <template #headerText>その他設定</template>

      <SettingList>
        <div>
          <label>スレッド数</label>
          <div>
            <input type="number" step="1" v-model="editConfig.workerNum" min="1" max="100">
            <small>ワーカースレッドの数を指定します。</small>
          </div>
        </div>
      </SettingList>
    </ToggleArea>

    <button @click="save">設定を保存して厳選情報を計算する</button>

    <BaseAlert v-if="result">
      厳選情報の計算が完了しました。ボックス画面から厳選情報を確認できます。
    </BaseAlert>
  </div>
</template>

<style lang="scss" scoped>
.page {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 10px;
  height: 100%;
  overflow: auto;

  .list {
    display: grid;
    grid-template-columns: max-content 1fr;
  }
  
  .toggle-area {
    width: 100%;
  }

  .group {
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 10px;

    border: 1px #888 solid;
    border-radius: 10px;
  }

  .caution {
    color: #f04;
    font-weight: bold;
  }

  .skill-level-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, 100px 1em 50px);
    align-items: center;

    label {
      text-align: right;
    }

    input {
      margin-right: 10px;
    }
  }
}
</style>