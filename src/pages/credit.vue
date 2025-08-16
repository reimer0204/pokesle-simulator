<script setup>
</script>

<template>
  <div class="page">

    <h2>参考資料</h2>

    <ul>
      <li>
        ポケモンスリープ攻略・検証Wiki (<a href="https://wikiwiki.jp/poke_sleep/" target="_blank">https://wikiwiki.jp/poke_sleep/</a>)
        <ul>
          <li>ポケスリの基本的な各種仕様、各種データを参考にしています。</li>
        </ul>
      </li>
      <li>
        RP Collection (<a href="https://docs.google.com/spreadsheets/d/1kBrPl0pdAO8gjOf_NrTgAPseFtqQA27fdfEbMBBeAhs" target="_blank">https://docs.google.com/spreadsheets/d/1kBrPl0pdAO8gjOf_NrTgAPseFtqQA27fdfEbMBBeAhs</a>)
        <ul>
          <li>各ポケモンの食材確率、スキル確率を参考にしています。</li>
        </ul>
      </li>
    </ul>

    <h2>クレジット</h2>

    <ul>
      <li>
        Contributors
        <ul>
          <li>Shiraponia (<a href="https://github.com/Shiraponia" target="_blank">https://github.com/Shiraponia</a>)</li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.page {
  padding: 20px;

  h2 {
    font-size: 24px;
    line-height: 1.4;
    margin-bottom: 0.5em;

    border-bottom: 2px #CCC solid;

    &:not(:first-of-type) {
      margin-top: 1em;
    }
  }
  h3 {
    font-size: 18px;
    line-height: 1.4;
    margin: 0.5em 0 0.25em 0;
    border-bottom: 2px #CCC solid;
  }
  p {
    padding: 5px 0;
  }
}
</style>