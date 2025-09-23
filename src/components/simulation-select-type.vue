<script setup>
import config from '../models/config';
</script>

<template>
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

.caution {
  color: yellow;
}
</style>