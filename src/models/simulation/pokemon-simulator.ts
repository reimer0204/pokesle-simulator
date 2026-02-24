import HelpRate from '../help-rate';

import Pokemon from "../../data/pokemon";
import Exp from "../../data/exp";
import Skill from "../../data/skill";
import { Food, Cooking } from "../../data/food_and_cooking";
import Nature from "../../data/nature";
import Field from '../../data/field.ts';
import Berry from '../../data/berry';
import SubSkill from '../../data/sub-skill';
import ProbBorder from '../utils/prob-border';
import type { CookingType, FoodType, NatureType, PokemonBoxType, PokemonType, SimulatedPokemon, SkillType, SubSkillType } from '../../type';

const GENKI_EFFECT = [0, 0.45, 0.52, 0.62, 0.71, 1.00];

// const FOOD_EMPTY_MAP = Object.fromEntries(Food.list.map(x => [x.name, 0]))

enum PokemonSimulatorMode {
  ABOUT = 1,
  TEAM = 2,
  SELECT = 3,
}

interface BestCookingType extends CookingType {
  lastEnergy: number;
}

class PokemonSimulator {

  config: any;
  mode: PokemonSimulatorMode;
  helpEffectCache = new Map<string, [number, number]>();
  helpRateCache = new Map<string, any>();
  // calcStatusCache = new Map<string, any>();
  #fixedPotSize: number;
  cookingList: CookingType[];
  #defaultBestCooking: BestCookingType;
  foodEnergyMap: {[key: string]: { min: number, max: number }};
  defaultHelpRate: { day: number, night: number };

  #expectType;
  #probBorder;
  #berryEnergyWeight = 1;
  #foodEnergyWeight = 1;
  #skillEnergyIgnore = 0;
  #helpRate: HelpRate;
  #freeCandy = 0;

  static MODE_ABOUT = 1;
  static MODE_TEAM = 2;
  static MODE_SELECT = 3;
  static FOOD_NUM_RESET = Object.fromEntries(Food.list.map(x => [x.name, 0]));
  #nightLength: number;
  #dayLength: number;
  #addHeal?: { effect: number; time: number; }[];
  #foodCommonRate: number;
  #simulatedDefaultPokemon: SimulatedPokemon;

  constructor(config: any, mode: number) {
    if (!mode) throw 'モードが指定されていません'

    this.config = config;
    this.mode = mode;
    this.#nightLength = Math.round(this.config.sleepTime * 3600)
    this.#dayLength = 86400 - this.#nightLength

    if (this.config.teamSimulation.timeLength != null && this.mode != PokemonSimulatorMode.SELECT) {
      const length = 86400 * this.config.teamSimulation.timeLength;
      if (this.#dayLength > length) {
        this.#dayLength = length;
        this.#nightLength = 0;
      } else {
        this.#nightLength = length - this.#dayLength;
      }
    }

    this.#fixedPotSize =
      mode == PokemonSimulator.MODE_SELECT ? Cooking.potMax
      : Math.round(this.config.simulation.potSize * (this.config.simulation.campTicket ? 1.5 : 1))

    // 今週の料理タイプのリスト
    if (mode == PokemonSimulator.MODE_SELECT) {
      this.cookingList = Cooking.evaluateLvList({
        simulation: {
          cookingRecipeLvType2: true,
          cookingRecipeFixLv: Cooking.maxRecipeLv,
        }
      })
    } else {
      this.cookingList = Cooking.evaluateLvList(config)
      this.cookingList = this.cookingList.filter(c => c.type == this.config.simulation.cookingType && (c.enable || c.foodNum == 0));
    }

    let foodCommonRate = (mode == PokemonSimulatorMode.SELECT || config.teamSimulation.day == null) ? ((2 * 0.1 + 0.9) * 6 + (3 * 0.3 + 0.7)) / 7
      : config.teamSimulation.day == 6 ? 1.3
      : 1.1;
    if (config.teamSimulation.initialCookingChange && mode != PokemonSimulatorMode.SELECT) {
      foodCommonRate = 0;
      let length = config.teamSimulation.day != null ? 3 : 21;
      let noSuccessRate = 1;
      for(let i = 0; i < length; i++) {
        let success = ((i >= 18 || config.teamSimulation.day == 6) ? 0.3 : 0.1) + config.teamSimulation.initialCookingChange * noSuccessRate;
        noSuccessRate *= 1 - success;
        foodCommonRate += success
      }
      foodCommonRate /= length;
    }

    if (mode == PokemonSimulatorMode.ABOUT) {
      foodCommonRate *= config.simulation.cookingWeight
    }
    this.#foodCommonRate = foodCommonRate;

    // 有効な料理に対しての食材のエナジー評価
    this.foodEnergyMap = {};
    for(const food of Food.list) this.foodEnergyMap[food.name] = { min: food.energy * foodCommonRate, max: food.energy };
    for(const cooking of this.cookingList) {
      for(const cookingFood of cooking.foodList) {
        this.foodEnergyMap[cookingFood.name].max = Math.max(
          this.foodEnergyMap[cookingFood.name].max,
          Food.map[cookingFood.name].energy * cooking.rate * cooking.recipeLvBonus * foodCommonRate
        )
      }
    }

    // 現状の鍋のサイズでできる一番いい料理
    this.#defaultBestCooking = this.cookingList
      .filter(cooking => cooking.foodNum <= this.#fixedPotSize)
      .map(cooking => ({
        ...cooking,
        lastEnergy: cooking.fixEnergy + (this.#fixedPotSize - cooking.foodNum) * Food.averageEnergy,
      }))
      .sort((a, b) => b.lastEnergy - a.lastEnergy)[0];

    // this.calcStatusCache = new Map();

    this.#helpRate = new HelpRate(this.config, mode);
    this.defaultHelpRate = this.#helpRate.getHelpRate([])

    if (config.simulation.berryEnergyWeight != null) {
      this.#berryEnergyWeight = config.simulation.berryEnergyWeight;
    }
    if (config.simulation.foodEnergyWeight != null) {
      this.#foodEnergyWeight = config.simulation.foodEnergyWeight;
    }
    if (config.simulation.skillEnergyIgnore != null) {
      this.#skillEnergyIgnore = config.simulation.skillEnergyIgnore;
    }

    // 期待値計算
    this.#expectType = mode == PokemonSimulator.MODE_SELECT ? config.selectEvaluate.expectType : config.simulation.expectType;
    this.#probBorder = new ProbBorder(this.#expectType.border / 100)
    this.#freeCandy = config.candy.bag.s * 3 + config.candy.bag.m * 20 + config.candy.bag.l * 100

    if (mode == PokemonSimulator.MODE_SELECT) {
      this.#addHeal = new Array(this.config.checkFreq).fill(0).map((_, i) => {
        return {
          effect: this.config.selectEvaluate.healer / this.config.checkFreq,
          time: Math.round(this.#dayLength * i / (this.config.checkFreq - 1))
        }
      })
    } else {
      this.#addHeal = undefined;
    }

    this.#simulatedDefaultPokemon = {
      foodList: [],
      foodProbList: [],

      subSkillNameList: [],
      cookingPowerUpEffect: 0,
      cookingChanceEffect: 0,
      supportEnergyPerDay: 0,
      supportShardPerDay: 0,
      shard: 0,
      berryNum: 0,
      berryEnergy: 0,
      berryEnergyPerHelp: 0,
      foodRate: 0,
      foodNum: 0,
      foodEnergyPerHelp: 0,
      pickupEnergyPerHelp: 0,
      bag: 0,
      bagFullHelpNum: 0,
      fixedSkillLv: 0,
      skillRate: 0,
      skillCeil: 0,
      ceilSkillRate: 0,
      natureGenkiMultiplier: 0,
      speedBonus: 0,
      speed: 0,
      baseDayHelpNum: 0,
      morningHealGenki: 0,
      selfHeal: 0,
      otherHeal: 0,
      morningHealEffect: 0,
      dayHealEffect: 0,
      healEffect: 0,
      dayHelpNum: 0,
      nightHelpNum: 0,
      dayHelpRate: 0,
      nightHelpRate: 0,
      averageHelpRate: 0,
      normalDayHelpNum: 0,
      normalNightHelpNum: 0,
      normalHelpNum: 0,
      berryHelpNum: 0,
      berryEnergyPerDay: 0,
      berryNumPerDay: 0,
      foodEnergyPerDay: 0,
      foodNumPerDay: 0,
      pickupEnergyPerDay: 0,
      skillPerDay: 0,
      skillEnergy: 0,
      skillEnergyMap: {},
      burstBonus: 0,
      skillEnergyPerDay: 0,
      energyPerDay: 0,
      evaluateResult: {},
      score: 0,
      nature: null!,
      skillWeightList: [],
      selfHealList: [],
      otherHealList: [],
    }
    for(let food of Food.list) {
      this.#simulatedDefaultPokemon[food.name] = 0;
    }
  }

