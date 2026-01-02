import type { Cooking } from "./data/food_and_cooking";

type FoodName = 'ふといながねぎ' | 'あじわいキノコ' | 'とくせんエッグ' | 'ほっこりポテト' | 'とくせんリンゴ' | 'げきからハーブ' | 'マメミート' | 'モーモーミルク' | 'あまいミツ' | 'ピュアなオイル' | 'あったかジンジャー' | 'あんみんトマト' | 'リラックスカカオ' | 'おいしいシッポ' | 'ワカクサ大豆' | 'ワカクサコーン' | 'めざましコーヒー' | 'ずっしりカボチャ'

interface CookingType {
  name: string;
  type: string;
  energy: number;
	foodList: { name: FoodName, num: number }[];
  rawEnergy?: number;
  lv?: number;
  lv1?: number;
  lv2?: number;
  lv3?: number;
  rate: number;
  recipeLvBonus: number;
  fixEnergy: number;
  fixAddEnergy: number;
  enable?: boolean;
  foodNum: number;
  maxEnergy: number;
  addEnergy: number;
  maxAddEnergy: number;
}

interface NatureType {
  name: string;
  good?: string,
  weak?: string,
  goodShort?: string,
  weakShort?: string,
}

interface FoodType {
  name: FoodName;
  energy: number;
  img: any;
  bestTypeRate?: { [key: string]: number };
  bestRate: number;
  bestCooking: Cooking;
}

interface BerryType {
  name: string;
  energy: number,
  type: string,
  typeColor: string,
  img: any;
}

interface SkillType {
  name: string;
  effect: any[];
  metronome?: boolean;
  team?: boolean;
  success?: number;
  evaluateEnergy?: number[];
  genki?: boolean;
  shard?: boolean;
  energyOnly?: boolean;
  foodList?: FoodType[];
}

interface SubSkillType {
  id: number;
  name: string;
  rarity: number;
  short: string;
  katakana: string;
  next?: string;
  inputSort: number;
}

interface PokemonBoxType {
  name: string;
  lv: number;
  bag?: number;
  skillLv?: number;
  foodList: [string, string, string];
  subSkillList: [string, string, string, string, string];
  nature: string,
  shiny?: boolean,
  fix?: number,
  sleepTime?: number,
  training?: number,
  nextExp?: number,
  memo?: string,
  index: number,
}

interface PokemonType {
  name: string;
  no: number;
  berry: BerryType;
  specialty: 'きのみ' | '食材' | 'スキル' | 'オール';
  skill: SkillType;
  type: string;
  evolveLv: number;
  remainEvolveLv: number;
  foodNameList: string[];
  bag: number;
  help: number;
  exp: number;
  legend: boolean,
  kaihou: boolean,
  foodList: {
    name: string;
    numList: (number | null)[];
  }[],
  foodRate: number;
  skillRate: number;
  afterList: string[];
  seed?: string;
  isLast?: boolean;
  candyName: string;
  requireSleep: { [key: string]: boolean };
  evolveCandyMap: { [key: string]: number };

  evolve: {
    before?: string | null;
    lv?: number | null;
    candy: number | null;
    itemList: string[],
    sleep?: number | null,
  },

  foodNumListMap: { [key: string]: (number | null)[] },

  'ふといながねぎ': number,
  'あじわいキノコ': number,
  'とくせんエッグ': number,
  'ほっこりポテト': number,
  'とくせんリンゴ': number,
  'げきからハーブ': number,
  'マメミート': number,
  'モーモーミルク': number,
  'あまいミツ': number,
  'ピュアなオイル': number,
  'あったかジンジャー': number,
  'あんみんトマト': number,
  'リラックスカカオ': number,
  'おいしいシッポ': number,
  'ワカクサ大豆': number,
  'ワカクサコーン': number,
  'めざましコーヒー': number,
}

type FoodNames = { [key in FoodName]: number };

