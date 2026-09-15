import SortableTable from "../components/sortable-table.vue";
import Berry from "./berry.ts";
import { Food, Cooking } from './food_and_cooking.ts'
import Pokemon from "./pokemon.ts";
import Skill from "./skill.ts";
import SubSkill from "./sub-skill.ts";

const defaultConfig = {

  v: 20260704,

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
    memo: false,
    selectDetail: false,
    selectEnergy: false,
    evaluateList: 2,
    baseInfo: true,
    subSkillShort: true,
    foodInfo: false,
    simulatedInfo: false,
    fixScore: false,
    candy: false,
    pageUnit: 50,
    cleaning: {
      shinyLock: true,
    },
  },

  pokemonBox: {
    tsv: {
      name: 1,
      lv: 2,
      skillLv: 3,
      foodABC: null,
      foodList: [4, 5, 6],
      subSkillList: [7, 8, 9, 10, 11],
      nature: 12,
      shiny: 13,
      fix: 14,
      sleepTime: 15,
      training: 16,
      nextExp: 17,
      memo: 18,
      favorite: 19,
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
    fieldEx: 1,
    fieldExMainBerry: '',
    fieldBonus: 85,
    berryList: ['', '', ''],
    cookingType: 'カレー',
    cookingRecipeLv: 55,
    cookingWeight: 1,
    shardWeight: 30,
    foodGetRate: 30,
    campTicket: false,
    genkiFull: false,
    eventBonusType: {
      types: {
        ...Berry.list.reduce((a, x) => (a[x.type] = false, a), {})
      },
      specialties: {
        'きのみ': false,
        '食材': false,
        'スキル': false,
      },
    },
    eventBonus: {
      skill: {
        berryBurst: 1,
        foodGet: 1,
      },
    },
    eventBonusTypeBerry: 0,
    eventBonusTypeFood: 0,
    eventBonusTypeSkillRate: 1,
    eventBonusTypeSkillLv: 0,
    eventBonusTypeBag: 0,
    eventBonusTypeBagRate: 1,
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
    fixCheckList: true,
    fixBorder: null,
    fixBorderSpecialty: null,
    fixFilter: {
      enable: true,
      conditionList: [],
    },

    enableCooking: {},
    cookingSettings: {},
    cookingRecipeLvType1: true,
    cookingRecipeLvType2: false,
    cookingRecipeLvType3: false,
    cookingRecipeLvType4: true,
    cookingRecipeFixLv: Cooking.maxRecipeLv,
    cookingRecipeRepeatLv: 100,
    cookingRecipeRepeatLv2: 1,
    remainFoodMode: 0,
    remainFoodRate: 0,
    mode: 0,

    filter: {
      enable: true,
      conditionList: [],
    },

    expectType: {
      border: 80,
      food: 0,
      ...Object.fromEntries(Skill.list.map(x => [x.name, 0])),
      ...Object.fromEntries(Skill.list
        .filter(x => 
          x.name.includes('げんきオール')
          || x.name.includes('料理パワーアップ')
        )
        .map(x => [x.name, 0])
      ),
    },

    skillRate: {
      ...Object.fromEntries(Skill.list.map(x => [x.name, 1])),
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
    foodGetEvaluateType: 3,
    foodGetEvaluateRate: 0.3,

    require: {
      dayHelpRate: 0,
      nightHelpRate: 0,
      suiminExp: 0,
      specialtyNum: {
        'きのみ': 0,
        '食材': 0,
        'スキル': 0,
      },
      typeNum: Berry.list.reduce((a, x) => (a[x.type] = 0, a), {})
    },

    result: {
      detail: false,
      food: false,
    },
  },

  foodDefaultNum: {},
  foodUnlimited: false,

  // 厳選関連
  selectEvaluate: {
    shardEnergyRate: 60,   // エナジー/ゆめのかけら
    shardEnergy: 10,        // ゆめのかけらをエナジーに換算する
    shardBonus: 50,         // ゆめのかけらボーナスをエナジー換算する際の価値(%)
    silverSeed: Object.fromEntries(
      SubSkill.list
      .filter(x => x.next != null)
      .map(x => [x.name, true])
    ),
    helpBonus: 20,          // おてつだいボーナスがどれだけ手伝い速度を短縮するか(余剰分はエナジーの倍率で計算)
    teamHelpBonus: 3,       // チームに自分以外のおてボ持ちが何匹いるか
    supportBorder: 90,      // おてサポ、げんきオール等の評価に使う、他ポケモンがどのくらい厳選されているか
    supportRankNum: 20,     // おてサポ、げんきオール等の評価に使う、他ポケモンがどのくらい厳選されているか
    cookingPowerUpType: 1,  // 料理パワーアップの評価方法(0:理論値, 1:平均)  
    cookingPowerUpRate: 60,    
    healer: 90,             // 厳選評価計算時にヒーラーが日中に回復するげんき(げんき回復量の性格評価に影響)
    expectType: {
      border: 70,
      food: 1,
      ...Object.fromEntries(Skill.list.map(x => [x.name, 0])),
      ...Object.fromEntries(Skill.list
        .filter(x => 
          x.name.includes('げんきオール')
          || x.name.includes('料理パワーアップ')
        )
        .map(x => [x.name, 0])
      ),
    },
    genkiFullIfSelfHeal: false,
    levelList: {
      10: false,
      25: false,
      30: true,
      50: true,
      60: true,
      70: true,
      80: false,
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
          ...Object.fromEntries(Skill.list.map(x => [x.name, { type: x.name.includes('食材セレクト') ? 2 : 1, lv: 1 }])),
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
    subSkill: {
      suiminExpBonus: { add: 0, rate: 1 },
    },
    nature: {
      expUp: { add: 0, rate: 1 },
      expDown: { add: 0, rate: 1 },
    },
    skillEnergy: Object.fromEntries(
      Skill.list.filter(x => x.evaluateEnergy != null).map(skill => {
        return [
          skill.name,
          skill.evaluateEnergy.map(() => null)
        ]
      })
    ),
    pokemonSleepTime: 500,
    energyPerCandy: 200,
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

  foodStock: {
    weight: {
      カレー: 100,
      サラダ: 100,
      デザート: 100,
    },
    bagSize: 800,
    cookingNum: 21,
    candidateNum: 8,
    minFoodNum: 0,
    maxFoodNum: 999,
    surplusFoodNum: 0,
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

  summary: {
    checklist: {
      pokemonCondition: {
        list: [
          { type: 1, target: 'きのみ', aaa: true, aab: true, aac: true, aba: true, abb: true, abc: true, energyBorder: null, specialtyBorder: null },
          { type: 1, target: '食材', aaa: true, aab: true, aac: true, aba: true, abb: true, abc: true, energyBorder: null, specialtyBorder: null },
          { type: 1, target: 'スキル', aaa: true, aab: true, aac: true, aba: true, abb: true, abc: true, energyBorder: null, specialtyBorder: null },
        ],
        selectLv: 'max',
        disablePokemonMap: Object.fromEntries(Pokemon.list.map(x => [x.name, false]))
      },
      food: {
        enableMap: Object.fromEntries(Food.list.map(x => [x.name, true])),
        borderType: 0,
        borderLv: null,
        borderRate: 95,
        borderValue: 70,
        targetValue: 85,
      },
      skill: {
        enableMap: Object.fromEntries(Skill.list.map(x => [x.name, true])),
        borderLv: null,
        borderRate: 95,
        borderValue: 75,
        targetValue: 85,
        skillSpecialtyOnly: true,
      },
      field: {
        shinkago: false,
        bakecchaMatome: true,
      }
    },
  }
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
