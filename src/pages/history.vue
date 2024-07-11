<script setup>

</script>

<template>
  <div class="page">

    <h2>更新履歴</h2>

    <h3>2024/07/11</h3>
    <ul>
      <li>料理のレシピを最新のものに更新(これに伴い食材の価値が変わったため要再計算)</li>
    </ul>

    <h3>2024/07/09</h3>
    <ul>
      <li>げんきの計算を最新版のものに修正</li>
      <li>指定レベル・最終進化を仮定してシミュレーションできる設定をボックスに追加</li>
    </ul>

    <h3>2024/07/06</h3>
    <ul>
      <li>週末準備用のシミュレーション機能を追加(まだベータ版です)</li>
    </ul>
    
    <h3>2024/07/05</h3>
    <ul>
      <li>チームシミュレーションの際、おてつだいサポート、おてつだいブーストで得られるきのみの評価にきのみ率ではなく食材率が使用されていた不具合を修正</li>
      <li>週間シミュレーションのスコアの表示を改善</li>
    </ul>
    
    <h3>2024/06/26</h3>
    <ul>
      <li>ボックス画面でチームシミュレーションの対象とするか、必須でいれるかの設定を追加</li>
    </ul>

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