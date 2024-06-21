<script setup>
import { useRoute, useRouter } from 'vue-router'
import config from './models/config';
import AsyncWatcherArea from './components/async-watcher-area.vue';

const route = useRoute()
const router = useRouter()

watch(() => route.path, () => {
  if (!config.initSetting && route.path != '/setting') {
    router.replace('/setting')
  }
})

onMounted(() => {
  if (!config.initSetting) {
    router.replace('/setting')
  }
})

</script>

<template>
  <AsyncWatcherArea class="app" :asyncWatcher="asyncWatcher">
    <header>
      <h1>ポケスリシミュ</h1>
      <router-link to="/" v-if="config.initSetting">ボックス</router-link>
      <!-- <router-link to="/cooking">料理</router-link> -->
      <!-- <router-link to="/food">食材</router-link> -->
      <router-link to="/select-table">厳選テーブル</router-link>
      <router-link to="/setting">設定</router-link>
      <router-link to="/cache" v-if="config.initSetting">その他</router-link>
      <router-link to="/faq" v-if="config.initSetting">FAQ</router-link>
    </header>
    <main>
      <router-view />
    </main>
    <footer>

    </footer>

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
    padding: 10px;

    background-color: rgb(54, 73, 150);
    color: #FFF;

    h1 {
      margin-right: 1em;
    }

    a {
      display: block;
      padding: 0 10px;
      color: #FFF;
      font-weight: bold;
    }
  }

  main {
    flex: 1 1 0;
    padding: 10px;
  }
}
</style>