  fromBox(box: PokemonBoxType, fixable: boolean = false, useCandy: number = 0, requireLv: number = 0) {
    const base = Pokemon.map[box.name];
    let lv = box.lv;
    let useShard = 0;
    const nature = Nature.map[box.nature];

    if(fixable) {
      if (this.config.simulation.fixResourceMode == 0) {
        if (this.config.simulation.fixLv || requireLv) {
          lv = Math.max(this.config.simulation.fixLv, box.lv, requireLv); 
        }
      }
      if (this.config.simulation.fixResourceMode == 1 || this.config.simulation.fixResourceMode == 2) {
        const lvLimit = this.config.simulation.fixResourceMode == 1 ? Exp.list.length : Math.max(this.config.simulation.fixLv, requireLv);
        let totalExp = box.nextExp ? Math.round(Exp.list[Math.min(box.lv + 1, Exp.list.length) - 1].total * base.exp) - box.nextExp : Math.round(Exp.list[Math.min(box.lv, Exp.list.length) - 1].total * base.exp)
        let candyExp = nature.good == 'EXP獲得量' ? 30 : nature.weak == 'EXP獲得量' ? 21 : 25;
        
        while(lv < lvLimit) {
          let nextTotal = Math.round(Exp.list[lv].total * base.exp)
          const requireCandy = Math.ceil((nextTotal - totalExp) / candyExp)
          const requireShard = Exp.list[lv - 1].shard * requireCandy;
          totalExp += candyExp * requireCandy;
          if (useCandy + requireCandy <= this.config.candy.bag[base.candyName] + this.#freeCandy && (!this.config.candy.shard || requireShard + useShard <= this.config.candy.shard)) {
            useCandy += requireCandy
            useShard += requireShard
            lv++;
          } else {
            break;
          }
        }
      }
    }

    // 銀種
    // 有効なサブスキル計算
    let enableSubSkillLength = 0;
    if (lv >=  10) enableSubSkillLength++;
    if (lv >=  25) enableSubSkillLength++;
    if (lv >=  50) enableSubSkillLength++;
    if (lv >=  75) enableSubSkillLength++;
    if (lv >= 100) enableSubSkillLength++;
    let subSkillNameList = [...box.subSkillList];
    if (fixable && this.config.simulation.fixSubSkillSeed) {
      let hit;
      do {
        hit = false;
        subSkillNameList.slice(0, enableSubSkillLength).forEach((subSkillName, i) => {
          const subSkill = SubSkill.map[subSkillName]
          if (subSkill?.next && !subSkillNameList.includes(subSkill.next)) {
            hit = true;
            subSkillNameList[i] = subSkill?.next;
          }
        })
      } while(hit)
    }
    let enableSubSkillList = subSkillNameList.slice(0, enableSubSkillLength);
    
    // きのみ倍率
    const berryMatch = ((this.config.simulation.field == 'ワカクサ本島'
      ? this.config.simulation.berryList
      : Field.map[this.config.simulation.field]?.berryList) ?? []).includes(base.berry.name);
    let berryRate = berryMatch
      ? (this.config.simulation.fieldEx == 1 ? 240 : 200)
      : 100;

    const pokemon = this.initSimulatedPokemon(
      base,
      lv,
      box.foodList,
      fixable && this.config.simulation.fixSkillSeed ? base.skill.effect.length : box.skillLv,
      this.config.simulation.eventBonusType.types[base.type]
        || this.config.simulation.eventBonusType.specialties[base.specialty]
        || (
          base.specialty == 'オール' && (
            this.config.simulation.eventBonusType.specialties['きのみ']
            || this.config.simulation.eventBonusType.specialties['食材']
            || this.config.simulation.eventBonusType.specialties['スキル']
          )
        ),
      box.sleepTime,
      useCandy,
      useShard,
      berryMatch,
    );
    pokemon.box = box;
    pokemon.fixable = fixable;

    // 銀種が使用できるかどうかの一覧
    pokemon.nextSubSkillList = box.subSkillList.map(subSkillName => {
      const subSkill = SubSkill.map[subSkillName]
      return subSkill?.next && !box.subSkillList.includes(subSkill.next)
    })

    this.calcParameter(
      pokemon,
      enableSubSkillList.map(x => SubSkill.map[x]),
      nature,
      berryRate,
      berryMatch,
    )

    return pokemon;
  }

  fromEvaluate(
    basePokemon: PokemonType,
    lv: number,
    foodNameList: string[],
  ) {
    // スキルレベル計算
    let skillLvSetting = this.config.selectEvaluate.specialty[basePokemon.specialty].skillLv[basePokemon.skill.name];
    let skillLv: number = null;
    if (skillLvSetting.type == 1) {
      skillLv = basePokemon.evolveLv;
    }
    if (skillLvSetting.type == 2) {
      skillLv = basePokemon.skill.effect.length;
    }
    if (skillLvSetting.type == 3) {
      skillLv = skillLvSetting.lv;
    }

    return this.initSimulatedPokemon(
      basePokemon,
      lv,
      foodNameList,
      skillLv,
      false,
      this.config.selectEvaluate.pokemonSleepTime,
    )
  }

