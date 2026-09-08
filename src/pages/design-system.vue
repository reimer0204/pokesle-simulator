<script setup lang="ts">
import BaseAlert from '../components/alert/base-alert.vue';
import DangerAlert from '../components/alert/danger-alert.vue';
import DesignTable from '../components/design-table.vue';
import SettingButton from '../components/design/setting-button.vue';
import SettingTable from '../components/design/setting-table.vue';
import ToggleArea from '../components/design/toggle-area.vue';
import InputCheckbox from '../components/form/input-checkbox.vue';
import InputNumber from '../components/form/input-number.vue';
import InputRadio from '../components/form/input-radio.vue';
import HelpButton from '../components/help/help-button.vue';
import CandyIcon from '../components/icon/candy-icon.vue';
import StarIcon from '../components/icon/star-icon.vue';
import SubSkillLabel from '../components/status/sub-skill-label.vue';
import SortableTable from '../components/sortable-table.vue';
import TabList from '../components/tab-list.vue';
import SettingList from '../components/util/setting-list.vue';
import PopupBase from '../components/util/popup-base.vue';
import AsyncWatcherArea from '../components/util/async-watcher-area.vue';
import SubSkill from '../data/sub-skill';

const checkbox = ref(true);
const selectedMode = ref('normal');
const number = ref(25);
const nativeSelect = ref('standard');
const demoWatcher = reactive({ executing: true, name: '処理中の表示例', progress: 0.65 });

const componentCatalog = [
  ['フォーム', 'form/input-checkbox.vue', 'InputCheckbox', 'カスタムチェックボックス（通常・無効・読み取り専用）'],
  ['フォーム', 'form/input-radio.vue', 'InputRadio', 'カスタムラジオボタン'],
  ['フォーム', 'form/input-number.vue', 'InputNumber', '数値・割合入力'],
  ['通知', 'alert/base-alert.vue', 'BaseAlert', '情報通知'],
  ['通知', 'alert/danger-alert.vue', 'DangerAlert', '注意・再計算通知'],
  ['設定', 'design/setting-button.vue', 'SettingButton', 'ポップアップを開く設定ボタン'],
  ['設定', 'design/setting-button-popup.vue', 'SettingButtonPopup', '設定ボタン用ポップアップの外枠'],
  ['設定', 'design/setting-table.vue', 'SettingTable', 'ラベルと値の簡易テーブル'],
  ['設定', 'design/toggle-area.vue', 'ToggleArea', '折りたたみ領域'],
  ['一覧', 'design-table.vue', 'DesignTable', '設定・一覧向けテーブル'],
  ['一覧', 'sortable-table.vue', 'SortableTable', 'ソート・固定列・ページ送り対応テーブル'],
  ['一覧', 'tab-list.vue', 'TabList', 'ページ内タブ'],
  ['一覧', 'util/setting-list.vue', 'SettingList', '設定項目の並び'],
  ['ポップアップ', 'util/popup-base.vue', 'PopupBase', '共通ヘッダー・閉じる操作を持つポップアップ'],
  ['ポップアップ', 'table-popup.vue', 'TablePopup', '表を表示するポップアップ'],
  ['ポップアップ', 'pokemon-edit-popup.vue', 'PokemonEditPopup', 'ポケモン編集フロー'],
  ['ポップアップ', 'cooking-setting-popup.vue', 'CookingSettingPopup', '料理設定フロー'],
  ['ポップアップ', 'detail-setting-popup.vue', 'DetailSettingPopup', '詳細設定フロー'],
  ['ポップアップ', 'evaluate-table-detail-popup.vue', 'EvaluateTableDetailPopup', '評価詳細フロー'],
  ['ポップアップ', 'google-spreadsheet-popup.vue', 'GoogleSpreadsheetPopup', 'スプレッドシート連携フロー'],
  ['ポップアップ', 'pokemon-box-tsv-popup.vue', 'PokemonBoxTsvPopup', 'TSV入出力フロー'],
  ['ポップアップ', 'resource-edit-popup.vue', 'ResourceEditPopup', '資源編集フロー'],
  ['ヘルプ', 'help/help-button.vue', 'HelpButton', 'ヘルプ起動アイコン'],
  ['ヘルプ', 'help/help-popup.vue', 'HelpPopup', 'Markdown説明ポップアップ'],
  ['状態表示', 'status/name-label.vue', 'NameLabel', '名前・色違い・メモ表示'],
  ['状態表示', 'status/lv-label.vue', 'LvLabel', 'レベル変化表示'],
  ['状態表示', 'status/skill-lv-label.vue', 'SkillLvLabel', 'スキルレベル変化表示'],
  ['状態表示', 'status/sub-skill-label.vue', 'SubSkillLabel', 'レアリティ別サブスキルラベル'],
  ['状態表示', 'status/sub-skill-label-list.vue', 'SubSkillLabelList', 'サブスキルラベル群'],
  ['状態表示', 'status/nature-info.vue', 'NatureInfo', '性格の上昇・下降表示'],
  ['状態表示', 'status/food-list.vue', 'FoodList', '食材アイコンと個数表示'],
  ['アイコン', 'icon/star-icon.vue', 'StarIcon', '星アイコン'],
  ['アイコン', 'icon/candy-icon.vue', 'CandyIcon', 'アメアイコン'],
  ['補助UI', 'util/async-watcher-area.vue', 'AsyncWatcherArea', '進捗オーバーレイ'],
  ['補助UI', 'filter/pokemon-filter-editor.vue', 'PokemonFilterEditor', '除外フィルタ編集'],
  ['補助UI', 'simulation-select-type.vue', 'SimulationSelectType', '厳選条件の選択'],
  ['補助UI', 'common-setting.vue', 'CommonSetting', '共通シミュレーション設定'],
  ['補助UI', 'history/history-item.vue', 'HistoryItem', '更新履歴カード'],
  ['補助UI', 'page-assist/index/evaluate-result.vue', 'EvaluateResult', '個体評価結果と詳細リンク'],
];

