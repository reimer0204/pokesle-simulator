<script setup>
import SettingList from '../components/setting-list.vue'

import config from '../models/config';
import HelpRate from '../models/help-rate';
import EvaluateTable from '../models/evaluate-table';

import Skill from '../data/skill'

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
    editConfig.version.helpRate = HelpRate.VERSION;
    editConfig.version.evaluateTable = EvaluateTable.VERSION;

    config.save(editConfig);

    result.value = {
      isNew,
    }
  })

}

</script>

<template>
  <div class="page">

    <DangerAlert v-if="!config.initSetting">
      ツールを使用するには初回設定が必要です。<br>
      まずは「基本設定」の「睡眠時間」と「日中タップ回数」をご自身のものに修正してください。<br>
      他の項目は気になる方だけ修正してください。
    </DangerAlert>

    <template v-else>
      <DangerAlert v-if="config.version.helpRate != HelpRate.VERSION">
        げんき計算のアルゴリズムが変更されています。時間のある時に再計算の実行をお願いします。
      </DangerAlert>
      <DangerAlert v-if="config.version.evaluateTable != EvaluateTable.VERSION">
        ポケモン情報、もしくは厳選計算アルゴリズムが修正されています。時間のある時に再計算の実行をお願いします。
      </DangerAlert>
    </template>


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

    <ToggleArea :open="config.initSetting">
      <template #headerText>厳選設定</template>

      <SettingList>
        <div>
          <label>きのみ評価</label>
          <div>
            <label class="flex-row-start-center">
              <input type="checkbox" v-model="editConfig.selectEvaluate.berryMatchAll">食材/スキルタイプも<br>好物前提で計算
            </label>
            <small>食材タイプやスキルタイプに<br>きのみエナジーを期待しない<br>場合は外してください。</small>
          </div>
        </div>
        <div>
          <label>食材評価</label>
          <div>
            <div><input type="number" v-model="editConfig.selectEvaluate.foodEnergyRate" step="1"> %</div>
            <small>
              0%:基礎エナジー<br>
              100%:最良料理×最大レシピLv
            </small>
          </div>
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
          <label>げんき系スキル評価用厳選ライン</label>
          <div><input type="number" class="w-80px" v-model="editConfig.selectEvaluate.supportBorder" step="1"> %</div>
          <small>
            げんき系スキルの評価時に<br>使用する他ポケモンの厳選度
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
        <div class="flex-110 w-100 flex-column-start-stretch">
          <label>スキルレベル</label>
          <div>
            <div class="skill-level-list gap-1px">
              <template v-for="skill in Skill.list">
                <label>{{ skill.name }}</label>
                <label>：</label>
                <div>
                  <input type="number" class="w-50px" :value="editConfig.selectEvaluate.skillLevel[skill.name]"
                    @input="editConfig.selectEvaluate.skillLevel[skill.name] = $event.target.value ? Number($event.target.value) : null">
                </div>
              </template>
            </div>
            <small>未入力の場合は進化回数に応じたスキルレベルで計算します(例:ライチュウなら3)</small>
          </div>
        </div>
      </SettingList>
    </ToggleArea>

    <ToggleArea :open="config.initSetting">
      <template #headerText>げんきシミュレーション設定</template>

      <SettingList>
        <div>
          <label>チェック率</label>
          <div>
            <input type="number" step="1" v-model="editConfig.genkiSimulation.pickupRate" min="1" max="100"> %
            <small>
              100%だと用意した全ケースでシミュレーションします。<br>
              大抵10%程度あれば十分使えるシミュレーション結果になります。
            </small>
          </div>
        </div>

        <div>
          <label>ループ回数</label>
          <div>
            <input type="number" step="1" v-model="editConfig.genkiSimulation.loopNum" min="100" max="10000"> 日
            <small>
              1ケースごとに何日分までシミュレーションを行うかを指定します。<br>
              デフォルトは1000ですが、気になる方は増やしてください。
            </small>
          </div>
        </div>
      </SettingList>
    </ToggleArea>

    <ToggleArea :open="config.initSetting">
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

    <DangerAlert>
      この設定を反映すると、あなたの睡眠時間やタップ頻度に応じたヒーラーの期待値やポケモンの厳選条件の期待値を計算します。<br>
      設定や端末のスペックによりますが、3～10分ほどかかるのでお待ちください。
    </DangerAlert>

    <button @click="save">保存</button>

    <BaseAlert v-if="result">
      各種分析が完了しました。<br>
      <template v-if="result.isNew">
        画面上部からボックスを開き、所持ポケモンを追加してご利用ください。
      </template>
    </BaseAlert>
  </div>
</template>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 10px;

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