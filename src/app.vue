<script setup>
import { useRoute, useRouter } from 'vue-router'
import config from './models/config';
import AsyncWatcherArea from './components/util/async-watcher-area.vue';
import EvaluateTable from './models/evaluate-table';
import HelpRate from './models/help-rate';

let browserSupportError = ref(null);
if(window.localStorage == null) browserSupportError.value = 'LocalStorageに対応していません。最新のブラウザを使用するか、ブラウザの設定を確認してください。'

const requireRefresh = computed(() => {
  let result = {};
  if(!EvaluateTable.isEnableEvaluateTable(config)) {
    result.setting = true;
  }
  return result;
})

</script>

<template>
  <AsyncWatcherArea class="app" :asyncWatcher="asyncWatcher">

    <header>
      <h1>ポケスリシミュ</h1>
      <router-link to="/">ボックス</router-link>
      <router-link to="/data/pokemon">データ</router-link>
      <router-link to="/setting">厳選情報生成<div class="caution" v-if="requireRefresh.setting">!</div></router-link>
      <router-link to="/evaluate-table">厳選情報確認</router-link>
      <!-- <router-link to="/cache" v-if="config.initSetting">その他<div class="caution" v-if="requireRefresh.cache">!</div></router-link> -->
      <router-link to="/faq">FAQ</router-link>
      <router-link to="/history">更新履歴</router-link>
    </header>
    <main>
      <template v-if="browserSupportError == null">
        <router-view />
      </template>
      <template v-else>
        {{ browserSupportError }}
      </template>
    </main>

    <popup-area />
  </AsyncWatcherArea>
</template>

<style lang="scss" scoped>
.app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  header {
    display: flex;
    justify-content: start;
    align-items: center;

    background-color: rgb(49, 50, 58);
    color: #FFF;

    h1 {
      margin-right: 1em;
      padding: 10px;
    }

    a {
      align-self: stretch;
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 0 10px;
      color: #FFF;
      font-weight: bold;
      text-decoration: none;

      &:hover, &.router-link-active {
        background: #FFF2;
      }

      .caution {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20px;
        height: 20px;
        border: 2px #FFF solid;
        border-radius: 50%;
        background-color: red;
        color: #FFF;
      }
    }
  }

  main {
    position: relative;
    flex: 1 1 0;
    padding: 10px;
    z-index: 1;
  }
}
</style>
