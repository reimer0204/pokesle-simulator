<script setup>
import CookingSettingPopup from '../components/cooking-setting-popup.vue';
import Berry from '../data/berry.js';
import Cooking from '../data/cooking.js';
import Field from '../data/field.js';
import NightCapPikachu from '../data/nightcap_pikachu.js';
import config from '../models/config.js';
import PokemonBox from '../models/pokemon-box.js';
import PokemonFilter from '../models/pokemon-filter.js';
import Popup from '../models/popup/popup.js';

const disabledCookingNum = computed(() => {
  return Cooking.getDisabledCookingNum(config);
})

const fixFilterResult = computed(() => PokemonFilter.filter(PokemonBox.list, config.simulation.fixFilter));

</script>

<template>
  <SettingButton title="フィールド">
    <template #label>
      <div class="inline-flex-row-center">
        今週：{{ config.simulation.field }}
        <template v-if="config.simulation.field == 'ワカクサ本島'">
          (
            <template v-if="config.simulation.berryList[0]"><img :src="Berry.map[config.simulation.berryList[0]]?.img"></template><template v-else>?</template>
            <template v-if="config.simulation.berryList[1]"><img :src="Berry.map[config.simulation.berryList[1]]?.img"></template><template v-else>?</template>
            <template v-if="config.simulation.berryList[2]"><img :src="Berry.map[config.simulation.berryList[2]]?.img"></template><template v-else>?</template>
          )
        </template>
        FB:{{ config.simulation.fieldBonus }}

        {{ config.simulation.cookingType }}<template v-if="config.simulation.cookingWeight != 1">(x{{ config.simulation.cookingWeight }})</template>

        <template v-if="config.simulation.campTicket"> キャンチケ</template>
      </div>
    </template>

    <div class="flex-column-start-start gap-5px">
      <SettingTable>
        <tr>
          <th>フィールド</th>
          <td>
            <select v-model="config.simulation.field">
              <option value="ワカクサ本島">ワカクサ本島</option>
              <option value="シアンの砂浜">シアンの砂浜</option>
              <option value="トープ洞窟">トープ洞窟</option>
              <option value="ウノハナ雪原">ウノハナ雪原</option>
              <option value="ラピスラズリ湖畔">ラピスラズリ湖畔</option>
              <option value="ゴールド旧発電所">ゴールド旧発電所</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>きのみ</th>
          <td>
            <div v-if="config.simulation.field == 'ワカクサ本島'" class="flex-row-start-center gap-5px">
              <template v-for="i in 3">
                <select :value="config.simulation.berryList[i - 1]" @input="config.simulation.berryList[i - 1] = $event.target.value || null">
                  <option value="">-</option>
                  <option v-for="berry in Berry.list" :value="berry.name">{{ berry.name }}({{ berry.type }})</option>
                </select>
              </template>
            </div>
            <div v-else class="flex-row-start-center gap-5px">
              <template v-for="berry in Field.map[config.simulation.field].berryList">
                <select disabled>
                  <option value="">{{ berry }}</option>
                </select>
              </template>
            </div>
          </td>
        </tr>
        <tr>
          <th>フィールドボーナス</th>
          <td>
            <input type="number" class="w-40px" v-model="config.simulation.fieldBonus" step="1"> %
          </td>
        </tr>
        
        <tr>
          <th>種類</th>
          <td>
            <select v-model="config.simulation.cookingType">
              <option value="カレー">カレー・シチュー</option>
              <option value="サラダ">サラダ</option>
              <option value="デザート">デザート・ドリンク</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>料理評価倍率</th>
          <td>
            <input type="number" class="w-80px" v-model="config.simulation.cookingWeight" step="0.1"> 倍
            <div class="w-400px"><small>
              イベント等で料理エナジーにボーナスがかかっている場合に設定してください。<br>また、イベント週以外でもきのみエナジー度外視でレシピレベルを育てる場合などはこの値を大きくすると、料理を重視したシミュレーションが出来ます。
            </small></div>
          </td>
        </tr>
        
        <tr>
          <th>キャンプチケット</th>
          <td><label><input type="checkbox" v-model="config.simulation.campTicket">使う</label></td>
        </tr>
      </SettingTable>
    </div>

  </SettingButton>

  <SettingButton title="イベントボーナス">
    <template #label>
      <div class="inline-flex-row-center">
        イベントボーナス：<template v-if="config.simulation.eventBonusType == 'all'">全員</template><template v-else>{{ config.simulation.eventBonusType || 'なし' }}</template>
        <template v-if="config.simulation.eventBonusType">
          <template v-if="config.simulation.eventBonusTypeFood != 0"> 食材+{{ config.simulation.eventBonusTypeFood }}</template>
          <template v-if="config.simulation.eventBonusTypeSkillRate != 1"> スキル確率x{{ config.simulation.eventBonusTypeSkillRate }}</template>
          <template v-if="config.simulation.eventBonusTypeSkillLv != 0"> スキルレベル+{{ config.simulation.eventBonusTypeSkillLv }}</template>
        </template>
      </div>
    </template>

    <SettingTable>
      <tr>
        <th>適用タイプ</th>
        <td>
          <select :value="config.simulation.eventBonusType" @input="config.simulation.eventBonusType = $event.target.value || null">
            <option value="">-</option>
            <option value="all">全員</option>
            <option value="きのみ">とくい：きのみ</option>
            <option value="食材">とくい：食材</option>
            <option value="スキル">とくい：スキル</option>
            <option v-for="berry in Berry.list" :value="berry.type">タイプ：{{ berry.type }}</option>
          </select>
        </td>
      </tr>
      <tr>
        <th>食材</th>
        <td><input type="number" class="w-60px" v-model="config.simulation.eventBonusTypeFood" > 個追加</td>
      </tr>
      <tr>
        <th>スキル倍率</th>
        <td><input type="number" class="w-60px" v-model="config.simulation.eventBonusTypeSkillRate" step="0.1" > 倍</td>
      </tr>
      <tr>
        <th>スキルレベル</th>
        <td><input type="number" class="w-60px" v-model="config.simulation.eventBonusTypeSkillLv" > Lv追加</td>
      </tr>
    </SettingTable>

  </SettingButton>

  <SettingButton title="いつ育運用">
    <template #label>
      <div class="inline-flex-row-center">
        いつ育運用: {{ config.simulation.bagOverOperation ? 'する' : 'しない' }}
      </div>
    </template>

    <SettingTable>
      <tr>
        <th>いつ育育成</th>
        <td>
          <label><input type="checkbox" v-model="config.simulation.bagOverOperation">する</label>
          <div><small class="w-80px">きのみタイプ/きのみの数S持ちのみ対象です</small></div>
        </td>
      </tr>
    </SettingTable>
  </SettingButton>


  <SettingButton title="育成仮定">
    <template #label>
      <div class="inline-flex-row-center">
        育成仮定: {{ config.simulation.fix ? 'する' : 'しない' }}
        <template v-if="config.simulation.fix">(
          厳選{{ config.simulation.fixBorder }}%/{{ config.simulation.fixBorderSpecialty }}%以上
          {{ config.simulation.fixLv }}Lv
          <template v-if="config.simulation.fixEvolve"> 進化 </template>
          <template v-if="config.simulation.fixSubSkillSeed"> 銀種 </template>
          <template v-if="config.simulation.fixSkillSeed"> 金種 </template>
        )</template>
      </div>
    </template>

    <SettingTable>
      <tr>
        <th>育成仮定</th>
        <td>
          <label><input type="checkbox" v-model="config.simulation.fix">する</label>
        </td>
      </tr>
      <tr>
        <th>仮定条件</th>
        <td>
          <div               >エナジー厳選度 <input type="number" class="w-50px" v-model="config.simulation.fixBorder"          :disabled="!config.simulation.fix"> %以上のみ</div>
          <div class="mt-3px">とくい厳選度   <input type="number" class="w-50px" v-model="config.simulation.fixBorderSpecialty" :disabled="!config.simulation.fix"> %以上のみ</div>
          <small>厳選度が指定以上のポケモンのみ仮定します。<br>どちらかに合致した場合に対象となります。</small>

          <div>
            <SettingButton title="除外フィルタ">
              <template #label>
                <div class="inline-flex-row-center">
                  <template v-if="fixFilterResult.excludeList.length == 0">除外なし</template>
                  <template v-else>除外：{{ fixFilterResult.excludeList.length }}匹</template>
                </div>
              </template>

              <div class="flex-column-start-start gap-5px">
                <PokemonFilterEditor v-model="config.simulation.fixFilter" />
              </div>
            </SettingButton>
          </div>
          
        </td>
      </tr>
      <tr>
        <th>Lv</th>
        <td>
          <div><input type="number" class="w-40px" v-model="config.simulation.fixLv"           :disabled="!config.simulation.fix"> Lvまで育てたと仮定</div>
          <small>指定レベル以上のポケモンはそのままでシミュレーションします。</small>
        </td>
      </tr>
      <tr>
        <th>進化</th>
        <td>
          <div><label><input type="checkbox"            v-model="config.simulation.fixEvolve"       :disabled="!config.simulation.fix">最終進化にしたと仮定</label></div>
          <small>イーブイ等、複数の進化先がある場合は全ての進化先をシミュレーションします。</small>
        </td>
      </tr>
      <tr>
        <th>サブスキルの種</th>
        <td>
          <div><label><input type="checkbox"            v-model="config.simulation.fixSubSkillSeed" :disabled="!config.simulation.fix">最大まで与えたものとして仮定</label></div>
          <small>サブスキルの種を与えたと仮定</small>
        </td>
      </tr>
      <tr>
        <th>メインスキルの種</th>
        <td>
          <div><label><input type="checkbox"            v-model="config.simulation.fixSkillSeed" :disabled="!config.simulation.fix">最大まで与えたものとして仮定</label></div>
          <small>メインスキルの種を与えたと仮定</small>
        </td>
      </tr>
    </SettingTable>
  </SettingButton>

  <SettingButton title="厳選設定">
    <template #label>
      <div class="inline-flex-row-center">
        厳選設定:
        <template v-if="config.simulation.selectType == 0">パーセンタイル</template>
        <template v-if="config.simulation.selectType == 1">目標スコア比</template>
      </div>
    </template>

    <SettingTable>
      <tr>
        <th>厳選設定</th>
        <td>
          <select :value="config.simulation.selectType" @input="config.simulation.selectType = Number($event.target.value)">
            <option value="0">パーセンタイル</option>
            <option value="1">目標スコア比</option>
          </select>
        </td>
      </tr>
      <tr v-if="config.simulation.selectType == 1">
        <th>目標スコア</th>
        <td>
          <div><input type="number" class="w-80px" v-model="config.simulation.selectBorder" step="1"> %</div>
          <div class="w-300px">
            <small>
              例えば90%にすると、厳選度90%の個体に対しこの個体が稼ぐエナジーが何%あるか計算します。<br>
              パーセンタイルの場合上位80%の時点で理論値と大差なかったり逆にものすごく差がある可能性がありますが、目標スコア比で見るとこの問題が回避できます。
            </small>
          </div>
        </td>
      </tr>
    </SettingTable>
  </SettingButton>

  <SettingButton @click="Popup.show(CookingSettingPopup)" :important="disabledCookingNum > 0">
    <template #label>
      <div class="inline-flex-row-center">
        料理設定
        <template v-if="disabledCookingNum">(無効:{{ disabledCookingNum }}種)</template>
      </div>
    </template>
  </SettingButton>

  <SettingButton title="下振れ補正">
    <template #label>
      <div class="inline-flex-row-center">
        下振れ補正
      </div>
    </template>
    
    <div>
      <BaseAlert class="mt-5px w-600px">
        1%で当たるものを100回試行した時の期待値は1%×100で1回ですが、1回以上当たる確率は63.4%程度しかありません。<br>
        つまり、下振れして1回も当たらない確率が36.6%あるということです。<br>
        試行回数がもっと多ければ期待値に収束していきますが、ポケスリでは基本的に試行回数が少ないため下振れすることも多いです。<br>
        そのために、「XX%の確率で少なくとも1日n回は当たる」という方法で計算できるようにしたのが下振れ補正です。
      </BaseAlert>

    </div>
    <SettingTable>
      <tr>
        <th>下振れ補正ボーダー</th>
        <td>
          <div><input type="number" class="w-80px" v-model="config.simulation.expectType.border" step="1"> %</div>
        </td>
      </tr>
      <tr>
        <th>食材</th>
        <td>
          <div class="flex-row gap-10px">
            <InputRadio v-model="config.simulation.expectType.food" :value="0">通常期待値</InputRadio>
            <InputRadio v-model="config.simulation.expectType.food" :value="1">下振れ補正</InputRadio>
          </div>
        </td>
      </tr>
    </SettingTable>
  </SettingButton>

  <SettingButton title="その他設定">
    <template #label>
      <div class="inline-flex-row-center">
        その他設定
      </div>
    </template>

    <SettingTable>
      <tr>
        <th>なべの大きさ</th>
        <td>
          <div><input type="number" v-model="config.simulation.potSize" min="0"> 個</div>
        </td>
      </tr>
      <tr>
        <th>ナイトキャップピカチュウ</th>
        <td>
          <div>
            <input
              type="number" class="w-80px"
              v-model="config.teamSimulation.nightCapPikachu"
              min="0" :max="NightCapPikachu.list.length"
            >
            Lv
          </div>
          <small>
            0の場合はナイトキャップピカチュウなし
          </small>
        </td>
      </tr>
      <tr>
        <th>食材ゲット採用率</th>
        <td>
          <div><input type="number" class="w-80px" v-model="config.simulation.foodGetRate" step="1"> %</div>
          <small>
            食材の何%を<br>料理に使えるか
          </small>
        </td>
      </tr>
      <tr>
        <th>ゆめのかけら評価</th>
        <td>
          <div><input type="number" class="w-80px" v-model="config.simulation.shardWeight" step="1"> %</div>
          <small>
            0%:エナジーだけで評価<br>
            100%:ゆめのかけらで評価<br>
            50%:どっちもほどほど
          </small>
        </td>
      </tr>
      <tr>
        <th>リサーチランク</th>
        <td>
          <div><label><input type="checkbox" v-model="config.simulation.researchRankMax">カンスト</label></div>
          <small class="w-100px">リサボをゆめのかけらとして評価するか</small>
        </td>
      </tr>
      <tr>
        <th>睡眠時間</th>
        <td>
          <input class="w-50px" type="number" step="0.1" v-model="config.sleepTime"> 時間
          <DangerAlert class="mt-5px">睡眠時間を変更すると厳選情報の再計算が必要です</DangerAlert>
        </td>
      </tr>
      <tr>
        <th>チェック頻度</th>
        <td>
          <input class="w-50px" type="number" step="1" v-model="config.checkFreq"> 回
          <DangerAlert class="mt-5px">チェック頻度を変更すると厳選情報の再計算が必要です</DangerAlert>
        </td>
      </tr>
    </SettingTable>
  </SettingButton>
</template>

<style lang="scss" scoped>
.setting-button {
  img {
    width: 1.2em;
    height: 1.2em;
    line-height: 0;
    margin: 0;
  }
}
</style>