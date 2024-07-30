<script setup>
import Food from '../data/food';
import Nature from '../data/nature';
import Pokemon from '../data/pokemon';
import SubSkill from '../data/sub-skill';
import { AsyncWatcher } from '../models/async-watcher';
import config from '../models/config';
import EvaluateTable from '../models/evaluate-table';
import MultiWorker from '../models/multi-worker';
import PokemonBox from '../models/pokemon-box';
import convertRomaji from '../models/utils/convert-romaji';
import PokemonListSimulator from '../worker/pokemon-list-simulator?worker';
import AsyncWatcherArea from './util/async-watcher-area.vue';
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
        <label>食材ゲット採用率</label>
        <div>
          <div><input type="number" class="w-80px" v-model="config.simulation.foodGetRate" step="1"> %</div>
          <small>
            食材の何%を<br>料理に使えるか
          </small>
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