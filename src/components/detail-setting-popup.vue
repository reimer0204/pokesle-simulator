<script setup>
import config from '../models/config';
import PopupBase from './util/popup-base.vue';

</script>

<template>
  <PopupBase class="detail-setting-popup" @close="$emit('close')">
    <template #headerText>詳細設定</template>

    <SettingList>

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
    </SettingList>

  </PopupBase>
</template>

<style lang="scss" scoped>
.detail-setting-popup {
  width: 770px;
}
</style>