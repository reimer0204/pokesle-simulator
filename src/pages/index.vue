<script setup>
import config from '../models/config.js';
import Field from '../data/field.js';
import Berry from '../data/berry.js';
import SettingList from '../components/setting-list.vue';
import PokemonList from '../components/pokemon-list.vue';

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
        </div>
      </div>


      <div>
        <label>フィールド<br>ボーナス</label>
        <div>
          <input type="number" class="w-80px" v-model="config.simulation.fieldBonus" step="5">
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
        <label>なべの大きさ</label>
        <div>
          <div><input type="number" v-model="config.simulation.potSize" min="0"> 個</div>
        </div>
      </div>

      <div>
        <label>ゆめのかけら評価</label>
        <div>
          <div><input type="number" class="w-80px" v-model="config.simulation.shardWeight" step="1"> %</div>
          <small>
            0%:エナジーだけで評価<br>
            100%:ゆめのかけらで評価<br>
            50%:どっちもほどほど
          </small>
        </div>
      </div>

      <div>
        <label>リサーチランク</label>
        <div>
          <label><input type="checkbox" v-model="config.simulation.researchRankMax">カンスト</label>
          <small class="w-100px">リサボをゆめのかけらとして評価するか</small>
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
        <label>食材ゲット採用率</label>
        <div>
          <div><input type="number" class="w-80px" v-model="config.simulation.foodGetRate" step="1"> %</div>
          <small>
            食材の何%を<br>料理に使えるか
          </small>
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
          <small>
            パーセンタイル:厳選度<br>
            目標スコア比:指定パーセンタイルの個体とのスコア比
          </small>
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