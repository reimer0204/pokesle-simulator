<script setup>
import config from '../models/config';
import PokemonBox from '../models/pokemon-box/pokemon-box';
import PopupBase from './util/popup-base.vue';

const $emit = defineEmits(['close']);

function exportSpreadsheet() {
  PokemonBox.exportGoogleSpreadsheet();
}

async function importSpreadsheet() {
  asyncWatcher.run(async () => {
    if(await PokemonBox.importGoogleSpreadsheet()) {
      $emit('close', true)
    }
  })
}

function copyUrl() {
  navigator.clipboard.writeText(config.pokemonBox.gs.url);
}

</script>

<template>
  <PopupBase @close="$emit('close')" class="google-spreadsheet-popup">
    <template #headerText>Googleスプレッドシート連携</template>

    <main>
      <h2>初期設定の手順</h2>
      <ol>
        <li>適当なGoogleスプレッドシートを用意する</li>
        <li>
          拡張機能＞Apps Scriptを開き、サンプルプログラムを消して下記プログラムをペーストする
          <code>{{ `
const doPost = (e) => {
  const { sheet, pokemonList } = JSON.parse(e.parameter.json);
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheet).clear().getRange(1, 1, pokemonList.length, pokemonList[0].length).setValues(pokemonList);
  return ContentService.createTextOutput('true').setMimeType(ContentService.MimeType.JSON)
}

const doGet = (e) => {
  return ContentService.createTextOutput(JSON.stringify(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(e.parameter.sheet).getDataRange().getValues())).setMimeType(ContentService.MimeType.JSON)
}
`.trim() }}</code>
        </li>
        <li>デプロイボタンを押し、種類に「ウェブアプリ」、アクセスできるユーザーに「全員」を選んでデプロイする</li>
        <li>表示されたウェブアプリのURLと、やり取りに使用するシート名を下記に入力</li>
      </ol>

      <div class="flex-row-start-center gap-5px">
        <input class="flex-110" type="password" v-model="config.pokemonBox.gs.url" placeholder="ウェブアプリのURLを入力">
        <button @click="copyUrl">コピー</button>
      </div>
      <input type="text" v-model="config.pokemonBox.gs.sheet" placeholder="連携用シート名">
      <small>エクスポート時に一度シートの内容はクリアされるので、連携用のまっさらなシートを用意してください。</small>

      <label><input type="checkbox" v-model="config.pokemonBox.gs.autoExport">ポケモンの情報を編集する度にエクスポートする</label>

      <button @click="exportSpreadsheet">エクスポート</button>
      <button @click="importSpreadsheet" class="mt-50px">インポート</button>
    </main> 
  </PopupBase>
</template>

<style lang="scss" scoped>
.popup-base.google-spreadsheet-popup {
  width: 700px;

  main {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  code {
    display: block;
    background-color: #EEE;
    padding: 0.5em 1em;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .setting-list {
    input {
      width: 60px;
    }
  }

  textarea {
    height: 500px;
  }

  .vr {
    width: 1px;
    background-color: #888;
  }
}
</style>