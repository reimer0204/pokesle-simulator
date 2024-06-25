<script setup>

</script>

<template>
  <div class="page">

    <h2>更新履歴</h2>

    <h3>2024/06/25</h3>
    <ul>
      <li>一部ポケモンのバランス調整を反映していなかったので修正</li>
      <li>データ更新があった場合、更新を促す表示を追加</li>
      <li>
        入力データの食材に不備があった場合にポケモン一覧がローディング状態となり修正もできなくなる問題を修正
        <ul>
          <li>他のところではまだエラー出るかも</li>
        </ul>
      </li>
      <li>入力データの食材に不備がある場合、ポケモン一覧で強調表示される機能を追加</li>
    </ul>

    <h3>2024/06/23</h3>
    <ul>
      <li>とりあえず公開</li>
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