const tableRows = [
  { name: '標準表示', value: 1_250, rate: 0.82 },
  { name: '強調表示', value: 2_480, rate: 0.96 },
  { name: '無効表示', value: 0, rate: 0 },
];
const tableColumns = [
  { key: 'name', name: '名称', type: String },
  { key: 'value', name: '数値', type: Number },
  { key: 'rate', name: '割合', percent: true },
];
</script>

<template>
  <div class="page design-system-page">
    <div class="page-header">
      <div>
        <h1>デザインシステム</h1>
        <p>このアプリのソースコードで使用されているUIを、現状の見た目のまま一覧化しています。</p>
      </div>
      <a class="link" href="https://github.com/reimer0204/pokesle-simulator/tree/master/src/components" target="_blank">components を見る</a>
    </div>

    <section>
      <h2>ネイティブコントロール</h2>
      <p class="source">実装元: <code>src/style.scss</code></p>
      <div class="showcase-row">
        <button>標準ボタン</button>
        <button class="important">重要操作</button>
        <button disabled>無効</button>
        <a class="link" href="#">テキストリンク</a>
        <span class="caution">!</span>
      </div>
      <div class="showcase-row">
        <input type="text" value="テキスト入力" aria-label="テキスト入力例" />
        <input type="number" value="10" aria-label="数値入力例" />
        <select v-model="nativeSelect" aria-label="選択例"><option value="standard">選択肢</option><option value="other">別の選択肢</option></select>
        <label class="file-input">画像ファイル <input type="file" accept="image/*" /></label>
      </div>
      <p class="native-note">数値・テキスト・選択・ファイル入力と標準ボタンは、画面・設定部品に直接配置されている既存パターンです。チェック状態の入力はすべて <code>InputCheckbox</code> を使用します。</p>
      <div class="catalog-scroll">
        <DesignTable class="native-catalog">
          <thead><tr><th>要素</th><th>見た目・用途</th><th>主な使用箇所</th></tr></thead>
          <tbody>
            <tr><td><code>input[type=number]</code></td><td>枠線と角丸を持つ数値入力。単位・最小値・最大値・無効状態と組み合わせて使用。</td><td><code>components/common-setting.vue</code>、各設定・シミュレーション画面</td></tr>
            <tr><td><code>input[type=text]</code></td><td>枠線と角丸を持つテキスト入力。検索語、名前、メモ、連携名に使用。</td><td><code>pages/index.vue</code>、<code>components/pokemon-edit-popup.vue</code>、<code>components/google-spreadsheet-popup.vue</code></td></tr>
            <tr><td><code>select</code></td><td>ブラウザ標準の選択リスト。フィールド・料理種別などを選択。</td><td><code>components/common-setting.vue</code>、<code>components/filter/pokemon-filter-editor.vue</code></td></tr>
            <tr><td><code>input[type=file]</code></td><td>ブラウザ標準のファイル選択。画像インポートに使用。</td><td><code>pages/simulation.vue</code>、<code>pages/screenshot-import.vue</code></td></tr>
            <tr><td><code>button</code></td><td>青の標準ボタン、橙の重要ボタン、無効状態。</td><td><code>src/style.scss</code>、全ページ・ポップアップ</td></tr>
          </tbody>
        </DesignTable>
      </div>
    </section>

    <section>
      <h2>フォームコントロール</h2>
      <p class="source">実装元: <code>components/form/</code>。各コンポーネントを個別に記載しています。</p>
      <div class="showcase-row controls">
        <div class="component-sample">
          <code>form/input-checkbox.vue · InputCheckbox</code>
          <div class="showcase-row"><InputCheckbox v-model="checkbox">選択済み</InputCheckbox><InputCheckbox :modelValue="false">未選択</InputCheckbox><InputCheckbox :modelValue="false" disabled>無効</InputCheckbox></div>
        </div>
        <div class="component-sample">
          <code>form/input-radio.vue · InputRadio</code>
          <div class="showcase-row"><InputRadio v-model="selectedMode" value="normal">通常</InputRadio><InputRadio v-model="selectedMode" value="detail">詳細</InputRadio></div>
        </div>
        <div class="component-sample">
          <code>form/input-number.vue · InputNumber</code>
          <div class="showcase-row"><label class="inline-field">数値 <InputNumber v-model="number" class="w-60px" /></label><label class="inline-field">割合 <InputNumber :modelValue="0.125" percent class="w-60px" /></label></div>
        </div>
      </div>
    </section>

    <section>
      <h2>設定・ナビゲーション</h2>
      <p class="source">実装元: <code>components/design/</code>、<code>components/tab-list.vue</code>、<code>components/util/setting-list.vue</code></p>
      <div class="showcase-row">
        <SettingButton title="設定サンプル">
          <template #label>設定を開く</template>
          <p>設定ボタンから開くポップアップの本文例です。</p>
        </SettingButton>
        <SettingButton title="重要な設定" important><template #label>重要な設定</template></SettingButton>
        <HelpButton title="ヘルプの例" markdown="各画面で補足説明を表示するためのヘルプアイコンです。" />
      </div>
      <TabList class="demo-tabs">
        <a class="active">選択中のタブ</a>
        <a>通常タブ</a>
        <a>長い名称のタブ</a>
      </TabList>
      <SettingList class="mt-10px">
        <div><label>設定項目</label><InputCheckbox v-model="checkbox">有効にする</InputCheckbox></div>
        <div><label>数値設定</label><InputNumber v-model="number" /></div>
        <div><label>説明付き項目</label><small>ラベルはグレーの太字で表示されます。</small></div>
      </SettingList>
    </section>

    <section>
      <h2>折りたたみ・通知</h2>
      <p class="source">実装元: <code>components/design/toggle-area.vue</code>、<code>components/alert/</code></p>
      <ToggleArea open>
        <template #headerText>開いている折りたたみ領域</template>
        クリックで内容の開閉を切り替えられます。設定画面や詳細情報で利用されています。
      </ToggleArea>
      <div class="alerts">
        <BaseAlert>情報・補足の通知</BaseAlert>
        <DangerAlert>再計算や注意を促す通知</DangerAlert>
      </div>
    </section>

    <section>
      <h2>テーブル</h2>
      <p class="source">実装元: <code>components/design-table.vue</code>、<code>components/sortable-table.vue</code></p>
      <div class="table-grid">
        <div>
          <h3>設定用テーブル</h3>
          <DesignTable>
            <thead><tr><th>項目</th><th>値</th></tr></thead>
            <tbody><tr><td>基準</td><td>標準</td></tr><tr><td>補正</td><td>あり</td></tr></tbody>
          </DesignTable>
        </div>
        <div class="sortable-example">
          <h3>ソート可能テーブル</h3>
          <SortableTable :dataList="tableRows" :columnList="tableColumns" scroll />
        </div>
      </div>
      <SettingTable class="mt-10px">
        <tbody><tr><th>設定テーブル</th><td>ラベルを左寄せ・淡色で表示する簡易テーブル</td></tr></tbody>
      </SettingTable>
    </section>

    <section>
      <h2>ポップアップ・進捗表示</h2>
      <p class="source">実装元: <code>components/util/popup-base.vue</code>、<code>components/util/async-watcher-area.vue</code></p>
      <div class="overlay-samples">
        <PopupBase class="popup-sample"><template #headerText>共通ポップアップ</template>ヘッダー、閉じる操作、本文余白を共通化する外枠です。</PopupBase>
        <AsyncWatcherArea class="progress-sample" :asyncWatcher="demoWatcher"><div>背後のコンテンツ</div></AsyncWatcherArea>
      </div>
    </section>

    <section>
      <h2>状態表示・アイコン</h2>
      <p class="source">実装元: <code>components/status/</code>、<code>components/icon/</code></p>
      <div class="showcase-row status-samples">
        <SubSkillLabel :subSkill="SubSkill.list.find(x => x.rarity === 1)!" />
        <SubSkillLabel :subSkill="SubSkill.list.find(x => x.rarity === 2)!" />
        <SubSkillLabel :subSkill="SubSkill.list.find(x => x.rarity === 3)!" silverSeed />
        <SubSkillLabel :subSkill="SubSkill.list[0]" short fix />
        <span class="shiny-label">色違いポケモン ★</span>
        <span class="nature-sample">がんばりや <small><b>EXP↑</b><em>げんき↓</em></small></span>
        <StarIcon class="star" />
        <CandyIcon class="candy" />
      </div>
    </section>

    <section>
      <h2>コンポーネント台帳</h2>
      <p class="source">対象: <code>src/components/</code> 配下の全39コンポーネント。上記の見本で確認できないドメイン依存コンポーネントも含め、役割と実装元を記録しています。</p>
      <div class="catalog-scroll">
        <DesignTable class="catalog-table">
          <thead><tr><th>分類</th><th>コンポーネント</th><th>実装元</th><th>役割</th></tr></thead>
          <tbody><tr v-for="[category, path, name, purpose] in componentCatalog" :key="path"><td>{{ category }}</td><td><b>{{ name }}</b></td><td><code>src/components/{{ path }}</code></td><td>{{ purpose }}</td></tr></tbody>
        </DesignTable>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.design-system-page {
  height: 100%;
  overflow: auto;
  padding-right: 8px;
}

