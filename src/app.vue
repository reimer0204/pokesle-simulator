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
      <h1>ポケシミュ</h1>
      <router-link to="/">ボックス</router-link>
      <!-- <router-link to="/cooking">料理</router-link> -->
      <!-- <router-link to="/food">食材</router-link> -->
      <router-link to="/setting">設定</router-link>
      <router-link to="/cache">その他</router-link>
      <router-link to="/faq">FAQ</router-link>
    </header>
    <main>
      <router-view />
    </main>
    <footer>

    </footer>

    <popup-area />

    <div v-if="asyncWatcher.executing" class="progress">
      <div class="name" v-if="asyncWatcher.name">{{ asyncWatcher.name }}</div>
      <div class="progress-bar">
        <div class="progress-bar-white" :style="{
          width: `${asyncWatcher.progress * 100}%`
        }">
        </div>
      </div>
    </div>
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
