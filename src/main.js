import { createApp } from 'vue'
import './style.scss'

import App from './app.vue';
const app = createApp(App);

import VueCookies from 'vue-cookies'
app.use(VueCookies, { expires: '30y' })

import Popup from './models/popup/popupper';
app.use(Popup);

Array.prototype.swap = function(a, b) {
  if (0 <= a && a < this.length && 0 <= b && b < this.length) {
    const aValue = this[a];
    this[a] = this[b];
    this[b] = aValue;
  }
  return this;
}

import { createWebHashHistory, createRouter } from 'vue-router'
import IndexPage from './pages/index.vue'
import SimulationPage from './pages/simulation.vue'
import DataPage from './pages/data.vue'
import DataFoodPage from './pages/data/food.vue'
import DataCookingPage from './pages/data/cooking.vue'
import DataPokemonPage from './pages/data/pokemon.vue'
import DataPokemonFoodPage from './pages/data/pokemon-food.vue'
import DataPokemonSkillPage from './pages/data/pokemon-skill.vue'
import SettingPage from './pages/setting.vue'
import FaqPage from './pages/faq.vue'
import HistoryPage from './pages/history.vue'
import EvaluateTable from './pages/evaluate-table.vue'
import PokemonBox from './models/pokemon-box/pokemon-box';
app.use(createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: IndexPage },
    { path: '/simulation', component: SimulationPage },
    { path: '/data', component: DataPage,
      children: [
        { path: 'food', component: DataFoodPage },
        { path: 'cooking', component: DataCookingPage },
        { path: 'pokemon', component: DataPokemonPage },
        { path: 'pokemon-food', component: DataPokemonFoodPage },
        { path: 'pokemon-skill', component: DataPokemonSkillPage },
      ]
    },
    { path: '/setting', component: SettingPage },
    { path: '/faq', component: FaqPage },
    { path: '/history', component: HistoryPage },
    { path: '/evaluate-table', component: EvaluateTable },
  ]
}))

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    PokemonBox.importGoogleSpreadsheet(true)
  }
});

app.mount('#app');
