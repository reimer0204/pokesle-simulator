<script setup>

</script>

<template>
  <div class="page">

    <h2>使い方関連</h2>

    <h3>基本的な使い方を教えて</h3>
    <p>
      まずスプレッドシート等で所持ポケモンを管理していた方は、ボックス右下のTSVインポート機能でポケモン一覧をインポートしてください。<br>
      そうでない方は、ボックス左下の新規登録から登録してください。PCならローマ字のままキーボードで打ち込んでいくだけで入力が可能です。<br>
      登録すると、そのポケモンがどの程度厳選されているか、どの5匹でチームを組むと最もエナジーが稼げるかがシミュレーションできます（日替わりでメンバーを入れ替える運用のシミュレーションはまだ未対応です）<br>
      <br>
      解説動画を撮ったので、もし動画の方が聞きやすい方はこちらでどうぞ。<br>
      <a href="https://www.youtube.com/live/wj_QK7zlsG0" target="_blank">https://www.youtube.com/live/wj_QK7zlsG0</a>
    </p>

    <h3>ポケモン一覧で2条件以上でソートしたい</h3>
    <p>
      シフト押しながらクリックすると2条件でソートできます。
    </p>

    <h3>不具合見つけたんだけど</h3>
    <p>
      <a href="https://x.com/harezora_lueur" target="_blank">@harezora_lueur</a>とか<a href="https://github.com/reimer0204/pokesle-simulator" target="_blank">GitHub</a>とかに連絡ください。
    </p>

    <h2>仕様関連</h2>


    <h3>入れ替えとか削除でいちいち再計算入るのどうにかならない？</h3>
    <p>
      どうにかしたいとは思っています。
    </p>

    <h3>厳選評価の仕組みは？</h3>
    <p>
      最終進化のポケモンについて全サブスキル・全せいかくの組み合わせにおける1日のエナジー期待値を計算し、その順位を基準に評価しています。<br>
      まずは下記の通常スキルを持ったポケモンを計算し、それぞれの厳選度上位(デフォルト90%)の期待値エナジーを集計し、その上位50%を元にサポート系スキルを持ったポケモンの評価をします。
      <br>
      きのみ：カビゴンの好きなきのみ前提<br>
      食材：設定により基礎エナジ～最良の料理×最大レシピレベル<br>
      通常スキル<br>
      ・エナジーチャージ：そのまま<br>
      ・食材ゲット：上記食材と同等の評価<br>
      ・料理パワーアップ：(最良の料理 - 通常のなべで作れる最良の料理) / 鍋サイズの差分 ×効果量<br>
      ・料理チャンス：1週間編成し続け、最良の料理×最大レシピレベルを作り続けた際の増分を7日で割った値<br>
      サポート系スキル<br>
      ・おてつだいサポート/おてつだいブースト：上位50％の平均お手伝いエナジー×効果量<br>
      ・げんきエール/げんきオール：(げんき回復あり - げんき回復なし)×上位50％の平均日給エナジー<br>
      ・ゆめのかけらゲット：効果量×設定のゆめのかけらゲット評価値<br>
      <br>
      ※ゆめのかけらゲットはサポート系スキルではありませんが、エナジー換算する時にぶっ飛んだ数字になってサポート対象に含むと値が変になるので後回し組に含めています。
    </p>

    <h3>げんき回復量0でも日中の効率175%くらいでおてつだいしてるっぽいんだけど？</h3>
    <p>
      8.5時間睡眠している場合、200分間はお手伝い時間45%、次の200分間は…と素直に計算すると168%くらいになるんですが、例えば最初の199分時点でおてつだいが発生して次のお手伝い時間が決まった場合は実質200分より長く最高効率で動けることになるので、その分168%より少し長くなってます。<br>
      おてつだいキューの詳細が分からないのでこの挙動が正しいかは不明です。もしかしたらまたぐ時は両方の値を参照するのが本当は正しいかもしれません。
    </p>

    <h3>ラルトスの進化先に問答無用でエルレイドが表示されるんだけど</h3>
    <p>
      それだけのために性別の入力欄作るの面倒だったので許してください。
    </p>

    <h3>今後予定している機能は？</h3>
    <p>
      ・日曜に食材等の準備をするパターンのシミュレーション<br>
      ・料理ごとのレシピレベル設定(今は一律最大値固定)<br>
      ・指定レベル/最終進化になった仮定でシミュレーションして誰を育成すべきか判断できるやつ<br>
      ・任意のポケモンをチーム編成に固定する機能
    </p>


    <h2>技術関連</h2>

    <h3>もっと処理速くならない？</h3>
    <p>
      <a href="https://github.com/reimer0204/pokesle-simulator" target="_blank">GitHub</a>でソースコード公開してるので助けてください。プルリク歓迎です。
    </p>

    <h3>なんでIndexedDB使わないでLocalStorage使ってるの？</h3>
    <p>
      容量的になんとか足りたので…どっちがいいんだろうね？
    </p>

    <h3>要望出したいんだけど</h3>
    <p>
      <a href="https://x.com/harezora_lueur" target="_blank">@harezora_lueur</a>とか<a href="https://github.com/reimer0204/pokesle-simulator" target="_blank">GitHub</a>とかに連絡ください。自分も欲しい機能なら作ります。
    </p>

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