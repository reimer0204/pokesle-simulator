interface CookingType {
  name: string;
  type: string;
  energy: number;
	foodList: { name: string, num: number }[];
  rawEnergy?: number;
  lv?: number;
  lv1?: number;
  lv2?: number;
  lv3?: number;
  rate?: number;
  recipeLvBonus?: number;
  fixEnergy?: number;
  fixAddEnergy?: number;
  enable?: boolean;
  foodNum?: number;
  maxEnergy?: number;
  addEnergy?: number;
  maxAddEnergy?: number;
}

interface NatureType {
  name: string;
  good?: string,
  weak?: string,
  goodShort?: string,
  weakShort?: string,
}

interface FoodType {
  name: string;
  energy: number;
  img: any;
  bestTypeRate?: { [key: string]: number };
  bestRate?: number;
}

interface BerryType {
  name: string;
  energy: number,
  type: string,
  img: any;
}

interface SkillType {
  name: string;
  effect: any[];
  metronome?: boolean;
  team?: boolean;
  success?: number;
  genki?: boolean;
  shard?: boolean;
  energyOnly?: boolean;
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
  berry: BerryType;
  specialty: string;
  skill: SkillType;
  before?: string | null;
  type?: string;
  evolveLv?: number;
  remainEvolveLv?: number;
  foodNameList: string[];
  bag: number;
  help: number;
  foodRate: number;
  skillRate: number;
  afterList: string[];
  seed?: string;
  isLast?: boolean;

  foodNumListMap: { [key: string]: (number | null)[] }
}

interface SimulatedPokemon {
  box?: any;
  base: PokemonType;
  lv: number;
  foodList: SimulatedFood[];
  foodProbList?: {
    name: string,
    num: number,
    weight: number,
  }[];
  skillLv: number;
  eventBonus: boolean,
  sleepTime: number,
  fixable?: boolean,
  beforeName?: string;
  
  subSkillList?: SubSkillType[];
  subSkillNameList: [string, string, string, string, string];
  nextSubSkillList?: boolean[];
  nature?: NatureType;
  skillWeightList?: { skill: SkillType, weight: number }[];
  
  cookingPowerUpEffect?: number;
  cookingChanceEffect?: number;
  supportScorePerDay?: number;
  supportEnergyPerDay?: number;
  shard?: number;

  // 個体から算出できる結果
  berryNum?: number;
  berryEnergy?: number;
  berryEnergyPerHelp?: number;
  foodRate?: number;
  foodNum?: number;
  foodEnergyPerHelp?: number;
  pickupEnergyPerHelp?: number;
  bag?: number;
  bagFullHelpNum?: number;
  fixedSkillLv?: number;
  skillRate?: number;
  skillCeil?: number;
  ceilSkillRate?: number;
  natureGenkiMultiplier?: number;

  // チームによって決まる
  speedBonus?: number;
  speed?: number;
  baseDayHelpNum?: number;
  morningHealGenki?: number;
  selfMorningHealEffect?: number;
  selfDayHealEffect?: number;
  otherMorningHealEffect?: number;
  otherDayHealEffect?: number;
  
  // 回復量によって決まる
  morningHealEffect?: number;
  dayHealEffect?: number;
  healEffect?: number;
  dayHelpNum?: number;
  nightHelpNum?: number;
  dayHelpRate?: number;
  nightHelpRate?: number;
  averageHelpRate?: number;
  normalDayHelpNum?: number;
  normalNightHelpNum?: number;
  normalHelpNum?: number;
  berryHelpNum?: number;
  berryEnergyPerDay?: number;
  berryNumPerDay?: number;
  foodEnergyPerDay?: number;
  foodNumPerDay?: number;
  pickupEnergyPerDay?: number;
  skillPerDay?: number;
  skillEnergy?: number;
  skillEnergyMap?: { [key: string]: number };
  burstBonus?: number;
  skillEnergyPerDay?: number;
  energyPerDay?: number;

  // 厳選度
  evaluateResult: { [type: number | string]: { [key: string]: {
    name: string,
    rate: number,
    ratio: number,
    score: number,
    energy: number,
  }}};
  evaluateSpecialty: { [type: number | string]: { [key: string]: {
    name: string,
    rate: number,
    ratio: number,
    score: number,
    num: number,
  }}};

  tmpScore?: number;
}

interface SimulatedFood {
  name: string;
  num: number;
  energy: number;
}

export type {
  CookingType,
  FoodType,
  SubSkillType,
  SkillType,
  BerryType,
  NatureType,
  PokemonType,
  PokemonBoxType,
  SimulatedPokemon,
}