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
import FoodPreparePage from './pages/food_prepare.vue'
import BoxSummaryPage from './pages/box-summary.vue'
import BoxSummaryIndexPage from './pages/box-summary/index.vue'
import BoxSummaryPokemonPage from './pages/box-summary/pokemon.vue'
import BoxSummaryBerryPage from './pages/box-summary/berry.vue'
import BoxSummaryFoodPage from './pages/box-summary/food.vue'
import BoxSummarySkillPage from './pages/box-summary/skill.vue'
import DataPage from './pages/data.vue'
import DataFoodPage from './pages/data/food.vue'
import DataCookingPage from './pages/data/cooking.vue'
import DataPokemonPage from './pages/data/pokemon.vue'
import DataPokemonFoodPage from './pages/data/pokemon-food.vue'
import DataPokemonSkillPage from './pages/data/pokemon-skill.vue'
import SettingPage from './pages/setting.vue'
import FaqPage from './pages/faq.vue'
import HistoryPage from './pages/history.vue'
import CreditPage from './pages/credit.vue'
import EvaluateTable from './pages/evaluate-table.vue'
import PokemonBox from './models/pokemon-box/pokemon-box';
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: IndexPage },
    // { path: '/box-summary', component: BoxSummaryPage },
    { path: '/simulation', component: SimulationPage },
    { path: '/food-prepare', component: FoodPreparePage },
    { path: '/box-summary', component: BoxSummaryPage,
      children: [
        { path: '', component: BoxSummaryIndexPage },
        { path: 'pokemon', component: BoxSummaryPokemonPage },
        { path: 'berry', component: BoxSummaryBerryPage },
        { path: 'food', component: BoxSummaryFoodPage },
        { path: 'skill', component: BoxSummarySkillPage },
      ]
    },
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
    { path: '/credit', component: CreditPage },
    { path: '/evaluate-table', component: EvaluateTable },
  ]
});

import VueGtag from 'vue-gtag'
app.use(VueGtag, {
  config: {
    id: 'G-LXPDYB07H5'
  }
}, router)

app.use(router)

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    PokemonBox.importGoogleSpreadsheet(true)
  }
});

app.mount('#app');