interface EvaluateResultInfo {
  name?: string,
  rate: number, ratio: number, score: number, value: number,
  pureMint?: EvaluateResultInfo
}
interface EvaluateResult {
  [type: number | string]: {
    [key: string]: {
      energy: EvaluateResultInfo,
      berry: EvaluateResultInfo,
      food: EvaluateResultInfo,
      skill: EvaluateResultInfo,
      specialty: EvaluateResultInfo,
    }
  }
};
type EvaluateResultKey = 'energy' | 'berry' | 'food' | 'skill' | 'specialty'

interface SimulatedPokemon extends FoodNames {
  box?: PokemonBoxType;
  base: PokemonType;
  lv: number;
  foodList: SimulatedFood[];
  foodProbList?: {
    name: string,
    num: number,
    energy: number,
    weight: number,
  }[];
  skillLv: number;
  eventBonus: boolean,
  sleepTime: number,
  fixable?: boolean,
  beforeName?: string;

  useShard: number;
  useCandy: number;
  
  subSkillList?: SubSkillType[];
  subSkillNameList: string[];
  nextSubSkillList?: boolean[];
  nature: NatureType;
  skillWeightList: { skill: SkillType, weight: number, skillLv?: number }[];
  selfHealList: { effect: number, time: number, night?: boolean }[],
  otherHealList: { effect: number, time: number, night?: boolean }[],
  
  cookingPowerUpEffect: number;
  cookingChanceEffect: number;
  supportEnergyPerDay: number;
  supportShardPerDay: number;
  shard: number;

  // 個体から算出できる結果
  berryNum: number;
  berryEnergy: number;
  berryEnergyPerHelp: number;
  foodRate: number;
  foodNum: number;
  foodEnergyPerHelp: number;
  pickupEnergyPerHelp: number;
  bag: number;
  bagFullHelpNum: number;
  fixedSkillLv: number;
  skillRate: number;
  skillCeil: number;
  ceilSkillRate: number;
  natureGenkiMultiplier: number;

  // チームによって決まる
  speedBonus: number;
  speed: number;
  baseDayHelpNum: number;
  morningHealGenki: number;
  // selfMorningHealEffect?: number;
  // selfDayHealEffect?: number;
  // otherMorningHealEffect?: number;
  // otherDayHealEffect?: number;
  selfHeal: number;
  otherHeal: number;
  
  // 回復量によって決まる
  morningHealEffect: number;
  dayHealEffect: number;
  healEffect: number;
  dayHelpNum: number;
  nightHelpNum: number;
  dayHelpRate: number;
  nightHelpRate: number;
  averageHelpRate: number;
  normalDayHelpNum: number;
  normalNightHelpNum: number;
  normalHelpNum: number;
  berryHelpNum: number;
  berryEnergyPerDay: number;
  berryNumPerDay: number;
  foodEnergyPerDay: number;
  foodNumPerDay: number;
  pickupEnergyPerDay: number;
  skillPerDay: number;
  skillEnergy: number;
  skillEnergyMap: { [key: string]: number };
  burstBonus: number;
  skillEnergyPerDay: number;
  energyPerDay: number;

  // 厳選度
  evaluateResult: EvaluateResult;

  tmpScore?: number;
  score: number;
}

interface SimulatedFood {
  name: FoodName;
  num: number;
  energy: number;
}

export type {
  FoodName,
  CookingType,
  FoodType,
  SubSkillType,
  SkillType,
  BerryType,
  NatureType,
  PokemonType,
  PokemonBoxType,
  SimulatedPokemon,
  EvaluateResultInfo,
  EvaluateResult,
  EvaluateResultKey,
}

/*
interface EvaluateResultInfo {
  rate: number, ratio: number, score: number, value: number,
  pureMint?: EvaluateResultInfo
}
interface EvaluateResult {
  [type: number | string]: {
    [key: string]: {
      energy: EvaluateResultInfo,
      berry: EvaluateResultInfo,
      food: EvaluateResultInfo,
      skill: EvaluateResultInfo,
    }
  }
};
type EvaluateResultKey = 'energy' | 'berry' | 'food' | 'skill'
*/