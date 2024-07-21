import { createApp } from 'vue'
import './style.scss'

import App from './app.vue';
const app = createApp(App);

import VueCookies from 'vue-cookies'
app.use(VueCookies, { expires: '30y' })

import Popup from './models/popup/popupper';
app.use(Popup);

import { createWebHashHistory, createRouter } from 'vue-router'
import IndexPage from './pages/index.vue'
import DataPage from './pages/data.vue'
import SettingPage from './pages/setting.vue'
import FaqPage from './pages/faq.vue'
import HistoryPage from './pages/history.vue'
import PokemonBox from './models/pokemon-box';
app.use(createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: IndexPage },
    { path: '/data', component: DataPage },
    { path: '/setting', component: SettingPage },
    { path: '/faq', component: FaqPage },
    { path: '/history', component: HistoryPage },
  ]
}))

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    PokemonBox.importGoogleSpreadsheet(true)
  }
});

app.mount('#app');
