<script setup>
import { useRoute, useRouter } from 'vue-router'
import config from './models/config';
import AsyncWatcherArea from './components/util/async-watcher-area.vue';
import EvaluateTable from './models/evaluate-table';
import HelpRate from './models/help-rate';
import Version from './models/version';

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
      <router-link to="/history">更新履歴<div class="caution" v-if="config.version.history < Version.HISTORY">!</div></router-link>

      <a href="https://github.com/reimer0204/pokesle-simulator" target="_blank">
        <svg width="30" height="30" viewBox="0 0 24 24"><path d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z" fill="#FFF"></path></svg>
      </a>
      <a href="https://discord.gg/swvZDT4RGp" target="_blank">
        <svg width="30" height="30" viewBox="0 -28.5 256 256"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z" fill="#ffffff" fill-rule="nonzero"> </path> </g> </g></svg>
      </a>
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
