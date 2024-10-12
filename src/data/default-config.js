import SortableTable from "../components/sortable-table.vue";
import Cooking from "./cooking";
import Food from './food'

const defaultConfig = {

  // 評価全般(げんき係数再計算)
  sleepTime: 8.5, // 睡眠時間
  checkFreq: 10,  // チェック頻度

  // 初期設定が完了しているか
  initSetting: false,
  version: {
    evaluateTable: null,
    evaluateTableSleepTime: 8.5,
    evaluateTableCheckFreq: 10,
  },

  // シミュレーション設定
  healEffectParameter: [0.891, 1.02, 4, 1, -2.304, 1, 0.00156],
  dayHelpParameter:    [0.0180, -0.429, 1.00, 0.635, 1.57],
  nightHelpParameter:  [0.0254, -0.980, 1.76, 0.900, 0.97],
  genkiSimulationDiffAverage: null,
  genkiSimulationDiffMax: null,

  pokemonList: {
    selectDetail: false,
    selectEnergy: false,
    baseInfo: true,
    subSkillShort: true,
    foodInfo: false,
    simulatedInfo: false,
    fixScore: false,
    pageUnit: 50,
  },

  pokemonBox: {
    tsv: {
      name: 1,
      lv: 2,
      bag: 3,
      skillLv: 4,
      foodABC: null,
      foodList: [5, 6, 7],
      subSkillList: [8, 9, 10, 11, 12],
      nature: 13,
      shiny: 14,
    },
    gs: {
      url: null,
      autoExport: true,
      sheet: 'シート1',
    },
  },

  simulation: {
    selectInfo: true,
    specialtySelectInfo: true,
    selectType: 0,
    selectBorder: 90,
    field: 'ワカクサ本島',
    fieldBonus: 60,
    berryList: ['', '', ''],
    cookingType: 'カレー',
    cookingRecipeLv: 55,
    cookingWeight: 1,
    shardWeight: 30,
    foodGetRate: 30,
    campTicket: false,
    eventBonusType: null,
    eventBonusTypeFood: 1,
    eventBonusTypeSkillRate: 1.5,
    eventBonusTypeSkillLv: 3,
    potSize: 57,
    bagOverOperation: true,
    researchRankMax: true,

    fix: false,
    fixLv: null,
    fixEvolve: null,
    fixSubSkillSeed: false,
    fixSkillSeed: false,
    fixBorder: 80,

    enableCooking: {},
  },

  teamSimulation: {
    maxRank: 30,
    resultNum: 10,
    cookingNum: 3,
    nightCapPikachu: 0,

    result: {
      detail: false,
      food: false,
    },
  },

  foodDefaultNum: {},

  // 厳選関連
  selectEvaluate: {
    berryMatchAll: true,    // 食材/スキルタイプ
    shardEnergyRate: 120,   // エナジー/ゆめのかけら
    shardEnergy: 20,        // ゆめのかけらをエナジーに換算する
    shardBonus: 50,         // ゆめのかけらボーナスをエナジー換算する際の価値(%)
    silverSeedUse: true,    // 銀種前提で厳選するか
    foodEnergyRate: 70,     // 厳選計算の食材評価時、基礎エナジー(0%)～理論値(100%)のどこで評価するか
    foodGetRate: 30,        // 食材ゲットの評価レート
    helpBonus: 20,          // おてつだいボーナスがどれだけ手伝い速度を短縮するか(余剰分はエナジーの倍率で計算)
    supportBorder: 90,      // おてサポ、げんきオール等の評価に使う、他ポケモンがどのくらい厳選されているか
    supportRankNum: 20,      // おてサポ、げんきオール等の評価に使う、他ポケモンがどのくらい厳選されているか
    healer: 50,             // 厳選評価計算時にヒーラーが日中に回復するげんき(げんき回復量の性格評価に影響)
    levelList: {
      10: false,
      25: false,
      30: true,
      50: true,
      60: true,
      75: true,
      100: false,
    },
    skillLevel: {           // 厳選評価時のスキルレベル
      'エナジーチャージS': null,
      'エナジーチャージS(ランダム)': null,
      'エナジーチャージM': 7,
      'げんきチャージS': null,
      'げんきエールS': null,
      'げんきオールS': 6,
      '食材ゲットS': 7,
      'おてつだいサポートS': 7,
      'おてつだいブースト': 6,
      '料理パワーアップS': 7,
      '料理チャンスS': 6,
      'ゆめのかけらゲットS': 7,
      'ゆめのかけらゲットS(ランダム)': 7,
      'ゆびをふる': 6,
    },
    pokemonSleepTime: 500,
  },



  // 起床時元気評価
  // 0: 睡眠時間や性格に応じたげんきからスタートする
  // 1: 睡眠時間や性格によらず100%からスタートする
  // TODO: 元気エミュレーターの仕様上100%スタートじゃないと計算厳しいかも
  genkiBase: 1,



  healerEmulateLoop: 1000,
  workerNum: 4,

  sortableTable: {
    pokemonList2: { sort: [], hiddenColumn: [] },
  },
}

for(let food of Food.list) {
  defaultConfig.foodDefaultNum[food.name] = 0;
}
for(let cooking of Cooking.list) {
  defaultConfig.simulation.enableCooking[cooking.name] = true;
}

export default defaultConfig