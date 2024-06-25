<script setup>
import config from '../models/config';
import EvaluateTable from '../models/evaluate-table';
import ProgressCounter from '../models/progress-counter';

function refreshEvaluateTable() {
  asyncWatcher.run(async (progressCounter) => {
    await EvaluateTable.simulation(config, progressCounter);
    config.version.evaluateTable = EvaluateTable.VERSION;
  })
}

</script>

<template>
  <div class="page">

    <ToggleArea open>
      <template #headerText>メンテナンス</template>

      <button @click="refreshEvaluateTable">厳選基準再計算</button>
      <div class="mt-5px">ポケモンの追加や性能が変わって厳選テーブルが使えなくなった時に再計算するためのボタンです。初期設定時と同じように時間がかかるので注意してください。</div>
      <DangerAlert class="mt-5px" v-if="config.version.evaluateTable != EvaluateTable.VERSION">
        ポケモン情報、もしくは厳選計算アルゴリズムが修正されています。時間のある時に再計算の実行をお願いします。
      </DangerAlert>
    </ToggleArea>

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