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
import FoodStockPage from './pages/food_stock.vue'
import BoxSummaryPage from './pages/box-summary.vue'
import BoxSummaryPokemonPage from './pages/box-summary/pokemon.vue'
import BoxSummaryBerryPage from './pages/box-summary/berry.vue'
import BoxSummaryFoodPage from './pages/box-summary/food.vue'
import BoxSummarySkillPage from './pages/box-summary/skill.vue'
import CheckListPage from './pages/check-list.vue'
import CheckListIndexPage from './pages/check-list/index.vue'
import CheckListPokemonPage from './pages/check-list/pokemon.vue'
import CheckListFoodPage from './pages/check-list/food.vue'
import CheckListFoodIndexPage from './pages/check-list/food/index.vue'
import CheckListFoodNamePage from './pages/check-list/food/_name.vue'
import CheckListSkillPage from './pages/check-list/skill.vue'
import CheckListFieldPage from './pages/check-list/field.vue'
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
    { path: '/food-stock', component: FoodStockPage },
    { path: '/box-summary', component: BoxSummaryPage,
      children: [
        { path: 'pokemon', component: BoxSummaryPokemonPage },
        { path: 'berry', component: BoxSummaryBerryPage },
        { path: 'food', component: BoxSummaryFoodPage },
        { path: 'skill', component: BoxSummarySkillPage },
      ]
    },
    { path: '/check-list', component: CheckListPage,
      children: [
        { path: '', component: CheckListIndexPage },
        { path: 'pokemon', component: CheckListPokemonPage },
        {
          path: 'food', component: CheckListFoodPage,
          children: [
            { path: '', component: CheckListFoodIndexPage },
            { path: 'index', component: CheckListFoodIndexPage },
            { path: ':name', component: CheckListFoodNamePage },
          ]
        },
        { path: 'skill', component: CheckListSkillPage },
        { path: 'field', component: CheckListFieldPage },
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
    // OCRライブラリは大きいため、スクショ追加画面を開いた場合だけ読み込む。
    { path: '/screenshot-import', component: () => import('./pages/screenshot-import.vue') },
  ]
});

// デザインシステムは開発中のUI確認専用であり、公開ビルドにはルートも成果物も含めない。
if (import.meta.env.DEV) {
  router.addRoute({
    path: '/design_system',
    component: () => import(/* @vite-ignore */ './pages/design-system.vue'),
  })
}

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
