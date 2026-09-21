import HelpRate from '../help-rate';

import Pokemon from "../../data/pokemon";
import Exp from "../../data/exp.ts";
import Skill from "../../data/skill";
import { Food, Cooking } from "../../data/food_and_cooking";
import Nature from "../../data/nature";
import Field, { type ExBuff, type FieldItem } from '../../data/field.ts';
import Berry from '../../data/berry';
import SubSkill from '../../data/sub-skill';
import { getPokemonEvaluateSetting } from '../evaluate-setting';
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
  #bestCookingCache = new Map<number, BestCookingType>();
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
  #cookingPowerUpEnergy = 0;

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
    this.#defaultBestCooking = this.#getBestCooking(this.#fixedPotSize);

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

    // 料理パワーアップのエナジー評価
    this.#cookingPowerUpEnergy = (
      config.selectEvaluate.cookingPowerUpType == 0 ? Cooking.cookingPowerUpEnergy
      : Cooking.cookingPowerUpEnergyAverage
    ) * config.selectEvaluate.cookingPowerUpRate / 100;

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
      bEpH: 0,
      foodRate: 0,
      foodNum: 0,
      fEpH: 0,
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
      bEpD: 0,
      berryNumPerDay: 0,
      fEpD: 0,
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

  #getBestCooking(potSize: number): BestCookingType {
    const cacheKey = Math.round(potSize);
    const cached = this.#bestCookingCache.get(cacheKey);
    if (cached) return cached;

    const bestCooking = this.cookingList
      .filter(cooking => cooking.foodNum <= potSize)
      .map(cooking => ({
        ...cooking,
        lastEnergy: cooking.fixEnergy + (potSize - cooking.foodNum) * Food.averageEnergy,
      }))
      .sort((a, b) => b.lastEnergy - a.lastEnergy)[0];

    this.#bestCookingCache.set(cacheKey, bestCooking);
    return bestCooking;
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
    if (lv >= 10) enableSubSkillLength++;
    if (lv >= 25) enableSubSkillLength++;
    if (lv >= 50) enableSubSkillLength++;
    if (lv >= 70) enableSubSkillLength++;
    if (lv >= 80) enableSubSkillLength++;
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
    const field = Field.map[this.config.simulation.field];
    const berryMatch = ((field.berryOptionList
      ? this.config.simulation.berryList
      : field?.berryList) ?? []).includes(base.berry.name);
    let berryRate = berryMatch
      ? (field.ex && this.config.simulation.fieldEx == 1 ? 240 : 200)
      : 100;
    
    let skillLv = box.skillLv;
    if (fixable) {
      // 厳選設定のスキルレベルまで
      if (this.config.simulation.fixSkillSeed === 1) {
        let skillLvSetting = getPokemonEvaluateSetting(this.config.selectEvaluate, base).skillLv;
        if (skillLvSetting.type == 1) {
          skillLv = base.evolveLv;
        }
        if (skillLvSetting.type == 2) {
          skillLv = base.skill.effect.length;
        }
        if (skillLvSetting.type == 3) {
          skillLv = skillLvSetting.lv;
        }
      }
      // 最大まで
      if (this.config.simulation.fixSkillSeed === 2) {
        skillLv = base.skill.effect.length;
      }
    }

    const pokemon = this.initSimulatedPokemon(
      base,
      lv,
      box.foodList,
      skillLv,
      this.config.simulation.eventBonusList.filter(eventBonus =>
        eventBonus.target.types[base.type]
          || eventBonus.target.specialties[base.specialty]
          || (
            base.specialty == 'オール' && (
              eventBonus.target.specialties['きのみ']
              || eventBonus.target.specialties['食材']
              || eventBonus.target.specialties['スキル']
            )
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
    let skillLvSetting = getPokemonEvaluateSetting(this.config.selectEvaluate, basePokemon).skillLv;
    let skillLv: number = 1;
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
      [],
      this.config.selectEvaluate.pokemonSleepTime,
    )
  }

  initSimulatedPokemon(
    base: PokemonType,
    lv: number,
    foodNameList: string[],
    skillLv: number,
    eventBonusList: EventBonus[] = [],
    sleepTime: number,
    useCandy: number = 0,
    useShard: number = 0,
    berryMatch: boolean = false
  ): SimulatedPokemon {
    const firstFoodEnergy = Food.map[foodNameList[0]].energy * ((base.specialty == '食材' || base.specialty == 'オール') ? 2 : 1)

    const pokemon: SimulatedPokemon = {
      ...this.#simulatedDefaultPokemon,
      foodList: [],
      foodProbList: [],
      subSkillNameList: [],
      skillWeightList: [],
      selfHealList: [],
      otherHealList: [],
      skillEnergyMap: {},
      evaluateResult: {},
      base,
      skillLv: skillLv,
      lv: lv,
      eventBonusList,
      sleepTime,
      useCandy,
      useShard,
    }

    let foodUnlock = lv >= 60 ? 3 : lv >= 30 ? 2 : 1;

    const field = Field.map[this.config.simulation.field];

    for(let index = 0; index < Math.min(foodNameList.length, foodUnlock); index++) {
      const name = foodNameList[index];
      if (!name) continue;
      const food = Food.map[name];
      if (food == null) throw `${pokemon.base.name}:不正な食べ物(${name})`
      let num = Math.round(firstFoodEnergy * [1, 2.25, 3.6][index] / food.energy);
      let baseNum = num;
      num += eventBonusList.reduce((total, eventBonus) => total + eventBonus.food, 0);

      // EXモードの食材+1
      if (
        this.mode != PokemonSimulator.MODE_SELECT
        && field.ex && this.config.simulation.fieldEx == 2
        && berryMatch
      ) {
        num += 1;
        if (pokemon.base.specialty == '食材') {
          num += 0.5;
        }
      }

      const foodUseRate = this.mode == PokemonSimulatorMode.SELECT
        ? getPokemonEvaluateSetting(this.config.selectEvaluate, base).foodEnergyRate / 100
        : 1

      pokemon.foodList.push({
        name: food.name,
        num,
        baseNum,
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

    // EXモードによるおてつだいスピードのバフ・デバフ
    const field = Field.map[this.config.simulation.field] ?? Field.list[0];
    let exBuff: ExBuff | undefined;
    if (this.mode != PokemonSimulator.MODE_SELECT && field.ex) {
      if(this.config.simulation.berryList[0] == pokemon.base.berry.name) {
        exBuff = field.exBuff?.match;
      } else if(!this.config.simulation.berryList?.includes(pokemon.base.berry.name)) {
        exBuff = field.exBuff?.notMatch;
      }
    }

    // きのみエナジー/手伝い
    // 個別きのみ設定は、概算・チームシミュレーションでのみフィールド倍率の後に適用する。
    const berryEnergyRate =
      this.mode === PokemonSimulatorMode.ABOUT || this.mode === PokemonSimulatorMode.TEAM
        ? (this.config.simulation.berryEnergyRate?.[pokemon.base.berry.name] ?? 1)
        : 1;
    pokemon.berryEnergy = Math.max(
      pokemon.base.berry.energy + pokemon.lv - 1,
      pokemon.base.berry.energy * (1.025 ** (pokemon.lv - 1))
    )
    * berryRate / 100
    * berryEnergyRate
    * this.#berryEnergyWeight
    pokemon.berryRate = berryRate;

    // きのみの個数
    pokemon.berryNum = ((pokemon.base.specialty == 'きのみ' || pokemon.base.specialty == 'オール') ? 2 : 1)
      + (pokemon.subSkillNameList.includes('きのみの数S') ? 1 : 0)
    
    // おてつだいサポート用のきのみエナジー/手伝い(イベントボーナス加算前に計算)
    let berryEnergyPerHelpForSupport = pokemon.berryEnergy * pokemon.berryNum
    
    pokemon.berryNum += pokemon.eventBonusList.reduce((total, eventBonus) => total + eventBonus.berry, 0);

    pokemon.bEpH4Spt = berryEnergyPerHelpForSupport
    pokemon.bEpH = pokemon.berryEnergy * pokemon.berryNum

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
    pokemon.fEpH = pokemon.foodList.reduce((a, x) => a + x.energy * x.num, 0)
      / pokemon.foodList.length
      * this.#foodEnergyWeight;

    // おてつだいサポート用の食材エナジー/手伝い(イベントボーナス抜きで計算)
    let foodEnergyPerHelpForSupport = pokemon.foodList.reduce((a, x) => a + x.energy * x.baseNum, 0)
      / pokemon.foodList.length
      * this.#foodEnergyWeight;

    // きのみor食材エナジー/手伝い
    pokemon.pickupEnergyPerHelp =
      berryEnergyPerHelpForSupport * (1 - pokemon.foodRate)
      + foodEnergyPerHelpForSupport * pokemon.foodRate;


    // 最大所持数計算
    pokemon.bag = pokemon.base.bag
      + (pokemon.subSkillNameList.includes('最大所持数アップS') ? 6 : 0)
      + (pokemon.subSkillNameList.includes('最大所持数アップM') ? 12 : 0)
      + (pokemon.subSkillNameList.includes('最大所持数アップL') ? 18 : 0);
    if (pokemon.sleepTime >=  200) pokemon.bag += 1;
    if (pokemon.sleepTime >=  500) pokemon.bag += 2;
    if (pokemon.sleepTime >= 1000) pokemon.bag += 3;
    if (pokemon.sleepTime >= 2000) pokemon.bag += 2;
    if (this.mode != PokemonSimulator.MODE_SELECT) {
      pokemon.bag += pokemon.eventBonusList.reduce((total, eventBonus) => total + eventBonus.bag, 0);
      pokemon.bag *= pokemon.eventBonusList.reduce((total, eventBonus) => total * eventBonus.bagRate, 1);
    }
    if (this.mode != PokemonSimulator.MODE_SELECT && this.config.simulation.campTicket) {
      pokemon.bag = Math.floor(pokemon.bag * 1.2);
    }
    if (exBuff?.bag) {
      pokemon.bag += exBuff.bag;
    }
    pokemon.bag = Math.ceil(pokemon.bag);

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

      // EXモードによるスキルレベルのバフ・デバフ
      if (exBuff?.skillLv) {
        pokemon.fixedSkillLv += exBuff?.skillLv;
      }
    }

    if (this.mode != PokemonSimulator.MODE_SELECT) {
      pokemon.fixedSkillLv += pokemon.eventBonusList.reduce((total, eventBonus) => total + eventBonus.skillLv, 0);
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

    if (this.mode != PokemonSimulator.MODE_SELECT) {
      pokemon.skillRate *= pokemon.eventBonusList.reduce((total, eventBonus) => total * eventBonus.skillRate, 1);
    }
    if (
      this.mode != PokemonSimulator.MODE_SELECT
      && field.ex
      && this.config.simulation.fieldEx == 3
      && berryMatch
    ) {
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
      : 0;

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

    // EXモードによるおてつだいスピードのバフ・デバフ
    const field = Field.map[this.config.simulation.field] ?? Field.list[0];
    if (this.mode != PokemonSimulator.MODE_SELECT && field.ex) {
      let buff = null;
      if(this.config.simulation.berryList[0] == pokemon.base.berry.name) {
        buff = field.exBuff?.match?.speed;
      } else if(!this.config.simulation.berryList?.includes(pokemon.base.berry.name)) {
        buff = field.exBuff?.notMatch?.speed;
      }
      if (buff) {
        pokemon.speed *= buff;
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

      // スキルコピー
      if (pokemon.base.skill.name == 'へんしん(スキルコピー)' || pokemon.base.skill.name == 'ものまね(スキルコピー)') {
        pokemon.skillWeightList = [];

        // コピー対象から自分とナイトメアを除く
        for(let subPokemon of pokemonList) {
          if (pokemon != subPokemon) {
            let list: { skill: SkillType, weight: number }[];

            // コピーできないスキルはエナチャSに変換
            if (!subPokemon.base.skill.copyable) {
              list = [{ skill: Skill.map['エナジーチャージS'], weight: 1 }]
            } else {
              list = subPokemon.skillWeightList
            }
            for(let { skill, weight } of list) {
              pokemon.skillWeightList.push({
                skill,
                weight: weight / 4,
                copy: subPokemon
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

  // チーム確定後のげんき補正を使い、ほっぺすりすりによる追加分を含まない通常のスキル発動回数を求める。
  // チームシミュレーター側で先に通常回数を揃えることで、トゲデマル同士の相互再発動を計算順に依存せず近似できる。
  calcSkillPerDay(pokemon: SimulatedPokemon) {
    // チーム内の回復効果まで反映済みの速度・おてつだい倍率から、昼と睡眠中のおてつだい回数を求める。
    const dayHelpNum = this.#dayLength / pokemon.speed * pokemon.dayHelpRate;
    const nightHelpNum = this.#nightLength / pokemon.speed * pokemon.nightHelpRate;

    // 所持上限がない場合はスキル抽選が発生しないため、発動回数を0として扱う。
    if (pokemon.bag <= 0) return 0;

    // 昼は確認間隔、夜は睡眠時間を基にしつつ、所持上限に達するまでの回数を抽選可能回数の上限にする。
    const daySkillableNum = Math.min(dayHelpNum / (this.config.checkFreq - 1), pokemon.bagFullHelpNum);
    const nightSkillableNum = Math.min(nightHelpNum, pokemon.bagFullHelpNum);

    if (pokemon.base.specialty == 'スキル' || pokemon.base.specialty == 'オール') {
      // スキルとくいは最大2回分を持ち越せるため、睡眠中に0回・1回・2回発動可能になる確率を分けて求める。
      const nightNoHit = (1 - pokemon.ceilSkillRate) ** nightSkillableNum;
      const nightOneHit = nightSkillableNum >= 1 ? (1 - pokemon.ceilSkillRate) ** (nightSkillableNum - 1) * pokemon.ceilSkillRate * nightSkillableNum : 0;
      const nightTwoHit = nightSkillableNum >= 2 ? 1 - nightNoHit - nightOneHit : 0;

      if (this.#expectType[pokemon.base.skill.name] == 0) {
        // 通常の期待値計算では、昼も0回・1回・2回発動する確率から1日分の回数を合算する。
        const dayNoHit = (1 - pokemon.ceilSkillRate) ** daySkillableNum;
        const dayOneHit = daySkillableNum >= 1 ? (1 - pokemon.ceilSkillRate) ** (daySkillableNum - 1) * pokemon.ceilSkillRate * daySkillableNum : 0;
        const dayTwoHit = daySkillableNum >= 2 ? 1 - dayNoHit - dayOneHit : 0;

        return (dayOneHit + dayTwoHit * 2) * (this.config.checkFreq - 1)
          + nightOneHit + nightTwoHit * 2;
      }

      // 下振れ基準では昼の発動回数を確率境界から求め、睡眠中の期待回数と合算する。
      return this.#probBorder.skill(pokemon.ceilSkillRate, daySkillableNum, this.config.checkFreq - 1, 2)
        + nightOneHit + nightTwoHit * 2;
    }

    if (this.#expectType[pokemon.base.skill.name] == 0) {
      // スキルとくい以外は1回まで持ち越す前提で、昼と睡眠中に1回以上当たる確率を合算する。
      return (1 - (1 - pokemon.ceilSkillRate) ** daySkillableNum) * (this.config.checkFreq - 1)
        + (1 - (1 - pokemon.ceilSkillRate) ** nightSkillableNum);
    }

    // 下振れ基準でも持ち越し上限は1回とし、昼の確率境界と睡眠中に1回以上当たる確率を合算する。
    return this.#probBorder.skill(pokemon.ceilSkillRate, daySkillableNum, this.config.checkFreq - 1, 1)
      + (1 - (1 - pokemon.ceilSkillRate) ** nightSkillableNum);
  }

  calcHelp(
    pokemon: SimulatedPokemon, 
    modeOption: {
      pokemonList?: SimulatedPokemon[],
      boxPokemonList?: PokemonBoxType[],
      helpBoostCount?: number,
      scoreForHealerEvaluate?: number,
      scoreForSupportEvaluate?: number,
      // ほっぺすりすりによって、このポケモンのスキルが追加で発動する1日あたりの期待回数。
      additionalSkillPerDay?: number,
    } = {}, timeCounter = null
  ) {
    let {
      pokemonList, helpBoostCount, scoreForHealerEvaluate, scoreForSupportEvaluate,
      additionalSkillPerDay = 0,
      boxPokemonList = [],
    } = modeOption;

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
    pokemon.bEpD = pokemon.bEpH * berryHelpNum
    pokemon.berryNumPerDay = pokemon.berryNum * berryHelpNum;
    
    if (this.#expectType.food == 0) {

      // 食材エナジー/日
      let foodGetChance = pokemon.normalHelpNum * pokemon.foodRate;
      pokemon.fEpD = pokemon.fEpH * foodGetChance;
      pokemon.foodNumPerDay = pokemon.foodNum * foodGetChance;
      
      // 食材の個数
      Object.assign(pokemon, PokemonSimulator.FOOD_NUM_RESET);
      for(let food of pokemon.foodList) {
        pokemon[food.name] += Number(food.num) / pokemon.foodList.length * foodGetChance;
      }

    } else {
      // 食材エナジー/日
      pokemon.fEpD = 0;
      pokemon.foodNumPerDay = 0;
      
      // 食材の個数
      Object.assign(pokemon, PokemonSimulator.FOOD_NUM_RESET);
      for(const foodProb of pokemon.foodProbList!) {
        const num = this.#probBorder.get(pokemon.foodRate * foodProb.weight, pokemon.normalHelpNum) * foodProb.num
        pokemon.fEpD += num * foodProb.energy;
        pokemon.foodNumPerDay += num;
        pokemon[foodProb.name] += num;
      }
    }
    
    // きのみor食材エナジー/日
    pokemon.pickupEnergyPerDay = pokemon.bEpD + pokemon.fEpD;

    // 通常発動回数に追加分を合算し、対象ポケモン自身の既存スキル効果計算へそのまま反映する。
    pokemon.skillPerDay = this.calcSkillPerDay(pokemon) + additionalSkillPerDay;
    
    // スキルエナジー/日
    pokemon.skillEnergy = 0;
    pokemon.shard = 0;
    pokemon.skillEnergyMap = {};

    let totalCookingPowerUpEffect = 0;
    
    for(let { skill, weight, skillLv, copy } of pokemon.skillWeightList) {
      const executor = pokemon;

      if (skillLv == null) {
        skillLv = (skill.effect.length >= executor.fixedSkillLv ? executor.fixedSkillLv : skill.effect.length) - 1;
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
          energyPerSkill = effect;
          break;

        case 'たくわえる(エナジーチャージS)':
          // スキルコピーやゆびをふるの場合はたくわえない
          if (copy || executor.base.skill.name === 'ゆびをふる') {
            energyPerSkill = effect.base;
          } else {
            energyPerSkill = effect.expect;
          }
          break;
            
        case 'ナイトメア(エナジーチャージM)':
          energyPerSkill = effect.energy;
          break;

        case 'ばけのかわ(きのみバースト)':
        case 'きのみバースト': {
          if (this.mode == PokemonSimulator.MODE_ABOUT) {
            energyPerSkill = executor.berryEnergy
              * effect.self
              * this.config.simulation.eventBonus.skill.berryBurst

            // 他メンバーのエナジーはあとで計算
            executor.burstBonus = effect.other
              * weight
              * this.config.simulation.eventBonus.skill.berryBurst;

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            energyPerSkill = 0
            for(let subPokemon of pokemonList!) {
              energyPerSkill += executor.berryEnergy
                * (executor == subPokemon ? effect.self : effect.other)
                * this.config.simulation.eventBonus.skill.berryBurst;
            }

          } else if (this.mode == PokemonSimulator.MODE_SELECT) {
            energyPerSkill = 
              executor.berryEnergy * effect.self
              + Math.max(Berry.map['ヤチェ'].energy + executor.lv - 1, Berry.map['ヤチェ'].energy * (1.025 ** (executor.lv - 1))) * effect.other * 4;
          }

          if (
            skill.name == 'ばけのかわ(きのみバースト)'
            && !copy
            && executor.base.skill.name !== 'ゆびをふる'
          ) {
            let success = 1 - ((1 - skill.success!) ** executor.skillPerDay);
            energyPerSkill *= (success * (executor.skillPerDay + 2) + (1 - success) * executor.skillPerDay) / executor.skillPerDay;
          }

          break;
        }
        
        case 'りゅうせいぐん(きのみバースト)': {
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            const { self, other } = effect.team[helpBoostCount! - 1]
            energyPerSkill = 
              executor.berryEnergy * (self + effect.bonus)
              + Math.max(Berry.map['ヤチェ'].energy + executor.lv - 1, Berry.map['ヤチェ'].energy * (1.025 ** (executor.lv - 1))) * other * 4;

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            const { self, other } = effect.team.at(-1)
            energyPerSkill = executor.berryEnergy
              * (self + effect.bonus)
              * this.config.simulation.eventBonus.skill.berryBurst;

            // 他メンバーのエナジーはあとで計算
            executor.burstBonus = other
              * this.config.simulation.eventBonus.skill.berryBurst;

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            const { self, other } = effect.team[helpBoostCount! - 1]
            energyPerSkill = 0
            const withLatias = pokemonList!.some(x => x.base.name == 'ラティアス');
            for(let subPokemon of pokemonList!) {
              energyPerSkill += executor.berryEnergy * (executor == subPokemon ? (withLatias ? self : self + effect.bonus) : other);
            }
            energyPerSkill *= this.config.simulation.eventBonus.skill.berryBurst;
          }

          break;
        }
        
        case 'みかづきのいのり(げんきオールS)': {
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            const { self, other } = effect.team[helpBoostCount! - 1]
            energyPerSkill = 
              executor.berryEnergy * self
              + Math.max(Berry.map['マゴ'].energy + executor.lv - 1, Berry.map['マゴ'].energy * (1.025 ** (executor.lv - 1))) * other * 4;

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            const { self, other } = effect.team.at(-1)
            energyPerSkill = executor.berryEnergy
              * self
              * this.config.simulation.eventBonus.skill.berryBurst;

            // 他メンバーのエナジーはあとで計算
            executor.burstBonus = other
              * this.config.simulation.eventBonus.skill.berryBurst;

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            const { self, other } = effect.team[helpBoostCount! - 1]
            energyPerSkill = 0
            for(let subPokemon of pokemonList!) {
              energyPerSkill += executor.berryEnergy * (executor == subPokemon ? self : other);
            }
            energyPerSkill *= this.config.simulation.eventBonus.skill.berryBurst;
          }

          break;
        }
        
        case 'いやしのはどう(げんきエールS)': {
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            energyPerSkill = scoreForSupportEvaluate! * effect.help2 * 2;

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            // チームが分かっている時はここで獲得エナジーと食材の期待値計算
            let helpCount = effect.help1;
            for(let subPokemon of pokemonList!) {
              if (subPokemon.base.name == 'ラティオス') {
                helpCount = effect.help2;
                break;
              }
            }
            helpCount = helpCount * 2 / 5;

            energyPerSkill = 0;
            for(let subPokemon of pokemonList!) {
              energyPerSkill += subPokemon.bEpH * helpCount * (1 - subPokemon.foodRate);
              for(let food of subPokemon.foodList) {
                executor[food.name] = (executor[food.name] ?? 0) + food.num / subPokemon.foodList.length * helpCount * subPokemon.foodRate * executor.skillPerDay * weight;
              }
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
              energyPerSkill += subPokemon.bEpH4Spt * helpCount * (1 - subPokemon.foodRate);
              for(let food of subPokemon.foodList) {
                executor[food.name] = (executor[food.name] ?? 0) + food.baseNum / subPokemon.foodList.length * helpCount * subPokemon.foodRate * executor.skillPerDay * weight;
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
          
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            energyPerSkill += this.config.selectEvaluate.energyPerCandy * 4;
          }
          break;

        case 'ビルドアップ(料理アシストS)':
          foodGet = effect.main;
          foodGetList = Food.list;

          cookingChance = effect.sub;
          break;

        case 'プラス(食材ゲットS)':
          foodGet = effect.main;
          foodGetList = Food.list;

          // 獲得数の計算に使う食材
          const energyFood = Food.map[executor.foodList[0].name];
          
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            // 厳選モードならその食材をフル活用する想定で計算
            energyPerSkill = energyFood.energy
              * energyFood.bestRate
              * Cooking.maxRecipeBonus
              * (Math.round(effect.sub / energyFood.energy) + 6);

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            if (this.#foodEnergyWeight > 0) {
              // 概算モードなら食材数と概算エナジーを計算
              let num = (Math.round(effect.sub / energyFood.energy) + 6)
                * executor.skillPerDay
                * weight;
              executor[energyFood.name] = Number(executor[energyFood.name] ?? 0) + num;                   // 1日あたりの食材数
              energyPerSkill = this.foodEnergyMap[energyFood.name].max
                * (Math.round(effect.sub / energyFood.energy) + 6)
                * this.#foodEnergyWeight; // 1回あたりのエナジー
            }

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            // チームモードの時は条件を満たしているかチェック
            if (
              pokemonList!
              .filter(x => 
                x.base.skill.name == 'プラス(食材ゲットS)'
                || x.base.skill.name == 'マイナス(料理パワーアップS)'
              ).length >= 2
            ) {
              // 実際に獲得する食材
              // スキルコピーの場合は獲得数はコピー先、獲得するのは発動者のものを参照
              const getFood = Food.map[copy ? copy.foodList[0].name : executor.foodList[0].name];

              let num = (Math.round(effect.sub / energyFood.energy) + 6)
                * executor.skillPerDay
                * weight;
              executor[getFood.name] = Number(executor[getFood.name] ?? 0) + num;
            }
          }

          break;

        case '食材セレクトS':
        case 'かいりきバサミ(食材セレクトS)':
        case 'きょううん(食材セレクトS)':
          if (skill.name == 'きょううん(食材セレクトS)') {
            executor.shard += effect.shard * executor.skillPerDay * weight;
          }

          foodGet = effect.food;

          // スキルコピーの場合、
          foodGetList = copy
            ? copy.base.foodList.map(x => Food.map[x.name])
            : (skill.foodList ?? executor.base.foodList.map(x => Food.map[x.name]));
          break;

        case 'ゆめのかけらゲットS':
        case 'ゆめのかけらゲットS(ランダム)':
          executor.shard += effect * executor.skillPerDay * weight;
          break;

        case 'はどうだん(ゆめのかけらゲットS)':
          executor.shard += effect.shard * executor.skillPerDay * weight;
          energyPerSkill = effect.energy;
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

        case 'サイコブレイク(きのみゾーン)':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            // このタイプのきのみが最も稼げるポケモン上位5匹を抽出、1日あたりのきのみの数を合計
            // その時のLvのきのみ、好みボーナス、月曜に起用する場合火曜～日曜の21回評価される分を7日で割る
            energyPerSkill = 
              executor.base.berry.energy
              * 2
              * (1.025 ** (executor.lv - 1))
              * Pokemon.list.filter(x => x.berry.name == executor.base.berry.name)
                .map(x => 
                  (x.specialty == 'きのみ' || x.specialty == 'オール' ? 3 : 2)
                  * 86400 / (x.help * 0.65 * (1 - (executor.lv - 1) * 0.002)) / 0.45
                )
                .sort((a, b) => b - a)
                .slice(0, 5)
                .reduce((sum, num) => sum + num, 0)
              * 21 / 7
              * effect.zone / 100
              + effect.energy;

          } else {
            // 今日の曜日から、翌日以降の効果量を計算

            const dayRate = 
              this.config.teamSimulation.day >= 0 ? (6 - this.config.teamSimulation.day) / 2
              : 1.5;
            
            // ボックス内のポケモンのうち、同じきのみを好むポケモンの上位5匹を抽出、1日あたりのきのみの数を合計
            const boxTop5 = boxPokemonList
              .filter(x => Pokemon.map[x.name]?.berry.name == executor.base.berry.name)
              .map(x => 
                (Pokemon.map[x.name]?.specialty == 'きのみ' || Pokemon.map[x.name]?.specialty == 'オール' ? 3 : 2)
                * 86400 / (Pokemon.map[x.name].help * 0.65 * (1 - (x.lv - 1) * 0.002)) / 0.45
              )
              .sort((a, b) => b - a)
              .slice(0, 5)
              .reduce((sum, num) => sum + num, 0)

            energyPerSkill = 
              executor.base.berry.energy
              * executor.berryRate / 100
              * (1.025 ** (executor.lv - 1))
              * boxTop5
              * dayRate
              * effect.zone / 100
              + effect.energy;
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
        let type = foodGetList.length == Food.list.length ? this.config.teamSimulation.foodGetEvaluateType : 1;

        if (this.mode == PokemonSimulator.MODE_SELECT) {
          let num = foodGet / foodGetList.length * executor.skillPerDay * weight;

          let foodEnergy = 0;
          for(let food of foodGetList) {
            executor[food.name] = Number(executor[food.name] ?? 0) + num;
            foodEnergy += food.energy * (
             (food.bestRate * Cooking.maxRecipeBonus - 1)
             * getPokemonEvaluateSetting(this.config.selectEvaluate, executor.base).foodGetRate / 100
             + 1
            )
          }
          energyPerSkill += foodEnergy / foodGetList.length * foodGet

        } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
          if (this.#foodEnergyWeight > 0) {
            // 1食材あたりの個数
            let oneFoodNumPerSkill = foodGet / foodGetList.length * this.config.teamSimulation.foodGetEvaluateRate;
            let num = executor.skillPerDay * oneFoodNumPerSkill * weight;
            let foodEnergy = 0;
            for(let food of foodGetList) {
              if (type == 1) {
                executor[food.name] = Number(executor[food.name] ?? 0) + num;
              }
              foodEnergy += this.foodEnergyMap[food.name].max
            }
            let energy = foodEnergy * this.#foodEnergyWeight * oneFoodNumPerSkill;
            if (type == 3 && this.config.teamSimulation.day != null) {
              energy *= (7 - (this.config.teamSimulation.day + 1) % 7) / (7 - this.config.teamSimulation.day)
            }

            energyPerSkill += energy;
          }

        } else if (this.mode == PokemonSimulator.MODE_TEAM) {
          if (!this.config.simulation.sundayPrepare) {
            // 1食材あたりの個数
            let oneFoodNumPerSkill = foodGet / foodGetList.length * this.config.teamSimulation.foodGetEvaluateRate;
            if (type == 1) {
              let num = executor.skillPerDay * oneFoodNumPerSkill * weight;
              for(let food of foodGetList) {
                executor[food.name] = Number(executor[food.name] ?? 0) + num;
              }
              
            } else {
              let energy = 0;
              for(let food of foodGetList) {
                energy += this.foodEnergyMap[food.name].max
              }

              energy *= this.#foodEnergyWeight * oneFoodNumPerSkill;
              if (type == 3 && this.config.teamSimulation.day != null) {
                energy *= (7 - (this.config.teamSimulation.day + 1) % 7) / (7 - this.config.teamSimulation.day)
              }
              energyPerSkill += energy;
            }
          }
        }
      }

      // 料理パワーアップの処理
      if (cookingPowerUpEffect) {
        const cookingPowerUpEffectNum = executor.skillPerDay * weight;
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
            thisEnergyPerSkill += this.#cookingPowerUpEnergy * Math.min(addPotSize, limit)
            
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

            const afterBestCooking = this.#getBestCooking(afterPotSize);

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
          let totalEffect = cookingChance / 100 * executor.skillPerDay * weight * 7;
          energyPerSkill += (Cooking.getChanceWeekEffect(totalEffect).total - 24.6) / 7 * Cooking.maxEnergy / executor.skillPerDay / weight;

        } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
          if (!this.config.simulation.sundayPrepare) {
            // チームシミュレーションの際は後で正確に評価、そうでなければ概算評価する
            if (executor.skillPerDay) {
              let totalEffect = cookingChance / 100 * executor.skillPerDay * weight * 7;
              energyPerSkill += (Cooking.getChanceWeekEffect(totalEffect).total - 24.6) / 7 * this.#defaultBestCooking.lastEnergy / executor.skillPerDay * this.config.simulation.cookingWeight / weight
            }
          }

        } else if (this.mode == PokemonSimulator.MODE_TEAM) {
          if (!this.config.simulation.sundayPrepare) {
            // 効果量だけ記憶しておく
            executor.cookingChanceEffect = cookingChance / 100 * executor.skillPerDay * weight;
          }
        }
      }
      
      if (energyPerSkill) {
        energyPerSkill *= weight;
        executor.skillEnergyMap[skill.name] = energyPerSkill;
        executor.skillEnergy += energyPerSkill;
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
      getPokemonEvaluateSetting(this.config.selectEvaluate, pokemon.base).berryEnergyRate,
    )
    // timeCounter?.stop('calcParameter')

    // timeCounter?.start('calcStatus')
    this.calcStatus(
      pokemon,
      this.config.selectEvaluate.teamHelpBonus + (pokemon.subSkillNameList.includes('おてつだいボーナス') ? 1 : 0),
      pokemon.subSkillNameList.includes('げんき回復ボーナス') ? 1 : 0,
    )
    // timeCounter?.stop('calcStatus')

    const shouldCalcTeamHeal =
      this.mode == PokemonSimulator.MODE_SELECT
        ? (pokemon.selfHeal > 0 || pokemon.otherHeal > 0 || this.config.selectEvaluate.healer > 0)
        : (pokemon.selfHeal > 0 || pokemon.otherHeal > 0);

    if (shouldCalcTeamHeal) {
      this.calcTeamHeal([pokemon])
    } else {
      pokemon.dayHelpRate = this.defaultHelpRate.day;
      pokemon.nightHelpRate = this.defaultHelpRate.night;
    }

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
