<script setup>
import config from '../models/config.js';
import Field from '../data/field.js';
import Berry from '../data/berry.js';
import SettingList from '../components/util/setting-list.vue';
import PokemonList from '../components/pokemon-list.vue';
import DetailSettingPopup from '../components/detail-setting-popup.vue';
import Popup from '../models/popup/popup.js';
import CookingSettingPopup from '../components/cooking-setting-popup.vue';

</script>

<template>
  <div class="page">

    <h2>シミュレーション設定</h2>

    <SettingList>

      <div>
        <label>フィールド</label>
        <div class="flex-column-start-start gap-5px" style="width: 210px;">
          <select v-model="config.simulation.field">
            <option value="ワカクサ本島">ワカクサ本島</option>
            <option value="シアンの砂浜">シアンの砂浜</option>
            <option value="トープ洞窟">トープ洞窟</option>
            <option value="ウノハナ雪原">ウノハナ雪原</option>
            <option value="ラピスラズリ湖畔">ラピスラズリ湖畔</option>
          </select>

          <div v-if="config.simulation.field == 'ワカクサ本島'" class="flex-row-start-center gap-5px">
            <template v-for="i in 3">
              <select :value="config.simulation.berryList[i - 1]" @input="config.simulation.berryList[i - 1] = $event.target.value || null">
                <option value="">-</option>
                <option v-for="berry in Berry.list" :value="berry.name">{{ berry.name }}</option>
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
          
          <div class="flex-row-start-center gap-5px">
            <label>フィールドボーナス</label>
            <input type="number" class="w-80px" v-model="config.simulation.fieldBonus" step="5">
          </div>
        </div>
      </div>

      <div>
        <label>料理</label>
        <div>
          <select v-model="config.simulation.cookingType">
            <option value="カレー">カレー・シチュー</option>
            <option value="サラダ">サラダ</option>
            <option value="デザート">デザート・ドリンク</option>
          </select>

          <div class="flex-row-start-center gap-5px mt-5px">
            <label>倍率</label>
            <input type="number" class="w-80px" v-model="config.simulation.cookingWeight" step="0.1">
          </div>
        </div>
      </div>

      <div>
        <label>キャンチケ</label>
        <div>
          <label><input type="checkbox" v-model="config.simulation.campTicket">使う</label>
        </div>
      </div>

      <div>
        <label>イベントボーナス</label>
        <div class="flex-column-start-start gap-5px">
          <select :value="config.simulation.eventBonusType" @input="config.simulation.eventBonusType = $event.target.value || null">
            <option value="">-</option>
            <option value="all">全員</option>
            <option v-for="berry in Berry.list" :value="berry.type">{{ berry.type }}</option>
          </select>
          <div style="display: grid; grid-template-columns: max-content max-content max-content; align-items: center; gap: 0 5px;">
            <label>食材ボーナス</label>
            <label>スキル倍率</label>
            <label>スキルレベル</label>
            <input type="number" class="w-60px" v-model="config.simulation.eventBonusTypeFood" >
            <input type="number" class="w-60px" v-model="config.simulation.eventBonusTypeSkillRate" step="0.1" >
            <input type="number" class="w-60px" v-model="config.simulation.eventBonusTypeSkillLv" >
          </div>
        </div>
      </div>

      <div>
        <label>いつ育運用</label>
        <div>
          <label><input type="checkbox" v-model="config.simulation.bagOverOperation">する</label>
          <small class="w-80px">きのみタイプ/きのみの数S持ちのみ対象です</small>
        </div>
      </div>

      <div>
        <label>育成仮定設定</label>
        <div>
          <div class="flex-row-start-center gap-10px">
            <label><input type="checkbox" v-model="config.simulation.fix">仮定</label>
            <div><input type="number" class="w-40px" v-model="config.simulation.fixLv"           :disabled="!config.simulation.fix"> Lv</div>
          </div>
          <label><input type="checkbox"            v-model="config.simulation.fixEvolve"       :disabled="!config.simulation.fix">進化後</label>
          <label><input type="checkbox"            v-model="config.simulation.fixSubSkillSeed" :disabled="!config.simulation.fix">銀種</label>
          <label><input type="checkbox"            v-model="config.simulation.fixSkillSeed"    :disabled="!config.simulation.fix">金種</label>
          <div>厳選 <input type="number" class="w-40px" v-model="config.simulation.fixBorder"           :disabled="!config.simulation.fix"> %以上のみ</div>
        </div>
      </div>

      <div>
        <label>厳選設定</label>
        <div>
          <select :value="config.simulation.selectType" @input="config.simulation.selectType = Number($event.target.value)">
            <option value="0">パーセンタイル</option>
            <option value="1">目標スコア比</option>
          </select>
          <div v-if="config.simulation.selectType == 1">
            <input type="number" class="w-80px" v-model="config.simulation.selectBorder" step="1"> %
          </div>
          <small class="w-120px">
            パーセンタイル:厳選度<br>
            目標スコア比:指定パーセンタイルの個体とのスコア比
          </small>
        </div>
      </div>

      <div>
        <label>その他設定</label>
        <div class="flex-column gap-5px">
          <div><button @click="Popup.show(CookingSettingPopup)">料理設定</button></div>
          <div><button @click="Popup.show(DetailSettingPopup)">詳細設定</button></div>
        </div>
      </div>
      
    </SettingList>

    <PokemonList @update="load()"></PokemonList>

  </div>
</template>

<style lang="scss" scoped>

.page {
  display: flex;
  flex-direction: column;
  height: 100%;

  .pokemon-list {
    flex: 1 1 0;
  }
}

</style>