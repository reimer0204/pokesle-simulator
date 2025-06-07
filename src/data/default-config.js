import SortableTable from "../components/sortable-table.vue";
import { Food, Cooking } from './food_and_cooking'
import Pokemon from "./pokemon";
import Skill from "./skill";

const defaultConfig = {

  // 評価全般(げんき係数再計算)
  sleepTime: 8.5, // 睡眠時間
  checkFreq: 10,  // チェック頻度

  // 初期設定が完了しているか
  initSetting: false,
  version: {
    history: 0,
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
    candy: false,
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
      fix: 15,
      sleepTime: 16,
      training: 17,
      nextExp: 18,
      memo: 19,
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
    genkiFull: false,
    eventBonusType: null,
    eventBonusTypeFood: 1,
    eventBonusTypeSkillRate: 1.5,
    eventBonusTypeSkillLv: 3,
    potSize: Cooking.potMax,
    bagOverOperation: true,
    researchRankMax: true,

    fix: false,
    fixLv: null,
    fixEvolve: null,
    fixEvolveExcludeSleep: false,
    fixResourceMode: 0,
    fixSubSkillSeed: false,
    fixSkillSeed: false,
    fixBorder: 80,
    fixBorderSpecialty: 80,
    fixFilter: {
      enable: true,
      conditionList: [],
    },

    enableCooking: {},
    cookingSettings: {},
    cookingRecipeLvType1: true,
    cookingRecipeLvType2: true,
    cookingRecipeLvType3: true,
    cookingRecipeFixLv: Cooking.maxRecipeLv,
    cookingRecipeRepeatLv: 100,
    mode: 0,

    filter: {
      enable: true,
      conditionList: [],
    },

    expectType: {
      border: 80,
      food: 0,
      // ...Object.fromEntries(Skill.list.map(x => [x.name, 0])),
      // 'げんきオールS': 0,
      // '食材ゲットS': 0,
      // '料理パワーアップS': 0,
    },
  },

  teamSimulation: {
    maxRankBerry: 5,
    maxRankFood: 10,
    maxRankNotSupport: 20,
    maxRankAll: 15,
    resultNum: 10,
    cookingNum: 3,
    nightCapPikachu: 0,

    require: {
      dayHelpRate: 0,
      nightHelpRate: 0,
      suiminExp: 0,
    },

    result: {
      detail: false,
      food: false,
    },
  },

  foodDefaultNum: {},

  // 厳選関連
  selectEvaluate: {
    shardEnergyRate: 120,   // エナジー/ゆめのかけら
    shardEnergy: 20,        // ゆめのかけらをエナジーに換算する
    shardBonus: 50,         // ゆめのかけらボーナスをエナジー換算する際の価値(%)
    silverSeedUse: true,    // 銀種前提で厳選するか
    helpBonus: 20,          // おてつだいボーナスがどれだけ手伝い速度を短縮するか(余剰分はエナジーの倍率で計算)
    teamHelpBonus: 3,       // チームに自分以外のおてボ持ちが何匹いるか
    supportBorder: 90,      // おてサポ、げんきオール等の評価に使う、他ポケモンがどのくらい厳選されているか
    supportRankNum: 20,     // おてサポ、げんきオール等の評価に使う、他ポケモンがどのくらい厳選されているか
    healer: 50,             // 厳選評価計算時にヒーラーが日中に回復するげんき(げんき回復量の性格評価に影響)
    expectType: {
      border: 70,
      food: 1,
      // ...Object.fromEntries(Skill.list.map(x => [x.name, 0])),
      // 'げんきオールS': 1,
      // '食材ゲットS': 1,
      // '料理パワーアップS': 1,
    },
    levelList: {
      10: false,
      25: false,
      30: true,
      50: true,
      60: true,
      75: true,
      100: false,
    },
    specialty: {
      'きのみ': {
        berryEnergyRate: 200,   // 
        foodEnergyRate: 50,     // 厳選計算の食材評価時、基礎エナジー(0%)～理論値(100%)のどこで評価するか
        foodGetRate: 30,        // 食材ゲットの評価レート
        skillLv: {
          ...Object.fromEntries(Skill.list.map(x => [x.name, { type: 1, lv: 1 }])),
        },
      },
      '食材': {
        berryEnergyRate: 200,   // 
        foodEnergyRate: 80,     // 厳選計算の食材評価時、基礎エナジー(0%)～理論値(100%)のどこで評価するか
        foodGetRate: 30,        // 食材ゲットの評価レート
        skillLv: {
          ...Object.fromEntries(Skill.list.map(x => [x.name, { type: 1, lv: 1 }])),
        },
      },
      'スキル': {
        berryEnergyRate: 200,   // 
        foodEnergyRate: 50,     // 厳選計算の食材評価時、基礎エナジー(0%)～理論値(100%)のどこで評価するか
        foodGetRate: 50,        // 食材ゲットの評価レート
        skillLv: {
          ...Object.fromEntries(Skill.list.map(x => [x.name, { type: 2, lv: 1 }])),
        },
      },
      'オール': {
        berryEnergyRate: 200,   // 
        foodEnergyRate: 80,     // 厳選計算の食材評価時、基礎エナジー(0%)～理論値(100%)のどこで評価するか
        foodGetRate: 50,        // 食材ゲットの評価レート
        skillLv: {
          ...Object.fromEntries(Skill.list.map(x => [x.name, { type: 2, lv: 1 }])),
        },
      },
    },
    pokemonSleepTime: 500,
  },

  candy: {
    shard: null,
    boostMultiply: 2,
    boostShard: 5,
    bag: {
      s: 0,
      m: 0,
      l: 0,
    },
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

defaultConfig.simulation.cookingRecipeLv = Object.keys(Cooking.recipeLvs).length;
defaultConfig.simulation.potSize = Cooking.potMax;

for(let food of Food.list) {
  defaultConfig.foodDefaultNum[food.name] = 0;
}
for(let cooking of Cooking.list) {
  defaultConfig.simulation.enableCooking[cooking.name] = true;
  defaultConfig.simulation.cookingSettings[cooking.name] = {
    lv: 1,
  };
}

// 種ポケをリストアップし所持アメ設定のメンバーにする
for(const pokemon of Pokemon.list.filter(x => x.evolve.before == null)) {
  defaultConfig.candy.bag[pokemon.candyName] = 0;
}

export default defaultConfig