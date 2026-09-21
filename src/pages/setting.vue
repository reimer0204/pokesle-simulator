<script setup>
import config from '../models/config.ts';
import EvaluateTable from '../models/simulation/evaluate-table.ts';
import EvaluateSetting from '@/components/evaluate-setting.vue';

const editConfig = reactive(config.clone());
const result = ref(null);

async function save() {
  asyncWatcher.run(async (progressCounter) => {
    const isNew = !editConfig.initSetting;
    await EvaluateTable.simulation(editConfig, progressCounter);
    editConfig.initSetting = true;
    editConfig.version.evaluateTable = EvaluateTable.VERSION;
    editConfig.version.evaluateTableSleepTime = editConfig.sleepTime;
    editConfig.version.evaluateTableCheckFreq = editConfig.checkFreq;
    config.save(editConfig);
    result.value = { isNew };
  });
}
</script>

<template>
  <div class="page">
    <DangerAlert v-if="config.version.evaluateTable != EvaluateTable.VERSION">初めての利用、もしくはシステムがアップデートされたため厳選テーブルがクリアされました。</DangerAlert>
    <DangerAlert v-else-if="!EvaluateTable.isEnableEvaluateTable(config)">睡眠時間、チェック回数が変更されたため厳選テーブルがクリアされました。</DangerAlert>

    <BaseAlert>
      一部を除く全ポケモンの厳選テーブルを計算するページです。<br>
      計算しておくと、ボックス画面などで厳選度が表示されるようになります。<br>
      ※ダークライやミュウは食材の組合せが512通りあり計算量が多いため対象外です。これらの特別なポケモンは簡易診断で見てください。
    </BaseAlert>

    <EvaluateSetting :setting-config="editConfig" :evaluate-config="editConfig.selectEvaluate" />

    <BaseAlert v-if="result">厳選情報の計算が完了しました。ボックス画面から厳選情報を確認できます。</BaseAlert>
    <FormButton class="execute" @click="save">設定を保存して厳選情報を計算する</FormButton>
  </div>
</template>

<style lang="scss" scoped>
.page {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 10px;
  max-width: 1200px;
  margin-right: auto;
}
</style>
