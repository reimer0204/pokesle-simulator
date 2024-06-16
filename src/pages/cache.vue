<script setup>
import { computed } from 'vue';
import config from '../models/config';
import GenkiSimulator from '../worker/genki-simulator';
import ProgressCounter from '../models/progress-counter';
import HelpRate from '../models/help-rate';
import EvaluateTable from '../models/evaluate-table';
import SettingList from '../components/setting-list.vue'

let editConfig = reactive(config.clone());
let progressCounter = reactive(new ProgressCounter());

function refreshEvaluateTable() {
  asyncWatcher.run(async (progressCounter) => {
    await EvaluateTable.simulation(config, progressCounter);
  })
}

</script>

<template>
  <div class="page">
    <button @click="refreshEvaluateTable">厳選基準計算</button>
    ポケモンの追加や性能が変わって厳選テーブルが使えなくなった時に再計算するためのボタンです。初期設定時と同じように時間がかかるので注意してください。
  </div>
</template>

<style lang="scss" scoped>
.page {
  .list {
    display: grid;
    grid-template-columns: max-content 1fr;
  }

  .group {
    border: 1px #888 solid;
    border-radius: 10px;
    padding: 10px;
  }
}
</style>