  initSimulatedPokemon(
    base: PokemonType,
    lv: number,
    foodNameList: string[],
    skillLv: number,
    eventBonus: boolean = false,
    sleepTime: number,
    useCandy: number = 0,
    useShard: number = 0,
    berryMatch: boolean = false
  ): SimulatedPokemon {
    const firstFoodEnergy = Food.map[foodNameList[0]].energy * ((base.specialty == '食材' || base.specialty == 'オール') ? 2 : 1)

    const pokemon: SimulatedPokemon = {
      ...structuredClone(this.#simulatedDefaultPokemon),
      base,
      skillLv: skillLv,
      lv: lv,
      eventBonus,
      sleepTime,
      useCandy,
      useShard,
    }

    let foodUnlock = lv >= 60 ? 3 : lv >= 30 ? 2 : 1;

    for(let [index, name] of foodNameList.slice(0, foodUnlock).entries()) {
      if (!name) continue;
      const food = Food.map[name];
      if (food == null) throw `${pokemon.base.name}:不正な食べ物(${name})`
      let num = Math.round(firstFoodEnergy * [1, 2.25, 3.6][index] / food.energy);
      if (eventBonus) {
        num += this.config.simulation.eventBonusTypeFood;
      }

      // EXモードの食材+1
      if (
        this.mode != PokemonSimulator.MODE_SELECT
        && this.config.simulation.fieldEx == 2
        && berryMatch
      ) {
        num += 1;
        if (pokemon.base.specialty == '食材') {
          num += 0.5;
        }
      }

      const foodUseRate = this.mode == PokemonSimulatorMode.SELECT
        ? this.config.selectEvaluate.specialty[base.specialty].foodEnergyRate / 100
        : 1

      pokemon.foodList.push({
        name: food.name,
        num,
        energy: (this.foodEnergyMap[food.name].max * foodUseRate + this.foodEnergyMap[food.name].min * (1 - foodUseRate)),
      })
    }

    pokemon.foodProbList = this.calcFoodProbList(pokemon.foodList)

    // 発動するスキルの一覧(ゆびをふる用)
    if (pokemon.base.skill.name == 'ゆびをふる') {
      pokemon.skillWeightList = Skill.metronomeWeightList;
    } else {
      pokemon.skillWeightList = [{ skill: pokemon.base.skill, weight: 1 }]
    }

    return pokemon;
  }


  // おてスピや所持数、各種確率等の基本的な計算
  calcParameter(
    pokemon: SimulatedPokemon,
    subSkillList: SubSkillType[],
    nature: NatureType,
    berryRate: number,
    berryMatch: boolean,
  ) {
    pokemon.cookingPowerUpEffect = 0;
    pokemon.cookingChanceEffect = 0;
    pokemon.shard = 0;
    pokemon.subSkillList = subSkillList;
    pokemon.subSkillNameList = subSkillList.map(x => x?.name);
    pokemon.nature = nature;

    // きのみの個数
    pokemon.berryNum = ((pokemon.base.specialty == 'きのみ' || pokemon.base.specialty == 'オール') ? 2 : 1)
      + (pokemon.subSkillNameList.includes('きのみの数S') ? 1 : 0)
    
    if (pokemon.eventBonus) {
      pokemon.berryNum += this.config.simulation.eventBonusTypeBerry;
    }

    // きのみエナジー/手伝い
    pokemon.berryEnergy = Math.max(
      pokemon.base.berry.energy + pokemon.lv - 1,
      pokemon.base.berry.energy * (1.025 ** (pokemon.lv - 1))
    )
    * berryRate / 100
    * this.#berryEnergyWeight

    pokemon.berryEnergyPerHelp = pokemon.berryEnergy * pokemon.berryNum

    // 食材確率
    pokemon.foodRate = pokemon.base.foodRate
      * (
        1
        + (pokemon.subSkillNameList.includes('食材確率アップS') ? 0.18 : 0)
        + (pokemon.subSkillNameList.includes('食材確率アップM') ? 0.36 : 0)
      )
      * (nature?.good == '食材お手伝い確率' ? 1.2 : nature?.weak == '食材お手伝い確率' ? 0.8 : 1)

    // 食材数/手伝い
    pokemon.foodNum = pokemon.foodList.reduce((a, x) => a + x.num, 0) / pokemon.foodList.length;

    // 食材エナジー/手伝い
    pokemon.foodEnergyPerHelp = pokemon.foodList.reduce((a, x) => a + x.energy * x.num, 0)
      / pokemon.foodList.length
      * this.#foodEnergyWeight;

    // きのみor食材エナジー/手伝い
    pokemon.pickupEnergyPerHelp =
      pokemon.berryEnergyPerHelp * (1 - pokemon.foodRate)
      + pokemon.foodEnergyPerHelp * pokemon.foodRate;


    // 最大所持数計算
    pokemon.bag = pokemon.base.bag
      + (pokemon.subSkillNameList.includes('最大所持数アップS') ? 6 : 0)
      + (pokemon.subSkillNameList.includes('最大所持数アップM') ? 12 : 0)
      + (pokemon.subSkillNameList.includes('最大所持数アップL') ? 18 : 0);
    if (pokemon.sleepTime >=  200) pokemon.bag += 1;
    if (pokemon.sleepTime >=  500) pokemon.bag += 2;
    if (pokemon.sleepTime >= 1000) pokemon.bag += 3;
    if (pokemon.sleepTime >= 2000) pokemon.bag += 2;
    if (this.mode != PokemonSimulator.MODE_SELECT && this.config.simulation.campTicket) {
      pokemon.bag *= 1.2;
    }

    // いつ育到達は所持数がいっぱい＋4回(キュー消化分)以降
    pokemon.bagFullHelpNum = Math.max(pokemon.bag / (
      pokemon.berryNum * (1 - pokemon.foodRate)
      + pokemon.foodNum * pokemon.foodRate
    ) + 4, 0);

    // スキルレベル計算
    if (this.mode == PokemonSimulator.MODE_SELECT) {
      pokemon.fixedSkillLv = pokemon.skillLv
        + (pokemon.subSkillNameList.includes('スキルレベルアップS') ? 1 : 0)
        + (pokemon.subSkillNameList.includes('スキルレベルアップM') ? 2 : 0)
    } else {
      pokemon.fixedSkillLv = pokemon.skillLv ?? (
        pokemon.base.evolveLv
        + (pokemon.subSkillNameList.includes('スキルレベルアップS') ? 1 : 0)
        + (pokemon.subSkillNameList.includes('スキルレベルアップM') ? 2 : 0)
      );

      // メインのきのみならメインスキルレベル+1
      if (this.config.simulation.fieldEx 
        && this.config.simulation.fieldExMainBerry == pokemon.base.berry.name
      ) {
        pokemon.fixedSkillLv++;
      }
    }

    if (this.mode != PokemonSimulator.MODE_SELECT && pokemon.eventBonus) {
      pokemon.fixedSkillLv += this.config.simulation.eventBonusTypeSkillLv;
    }
    if (pokemon.fixedSkillLv < 1) pokemon.fixedSkillLv = 1;
    if (pokemon.fixedSkillLv > pokemon.base.skill.effect.length) pokemon.fixedSkillLv = pokemon.base.skill.effect.length;

    // スキル確率
    pokemon.skillRate = pokemon.base.skillRate
      * (
        1
        + (pokemon.subSkillNameList.includes('スキル確率アップS') ? 0.18 : 0)
        + (pokemon.subSkillNameList.includes('スキル確率アップM') ? 0.36 : 0)
      )
      * (nature?.good == 'メインスキル発生確率' ? 1.2 : nature?.weak == 'メインスキル発生確率' ? 0.8 : 1)

    if (this.mode != PokemonSimulator.MODE_SELECT && pokemon.eventBonus) {
      pokemon.skillRate *= this.config.simulation.eventBonusTypeSkillRate;
    }
    if (this.mode != PokemonSimulator.MODE_SELECT && this.config.simulation.fieldEx == 3 && berryMatch) {
      pokemon.skillRate *= 1.25;
    }
    
    if (this.#skillEnergyIgnore && pokemon.base.skill.energyOnly) {
      pokemon.skillRate = 0;
    }

    // 天井を考慮したスキル確率
    pokemon.skillCeil = (pokemon.base.specialty == 'スキル' || pokemon.base.specialty == 'オール') ? 40 * 3600 / pokemon.base.help : 78;
    pokemon.ceilSkillRate =
      pokemon.skillRate > 0
      ? pokemon.skillRate / (1 - Math.pow(1 - pokemon.skillRate, pokemon.skillCeil))
      : 1 / pokemon.skillCeil;

    // 性格のげんき回復係数
    pokemon.natureGenkiMultiplier = (pokemon.nature?.good == 'げんき回復量' ? 1.2 : pokemon.nature?.weak == 'げんき回復量' ? 0.88 : 1)

    return pokemon;
  }

  // チームによって決まる値の計算
  calcStatus(
    pokemon: SimulatedPokemon,
    helpBonus: number,
    genkiHealBonus: number = 0, 
    pokemonList: SimulatedPokemon[] = null
  ) {

    // おてつだい速度短縮量計算
    pokemon.speedBonus = 0;
    if (pokemon.subSkillNameList.includes('おてつだいスピードS')) pokemon.speedBonus += 0.07;
    if (pokemon.subSkillNameList.includes('おてつだいスピードM')) pokemon.speedBonus += 0.14;
    pokemon.speedBonus += helpBonus * 0.05;
    pokemon.speedBonus = Math.min(pokemon.speedBonus, 0.35);

    // おてつだいスピード計算
    pokemon.speed = Math.floor(
      pokemon.base.help
      * (1 - (pokemon.lv - 1) * 0.002)
      * (1 - pokemon.speedBonus)
      * (pokemon.nature?.good == '手伝いスピード' ? 0.9 : pokemon.nature?.weak == '手伝いスピード' ? 1.075 : 1)
      / (this.mode != PokemonSimulator.MODE_SELECT && this.config.simulation.campTicket ? 1.2 : 1)
    );
    if (pokemon.base.remainEvolveLv == 1 && pokemon.sleepTime >=  500) pokemon.speed *= 0.95
    if (pokemon.base.remainEvolveLv == 1 && pokemon.sleepTime >= 2000) pokemon.speed *= 0.88
    if (pokemon.base.remainEvolveLv == 2 && pokemon.sleepTime >=  500) pokemon.speed *= 0.89
    if (pokemon.base.remainEvolveLv == 2 && pokemon.sleepTime >= 2000) pokemon.speed *= 0.75

    // EXモードによるバフ・デバフ
    if (this.mode != PokemonSimulator.MODE_SELECT && this.config.simulation.fieldEx) {

      if(this.config.simulation.fieldExMainBerry == pokemon.base.berry.name) {
        // メインのきのみなら0.9倍
        pokemon.speed *= 0.9;

      } else if(!(
        this.config.simulation.field == 'ワカクサ本島'
          ? this.config.simulation.berryList
          : (Field.map[this.config.simulation.field]?.berryList ?? [])
      )?.includes(pokemon.base.berry.name)) {
        // 好みのきのみでないなら1.15倍

        pokemon.speed *= 1.15;
      }
    }

    // 日中の基本手伝い回数(げんき回復なし)
    let baseDayHelpNum = 0;
    let dayRemainTime = this.#dayLength;

    for(let i = 0; i < 4; i++) {
      if (dayRemainTime > 0) {
        let time = 12000 - pokemon.speed * GENKI_EFFECT[i] / 2 + pokemon.speed * GENKI_EFFECT[i + 1] / 2;
        baseDayHelpNum += Math.min(dayRemainTime, time) / GENKI_EFFECT[i + 1] / pokemon.speed;
        dayRemainTime -= time;
      } else {
        break;
      }
    }
    if (dayRemainTime > 0) {
      baseDayHelpNum += dayRemainTime / pokemon.speed;
    }
    pokemon.baseDayHelpNum = baseDayHelpNum;
    

    // 特定のスキルの場合はチームのスキル一覧に変換
    if (pokemonList) {
      if (pokemon.base.skill.name == 'へんしん(スキルコピー)' || pokemon.base.skill.name == 'ものまね(スキルコピー)') {
        pokemon.skillWeightList = [];
        for(let subPokemon of pokemonList) {
          if (pokemon != subPokemon) {
            if (subPokemon.base.skill.name == '食材セレクトS') {
              // 食材セレクトはコピー先の食材を設定しておく
              pokemon.skillWeightList.push({
                skill: subPokemon.base.skill,
                weight: 1 / 4,
                option: subPokemon.base.foodList.map(x => Food.map[x.name])
              })
              
            } else {
              let list: { skill: SkillType, weight: number }[];
              if (subPokemon.base.skill.name == 'へんしん(スキルコピー)' || subPokemon.base.skill.name == 'ものまね(スキルコピー)') {
                list = [{ skill: Skill.map['エナジーチャージS'], weight: 1 }]
              } else {
                list = subPokemon.skillWeightList
              }
              for(let { skill, weight } of list) {
                const skillWeight = pokemon.skillWeightList.find(x => x.skill == skill)
                if (skillWeight === undefined) {
                  pokemon.skillWeightList.push({ skill, weight: weight / 4 })
                } else {
                  skillWeight.weight += weight / 4;
                }
              }
            }
          }
        }
      }
      
      if (pokemon.base.skill.name == 'ほっぺすりすり(げんきエールS)') {
        pokemon.skillWeightList = [{ skill: pokemon.base.skill, weight: 1 }]
        for(let subPokemon of pokemonList) {
          if (pokemon != subPokemon) {
            for(let { skill, weight } of subPokemon.skillWeightList) {
              pokemon.skillWeightList.push({
                skill,
                weight: weight * (1 - (1 - subPokemon.skillRate) ** pokemon.fixedSkillLv),
                skillLv: subPokemon.fixedSkillLv
              })
            }
          }
        }
      }
    }


    // 起床時の回復量
    pokemon.morningHealGenki = Math.min(
      Math.min(this.config.sleepTime / 8.5, 1) * 100
      * pokemon.natureGenkiMultiplier
      * (1 + genkiHealBonus * 0.14)
      , 100
    )

    // げんき回復系スキル
    if (pokemon.bag > 0) {
      let healSkillList: { skill: SkillType, weight: number }[] = pokemon.skillWeightList.filter(x => x.skill.genki)

      // げんき回復系スキルがあるならその効果の計算
      if (healSkillList.length) {

        // 1回発動あたりの自身の回復量と他ポケモンの回復量を計算
        let selfEffectSum = 0;
        let otherEffectSum = 0;
        for(let { skill, weight } of healSkillList) {
          // マイナスは条件を満たさないと追加効果を発動しない
          if (
            skill.name == 'マイナス(料理パワーアップS)'
            && this.mode == PokemonSimulator.MODE_TEAM
            && pokemonList.filter(x => x.base.skill.name == 'プラス(食材ゲットS)' || x.base.skill.name == 'マイナス(料理パワーアップS)').length < 2
          ) {
            continue;
          }

          const effect = skill.effect[(skill.effect.length >= pokemon.fixedSkillLv ? pokemon.fixedSkillLv : skill.effect.length) - 1];
          selfEffectSum += (effect.self ?? 0) * weight;
          otherEffectSum += (effect.other ?? 0) * weight;
        }
        pokemon.selfHeal = selfEffectSum
        pokemon.otherHeal = otherEffectSum
      }
    }

    return pokemon
  }

  calcHelp(
    pokemon: SimulatedPokemon, 
    modeOption: {
      pokemonList?: SimulatedPokemon[],
      helpBoostCount?: number,
      scoreForHealerEvaluate?: number,
      scoreForSupportEvaluate?: number,
    } = {}, timeCounter = null
  ) {
    let { pokemonList, helpBoostCount, scoreForHealerEvaluate, scoreForSupportEvaluate, } = modeOption;

    pokemon.dayHelpNum   = this.#dayLength / pokemon.speed * pokemon.dayHelpRate;
    pokemon.nightHelpNum = this.#nightLength / pokemon.speed * pokemon.nightHelpRate;

    pokemon.averageHelpRate = (pokemon.dayHelpNum + pokemon.nightHelpNum) / (24 * 3600 / pokemon.speed)

    // 日中の通常手伝い回数(いつ育以外)
    pokemon.normalDayHelpNum =
      Math.min(pokemon.dayHelpNum / (this.config.checkFreq - 1), pokemon.bagFullHelpNum)
      * (this.config.checkFreq - 1);

    // 夜間の通常手伝い回数(いつ育以外)
    pokemon.normalNightHelpNum = Math.min(pokemon.nightHelpNum, pokemon.bagFullHelpNum);

    // 通常手伝い回数
    pokemon.normalHelpNum = pokemon.normalDayHelpNum + pokemon.normalNightHelpNum;

    // いつ育回数
    pokemon.berryHelpNum = Math.max(pokemon.dayHelpNum + pokemon.nightHelpNum - pokemon.normalHelpNum, 0);

    // きのみエナジー/日
    let berryHelpNum = pokemon.normalHelpNum * (1 - pokemon.foodRate) + pokemon.berryHelpNum
    pokemon.berryEnergyPerDay = pokemon.berryEnergyPerHelp * berryHelpNum
    pokemon.berryNumPerDay = pokemon.berryNum * berryHelpNum;
    
    if (this.#expectType.food == 0) {

      // 食材エナジー/日
      let foodGetChance = pokemon.normalHelpNum * pokemon.foodRate;
      pokemon.foodEnergyPerDay = pokemon.foodEnergyPerHelp * foodGetChance;
      pokemon.foodNumPerDay = pokemon.foodNum * foodGetChance;
      
      // 食材の個数
      for(let food of Food.list) {
        pokemon[food.name] = 0;
      }
      for(let food of pokemon.foodList) {
        pokemon[food.name] += Number(food.num) / pokemon.foodList.length * foodGetChance;
      }

    } else {
      // 食材エナジー/日
      pokemon.foodEnergyPerDay = 0;
      pokemon.foodNumPerDay = 0;
      
      // 食材の個数
      Object.assign(pokemon, PokemonSimulator.FOOD_NUM_RESET);
      // for(let food of Food.list) {
      //   pokemon[food.name] = 0;
      // }
      for(const foodProb of pokemon.foodProbList!) {
        const num = this.#probBorder.get(pokemon.foodRate * foodProb.weight, pokemon.normalHelpNum) * foodProb.num
        pokemon.foodEnergyPerDay += num * foodProb.energy;
        pokemon.foodNumPerDay += num;
        pokemon[foodProb.name] += num;
      }
    }
    
    // きのみor食材エナジー/日
    pokemon.pickupEnergyPerDay = pokemon.berryEnergyPerDay + pokemon.foodEnergyPerDay;

    // スキル発動回数の期待値を計算(チェックごとの確率の総和)
    if (pokemon.bag > 0) {
      let daySkillableNum = Math.min(pokemon.dayHelpNum / (this.config.checkFreq - 1), pokemon.bagFullHelpNum);
      let nightSkillableNum = Math.min(pokemon.nightHelpNum, pokemon.bagFullHelpNum);

      if (pokemon.base.specialty == 'スキル' || pokemon.base.specialty == 'オール') {
        let dayNoHit = (1 - pokemon.ceilSkillRate) ** daySkillableNum;
        let dayOneHit = daySkillableNum >= 1 ? (1 - pokemon.ceilSkillRate) ** (daySkillableNum - 1) * pokemon.ceilSkillRate * daySkillableNum : 0;
        let dayTwoHit = daySkillableNum >= 2 ? 1 - dayNoHit - dayOneHit : 0
        let nightNoHit = (1 - pokemon.ceilSkillRate) ** nightSkillableNum;
        let nightOneHit = nightSkillableNum >= 1 ? (1 - pokemon.ceilSkillRate) ** (nightSkillableNum - 1) * pokemon.ceilSkillRate * nightSkillableNum : 0;
        let nightTwoHit = nightSkillableNum >= 2 ? 1 - nightNoHit - nightOneHit : 0

        pokemon.skillPerDay =
          (dayOneHit + dayTwoHit * 2) * (this.config.checkFreq - 1)
          + nightOneHit + nightTwoHit * 2
      } else {
        pokemon.skillPerDay =
          (1 - (1 - pokemon.ceilSkillRate) ** daySkillableNum) * (this.config.checkFreq - 1)
          + (1 - (1 - pokemon.ceilSkillRate) ** Math.min(pokemon.nightHelpNum, pokemon.bagFullHelpNum))
      }
    } else {
      pokemon.skillPerDay = 0;
    }
    
    // スキルエナジー/日
    pokemon.skillEnergy = 0;
    pokemon.shard = 0;
    pokemon.skillEnergyMap = {};

    let totalCookingPowerUpEffect = 0;
    
    for(let { skill, weight, skillLv, option } of pokemon.skillWeightList) {
      if (skillLv == null) {
        skillLv = (skill.effect.length >= pokemon.fixedSkillLv ? pokemon.fixedSkillLv : skill.effect.length) - 1;
      } else {
        skillLv--;
      }
      const effect = skill.effect[skillLv];
      let energyPerSkill = 0;

      let foodGet;
      let foodGetList;
      let cookingPowerUpEffect = 0;
      let cookingChance;

      if (this.mode != PokemonSimulator.MODE_SELECT) {
        weight *= this.config.simulation.skillRate[skill.name]
      }

      switch(skill.name) {
        case 'エナジーチャージS':
        case 'エナジーチャージS(ランダム)':
        case 'エナジーチャージM':
        case 'たくわえる(エナジーチャージS)':
          energyPerSkill = effect;
          break;
            
        case 'ナイトメア(エナジーチャージM)':
          energyPerSkill = effect.energy;
          break;

        case 'ばけのかわ(きのみバースト)':
        case 'きのみバースト': {
          if (this.mode == PokemonSimulator.MODE_ABOUT) {
            energyPerSkill = pokemon.berryEnergy * effect.self
            // 他メンバーのエナジーはあとで計算
            pokemon.burstBonus = effect.other * weight;

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            energyPerSkill = 0
            for(let subPokemon of pokemonList!) {
              energyPerSkill += pokemon.berryEnergy * (pokemon == subPokemon ? effect.self : effect.other);
            }

          } else if (this.mode == PokemonSimulator.MODE_SELECT) {
            energyPerSkill = 
              pokemon.berryEnergy * effect.self
              + Math.max(Berry.map['ヤチェ'].energy + pokemon.lv - 1, Berry.map['ヤチェ'].energy * (1.025 ** (pokemon.lv - 1))) * effect.other * 4;
          }

          if (skill.name == 'ばけのかわ(きのみバースト)') {
            let success = 1 - ((1 - skill.success!) ** pokemon.skillPerDay);
            energyPerSkill *= (success * (pokemon.skillPerDay + 2) + (1 - success) * pokemon.skillPerDay) / pokemon.skillPerDay;
          }

          break;
        }
        
        case 'みかづきのいのり(げんきオールS)': {
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            const { self, other } = effect.team[helpBoostCount! - 1]
            energyPerSkill = 
              pokemon.berryEnergy * self
              + Math.max(Berry.map['マゴ'].energy + pokemon.lv - 1, Berry.map['マゴ'].energy * (1.025 ** (pokemon.lv - 1))) * other * 4;

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            const { self, other } = effect.team.at(-1)
            energyPerSkill = pokemon.berryEnergy * self
            // 他メンバーのエナジーはあとで計算
            pokemon.burstBonus = other;

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            const { self, other } = effect.team[helpBoostCount! - 1]
            energyPerSkill = 0
            for(let subPokemon of pokemonList!) {
              energyPerSkill += pokemon.berryEnergy * (pokemon == subPokemon ? self : other);
            }
          }

          break;
        }

        case 'おてつだいサポートS':
        case 'おてつだいブースト':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            energyPerSkill = scoreForSupportEvaluate! * (skill.name == 'おてつだいブースト' ? effect.max * 5 : effect);

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            // あとで概算値計算

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            // チームが分かっている時はここで獲得エナジーと食材の期待値計算
            let helpCount;
            if (skill.name == 'おてつだいサポートS') {
              helpCount = effect / 5;
            }
            if (skill.name == 'おてつだいブースト') {
              helpCount = effect.fix;
              helpCount += effect.team[helpBoostCount! - 1]
            }

            energyPerSkill = 0;
            for(let subPokemon of pokemonList!) {
              energyPerSkill += subPokemon.berryEnergyPerHelp * helpCount * (1 - subPokemon.foodRate);
              for(let food of subPokemon.foodList) {
                pokemon[food.name] = (pokemon[food.name] ?? 0) + food.num / subPokemon.foodList.length * helpCount * subPokemon.foodRate * pokemon.skillPerDay * weight;
              }
            }
            
          }
          break;

        case '食材ゲットS':
          foodGet = effect;
          foodGetList = Food.list;
          break;

        case 'プレゼント(食材ゲットS)':
          foodGet = effect;
          foodGetList = Food.list;
          break;

        case 'ビルドアップ(料理アシストS)':
          foodGet = effect.main;
          foodGetList = Food.list;

          cookingChance = effect.sub;
          break;

        case 'プラス(食材ゲットS)':
          foodGet = effect.main;
          foodGetList = Food.list;
          const food = Food.map[pokemon.foodList[0].name];
          
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            // 厳選モードならその食材をフル活用する想定で計算
            energyPerSkill = food.energy * food.bestRate * Cooking.maxRecipeBonus * effect.sub;

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            if (this.#foodEnergyWeight > 0) {
              // 概算モードなら食材数と概算エナジーを計算
              let num = effect.sub * pokemon.skillPerDay * weight;
              pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num;                   // 1日あたりの食材数
              energyPerSkill = this.foodEnergyMap[food.name].max * effect.sub * this.#foodEnergyWeight; // 1回あたりのエナジー
            }

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            // チームモードの時は条件を満たしているかチェック
            if (pokemonList.filter(x => x.base.skill.name == 'プラス(食材ゲットS)' || x.base.skill.name == 'マイナス(料理パワーアップS)').length >= 2) {
              let num = effect.sub * pokemon.skillPerDay * weight;
              pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num;
            }
          }

          break;

        case '食材セレクトS':
        case 'かいりきバサミ(食材セレクトS)':
        case 'きょううん(食材セレクトS)':
          if (skill.name == 'きょううん(食材セレクトS)') {
            pokemon.shard += effect.shard * pokemon.skillPerDay * weight;
          }

          const foodList: FoodType[] = option ?? skill.foodList ?? pokemon.base.foodList.map(x => Food.map[x.name])
          foodGet = effect.food;
          foodGetList = foodList;

          // if (this.mode == PokemonSimulator.MODE_SELECT) {
          //   energyPerSkill = foodList.reduce((a, food) =>
          //     a + food.energy * (
          //       (food.bestRate * Cooking.maxRecipeBonus - 1) * this.config.selectEvaluate.specialty[pokemon.base.specialty].foodGetRate / 100 + 1
          //     )
          //     , 0
          //   ) / foodList.length * effect.food;

          // } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
          //   if (this.#foodEnergyWeight > 0) {
          //     let num = effect.food / foodList.length * pokemon.skillPerDay * weight;
          //     let foodEnergy = 0;
          //     for(let food of foodList) {
          //       pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num;
          //       foodEnergy += this.foodEnergyMap[food.name].max
          //     }

          //     energyPerSkill = foodEnergy / foodList.length * num * this.#foodEnergyWeight;
          //   }

          // } else if (this.mode == PokemonSimulator.MODE_TEAM) {
          //   if (!this.config.simulation.sundayPrepare) {
          //     let num = effect.food / foodList.length * pokemon.skillPerDay * weight;
          //     for(let food of foodList) {
          //       pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num;
          //     }
          //   }
          // }
          break;

        case 'ゆめのかけらゲットS':
        case 'ゆめのかけらゲットS(ランダム)':
          pokemon.shard += effect * pokemon.skillPerDay * weight;
          break;

        case '料理パワーアップS':
          cookingPowerUpEffect = effect;
          break;

        case 'マイナス(料理パワーアップS)':
          cookingPowerUpEffect = effect.main;
          break;

        case '料理チャンスS':
          cookingChance = effect;
          break;

        case 'へんしん(スキルコピー)':
        case 'ものまね(スキルコピー)':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            energyPerSkill = this.config.selectEvaluate.skillEnergy[skill.name][skillLv] ?? skill.evaluateEnergy![skillLv];

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            energyPerSkill = this.config.selectEvaluate.skillEnergy[skill.name][skillLv] ?? skill.evaluateEnergy![skillLv];

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            // スキルコピーがスキルコピーをコピーした場合はエナジーチャージS相当(公式)
            energyPerSkill = Skill.map['エナジーチャージS'].effect[skillLv]
          }
          break;