.page-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 15px;

  h1 { font-size: 22px; margin-bottom: 5px; }
  p { color: #666; }
}

section {
  border-top: 1px #DDD solid;
  padding: 15px 0;

  h2 { font-size: 18px; margin-bottom: 3px; }
  h3 { font-size: 14px; margin-bottom: 6px; }
}

.source { color: #777; font-size: 11px; margin-bottom: 10px; }
code { background: #F3F3F3; border-radius: 3px; padding: 1px 3px; }
.showcase-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 15px; margin: 8px 0; }
.native-note { color: #666; margin: 10px 0; }.file-input { display: inline-flex; align-items: center; gap: 5px; }
.native-catalog { min-width: 760px; }.native-catalog td { vertical-align: top; }
.controls { gap: 10px 20px; }
.component-sample { padding: 8px; border: 1px #DDD solid; border-radius: 5px; background: #FAFAFA; }
.inline-field { display: inline-flex; align-items: center; gap: 5px; }
.caution { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border: 2px #FFF solid; border-radius: 50%; background: red; color: #FFF; font-weight: bold; }
.demo-tabs { max-width: 600px; }
.alerts { display: grid; grid-template-columns: repeat(2, minmax(0, 360px)); gap: 10px; margin-top: 10px; }
.table-grid { display: grid; grid-template-columns: max-content minmax(300px, 550px); gap: 20px; align-items: start; }
.overlay-samples { display: flex; flex-wrap: wrap; align-items: start; gap: 15px; }
.popup-sample { width: 320px; }.progress-sample { width: 320px; height: 110px; border: 1px #DDD solid; padding: 12px; }
.catalog-scroll { max-width: 100%; overflow: auto; }.catalog-table { min-width: 720px; }.catalog-table td { vertical-align: top; }
.sortable-example { height: 160px; display: flex; flex-direction: column; }
.sortable-example :deep(.sortable-table) { flex: 1 1 0; min-height: 0; }
.status-samples { gap: 12px; }
.shiny-label { color: #E52; font-weight: bold; }
.nature-sample { display: inline-flex; align-items: center; gap: 2px; }
.nature-sample small { display: flex; flex-direction: column; font-size: 65%; line-height: 1.1; }
.nature-sample b { color: red; }.nature-sample em { color: blue; font-style: normal; font-weight: bold; }
.star { width: 22px; color: #F7B500; }.candy { width: 22px; color: #6C4; }

@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .page-header { align-items: start; }.page-header > .link { white-space: nowrap; }
  .alerts, .table-grid { grid-template-columns: minmax(0, 1fr); }
  .sortable-example { max-width: 100%; }
}
</style>