        case 'ほっぺすりすり(げんきエールS)':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            energyPerSkill = this.config.selectEvaluate.skillEnergy[skill.name][skillLv] ?? skill.evaluateEnergy![skillLv];

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            energyPerSkill = this.config.selectEvaluate.skillEnergy[skill.name][skillLv] ?? skill.evaluateEnergy![skillLv];

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            // スキルコピーと同様の仕組みで計算
          }

        case 'げんきオールS':
        case 'きのみジュース(げんきオールS)':
        case 'げんきエールS':
        case 'げんきチャージS':
        case 'つきのひかり(げんきチャージS)':
          // 別の場所で計算
          break;
        
        default:
          throw `未実装のスキル: ${skill.name}`
      }
      
      // 食材ゲットの処理
      if (foodGet && foodGetList != null) {
        if (this.mode == PokemonSimulator.MODE_SELECT) {
          let num = foodGet / foodGetList.length * pokemon.skillPerDay * weight;

          let foodEnergy = 0;
          for(let food of foodGetList) {
            pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num;
            foodEnergy += food.energy * (
             (food.bestRate * Cooking.maxRecipeBonus - 1)
             * this.config.selectEvaluate.specialty[pokemon.base.specialty].foodGetRate / 100
             + 1
            )
          }
          energyPerSkill += foodEnergy / foodGetList.length * foodGet

        } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
          if (this.#foodEnergyWeight > 0) {
            let num = foodGet / foodGetList.length * pokemon.skillPerDay * weight;
            let foodEnergy = 0;
            for(let food of foodGetList) {
              pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num;
              foodEnergy += this.foodEnergyMap[food.name].max
            }

            energyPerSkill += foodEnergy / foodGetList.length * foodGet * this.#foodEnergyWeight;
          }

        } else if (this.mode == PokemonSimulator.MODE_TEAM) {
          if (!this.config.simulation.sundayPrepare) {
            let num = foodGet / foodGetList.length * pokemon.skillPerDay * weight;
            for(let food of foodGetList) {
              pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num;
            }
          }
        }
      }

      // 料理パワーアップの処理
      if (cookingPowerUpEffect) {
        const cookingPowerUpEffectNum = pokemon.skillPerDay * weight;
        const oneCookingPowerUpEffect = cookingPowerUpEffect;

        let thisEnergyPerSkill = 0;
        
        if (this.mode == PokemonSimulator.MODE_SELECT) {
          // 鍋拡張の意味がある幅を計算
          let limit = Cooking.maxFoodNum - Cooking.potMax;
          
          // 3回のなべのサイズを計算
          let minValues = Math.floor(cookingPowerUpEffectNum / 3);
          let skillPerDay = cookingPowerUpEffectNum - minValues * 3;
          for(let i = 0; i < 3; i++) {
            let addPotSize;
            if (skillPerDay >= 1) {
              addPotSize = (minValues + 1) * oneCookingPowerUpEffect
              skillPerDay -= 1;
            } else {
              addPotSize = (minValues + skillPerDay) * oneCookingPowerUpEffect
              skillPerDay = 0;
            }

            // 拡張して意味がある範囲の増分エナジーを計算
            thisEnergyPerSkill += Cooking.cookingPowerUpEnergy * Math.min(addPotSize, limit)
            
            // 余剰は食材の平均エナジーで計算
            if (addPotSize > limit) {
              thisEnergyPerSkill += (addPotSize - limit) * Food.averageEnergy;
            }
          }

        } else if (this.mode == PokemonSimulator.MODE_ABOUT) {

          // 3回のなべのサイズを計算
          let minValues = Math.floor(cookingPowerUpEffectNum / 3);
          let skillPerDay = cookingPowerUpEffectNum - minValues * 3;
          for(let i = 0; i < 3; i++) {
            let addPotSize;
            if (skillPerDay >= 1) {
              addPotSize = (minValues + 1) * oneCookingPowerUpEffect
              skillPerDay -= 1;
            } else {
              addPotSize = (minValues + skillPerDay) * oneCookingPowerUpEffect
              skillPerDay = 0;
            }
            
            // 拡張後と拡張前で出来る料理の差を計算
            let afterPotSize = Math.round(
              (this.config.simulation.potSize + addPotSize)
              * (this.config.simulation.campTicket ? 1.5 : 1)
            );

            let afterBestCooking = this.cookingList.filter(cooking => cooking.foodNum <= afterPotSize)
              .map(cooking => ({
                ...cooking,
                lastEnergy: cooking.fixEnergy + (afterPotSize - cooking.foodNum) * Food.averageEnergy,
              }))
              .sort((a, b) => b.lastEnergy - a.lastEnergy)[0];

            if (afterBestCooking) {
              thisEnergyPerSkill += (afterBestCooking.lastEnergy - this.#defaultBestCooking.lastEnergy) * this.config.simulation.cookingWeight;
            }
          }

        } else if (this.mode == PokemonSimulator.MODE_TEAM) {
          // 効果量だけ記憶しておく
          totalCookingPowerUpEffect += cookingPowerUpEffect;
        }
        
        // 1回あたりの量に均す
        energyPerSkill += thisEnergyPerSkill / cookingPowerUpEffectNum;
      }

      // 料理チャンスの処理
      if (cookingChance) {
        if (this.mode == PokemonSimulator.MODE_SELECT) {
          let totalEffect = cookingChance / 100 * pokemon.skillPerDay * weight * 7;
          energyPerSkill += (Cooking.getChanceWeekEffect(totalEffect).total - 24.6) / 7 * Cooking.maxEnergy / pokemon.skillPerDay / weight;

        } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
          if (!this.config.simulation.sundayPrepare) {
            // チームシミュレーションの際は後で正確に評価、そうでなければ概算評価する
            if (pokemon.skillPerDay) {
              let totalEffect = cookingChance / 100 * pokemon.skillPerDay * weight * 7;
              energyPerSkill += (Cooking.getChanceWeekEffect(totalEffect).total - 24.6) / 7 * this.#defaultBestCooking.lastEnergy / pokemon.skillPerDay * this.config.simulation.cookingWeight / weight
            }
          }

        } else if (this.mode == PokemonSimulator.MODE_TEAM) {
          if (!this.config.simulation.sundayPrepare) {
            // 効果量だけ記憶しておく
            pokemon.cookingChanceEffect = cookingChance / 100 * pokemon.skillPerDay * weight;
          }
        }
      }
      
      if (energyPerSkill) {
        energyPerSkill *= weight;
        pokemon.skillEnergyMap[skill.name] = energyPerSkill;
        pokemon.skillEnergy += energyPerSkill;
      }
    }
    pokemon.cookingPowerUpEffect = totalCookingPowerUpEffect;

    // チーム全体のげんき回復による増加エナジーを計算
    if (pokemon.otherHeal > 0 && this.mode == PokemonSimulator.MODE_SELECT) {

      let helpRate = this.#helpRate.getHelpRate(pokemon.otherHealList)

      // 一番つよいポケモンが4匹いるとして、それらのげんきオールによる増分を効果とする
      const energy =
        scoreForHealerEvaluate
        * (
          (helpRate.day * (24 - this.config.sleepTime) + helpRate.night * this.config.sleepTime)
          / (this.defaultHelpRate.day * (24 - this.config.sleepTime) + this.defaultHelpRate.night * this.config.sleepTime)
          - 1
        )
        * 4
        / pokemon.skillPerDay;
        
      pokemon.skillEnergyMap[pokemon.base.skill.name] = (pokemon.skillEnergyMap[pokemon.base.skill.name] ?? 0) + energy;
      pokemon.skillEnergy += energy;
    }

    pokemon.skillEnergyPerDay = pokemon.skillEnergy * pokemon.skillPerDay;

    // ここまでの概算日給
    pokemon.energyPerDay = pokemon.pickupEnergyPerDay + pokemon.skillEnergyPerDay;

    return pokemon;
  }

  calcTeamHeal(pokemonList: SimulatedPokemon[]) {
    this.#helpRate.calcTeamHeal(pokemonList, this.#addHeal)
  }

  getHelpRate(healList: { effect: number; time: number; night?: boolean; }[]) {
    return this.#helpRate.getHelpRate(healList);
  }

  // AAAの情報を2個得る確率と追加で3個得る確率、更に追加で2個得る確率、といった形に変換する
  calcFoodProbList(foodList) {
    let foodProbList = [];
    for(let { name, num, energy } of foodList) {
      for(let foodProb of foodProbList) {
        if (foodProb.name == name) {
          num -= foodProb.num;
          foodProb.weight += 1 / foodList.length;
        }
      }
      foodProbList.push({ name, num, energy, weight: 1 / foodList.length })
    }
    return foodProbList;
  }

  // 厳選用評価
  selectEvaluate(
    pokemon: SimulatedPokemon,
    subSkillList: SubSkillType[],
    nature: NatureType,
    scoreForHealerEvaluate, scoreForSupportEvaluate, timeCounter = null
  ): SimulatedPokemon {

    // timeCounter?.start('calcParameter')
    this.calcParameter(
      pokemon,
      subSkillList,
      nature,
      this.config.selectEvaluate.specialty[pokemon.base.specialty].berryEnergyRate,
    )
    // timeCounter?.stop('calcParameter')

    // timeCounter?.start('calcStatus')
    this.calcStatus(
      pokemon,
      this.config.selectEvaluate.teamHelpBonus + (pokemon.subSkillNameList.includes('おてつだいボーナス') ? 1 : 0),
      pokemon.subSkillNameList.includes('げんき回復ボーナス') ? 1 : 0,
    )
    // timeCounter?.stop('calcStatus')

    this.calcTeamHeal([pokemon])

    // timeCounter?.start('calcHelp')
    this.calcHelp(
      pokemon,
      // pokemon.otherMorningHealEffect,
      // pokemon.otherDayHealEffect || (pokemon.selfDayHealEffect ? 0 : this.config.selectEvaluate.healer / 100),
      {
        scoreForHealerEvaluate,
        scoreForSupportEvaluate,
        helpBoostCount: 5,
      },
      timeCounter
    )

    // おてボの残り評価はシンプルに倍率にする
    if (pokemon.subSkillNameList.includes('おてつだいボーナス')) {
      // おてスピ補正なしの自分のスコアを計算
      pokemon.energyPerDay *= 
        (1 - pokemon.speedBonus) * (
        1 / (1 - this.config.selectEvaluate.teamHelpBonus * 0.05 - 0.05)
        - 1 / (1 - this.config.selectEvaluate.teamHelpBonus * 0.05)
        )
        * 4 + 1
    }

    // timeCounter?.stop('calcHelp')

    return pokemon;
  }

  selectEvaluateToScore(pokemon: SimulatedPokemon, yumebo: boolean, risabo: boolean) {
    let score = pokemon.energyPerDay;

    if (yumebo) {
      score *= 1 + 0.06 * this.config.selectEvaluate.shardBonus / 100;
    }
    if (risabo) {
      score *= 1 + 0.09 * this.config.selectEvaluate.shardBonus / 100 / 2;
    }

    score += pokemon.shard * this.config.selectEvaluate.shardEnergy * this.config.selectEvaluate.shardBonus / 100;

    return score;
  }

  dump() {
    this.#helpRate.dump();
  }
}

export default PokemonSimulator;
