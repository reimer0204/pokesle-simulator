import HelpRate from '../help-rate';

import Pokemon from "../../data/pokemon";
import Exp from "../../data/exp";
import Skill from "../../data/skill";
import { Food, Cooking } from "../../data/food_and_cooking";
import Nature from "../../data/nature";
import Field from '../../data/field';
import Berry from '../../data/berry';
import SubSkill from '../../data/sub-skill';
import ProbBorder from '../utils/prob-border';
import type { CookingType, NatureType, PokemonBoxType, PokemonType, SimulatedPokemon, SkillType, SubSkillType } from '../../type';

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
  foodEnergyMap: {[key: string]: number};
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

  constructor(config: any, mode: number) {
    if (!mode) throw 'モードが指定されていません'

    this.config = config;
    this.mode = mode;
    this.#nightLength = Math.round(this.config.sleepTime * 3600)
    this.#dayLength = 86400 - this.#nightLength

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

    // 有効な料理に対しての食材のエナジー評価
    this.foodEnergyMap = {};
    for(const food of Food.list) this.foodEnergyMap[food.name] = food.energy;
    for(const cooking of this.cookingList) {
      for(const cookingFood of cooking.foodList) {
        this.foodEnergyMap[cookingFood.name] = Math.max(
          this.foodEnergyMap[cookingFood.name],
          Food.map[cookingFood.name].energy * cooking.rate * cooking.recipeLvBonus
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
  }

  fromBox(box: PokemonBoxType, fixable: boolean, useCandy: number = 0, requireLv: number = 0) {
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

    const pokemon = this.initSimulatedPokemon(
      base,
      lv,
      box.foodList,
      fixable && this.config.simulation.fixSkillSeed ? base.skill.effect.length : box.skillLv,
      this.config.simulation.eventBonusType == 'all'
        || this.config.simulation.eventBonusType == base.type
        || this.config.simulation.eventBonusType == base.specialty,
      box.sleepTime,
      useCandy,
      useShard,
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
      (
        this.config.simulation.field == 'ワカクサ本島' ? this.config.simulation.berryList : Field.map[this.config.simulation.field].berryList
      )?.includes(pokemon.base.berry.name) ? 200 : 100,
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
  ): SimulatedPokemon {
    const firstFoodEnergy = Food.map[foodNameList[0]].energy * ((base.specialty == '食材' || base.specialty == 'オール') ? 2 : 1)

    const pokemon: SimulatedPokemon = {
      base,
      skillLv: skillLv,
      lv: lv,
      foodList: [],
      foodProbList: [],
      eventBonus,
      sleepTime,
      useCandy,
      useShard,

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
      evaluateSpecialty: {},
      score: 0,
      nature: undefined,
      skillWeightList: [],
      selfHealList: [],
      otherHealList: [],
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
      pokemon.foodList.push({
        name: food.name,
        num,
        energy: this.foodEnergyMap[food.name] * num,
      })  
    }

    for(let { name, num } of pokemon.foodList) {
      for(let foodProb of pokemon.foodProbList) {
        if (foodProb.name == name) {
          num -= foodProb.num;
          foodProb.weight += 1 / pokemon.foodList.length;
        }
      }
      pokemon.foodProbList.push({ name, num, weight: 1 / pokemon.foodList.length })
    }

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
    pokemon.foodEnergyPerHelp = pokemon.foodList.reduce((a, x) => a + x.energy, 0)
      / pokemon.foodList.length
      * this.#foodEnergyWeight;

    if (this.mode != PokemonSimulator.MODE_SELECT) {
      pokemon.foodEnergyPerHelp *= this.config.simulation.cookingWeight;
    }

    // きのみor食材エナジー/手伝い
    pokemon.pickupEnergyPerHelp =
      pokemon.berryEnergyPerHelp * (1 - pokemon.foodRate)
      + pokemon.foodEnergyPerHelp * pokemon.foodRate;


    // 最大所持数計算
    pokemon.bag = pokemon.box?.bag ?? (
      pokemon.base.bag + (pokemon.base.evolveLv - 1) * 5
      + (pokemon.subSkillNameList.includes('最大所持数アップS') ? 6 : 0)
      + (pokemon.subSkillNameList.includes('最大所持数アップM') ? 12 : 0)
      + (pokemon.subSkillNameList.includes('最大所持数アップL') ? 18 : 0)
    );
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
      )
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
    
    if (this.#skillEnergyIgnore && pokemon.base.skill.energyOnly) {
      pokemon.skillRate = 0;
    }

    // 天井を考慮したスキル確率
    pokemon.skillCeil = pokemon.base.specialty == 'スキル' ? 40 * 3600 / pokemon.base.help : 78;
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

    // 日中の基本手伝い回数(げんき回復なし)
    let baseDayHelpNum = 0;
    let dayRemainTime = (24 - this.config.sleepTime) * 3600;

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
            let list: { skill: SkillType, weight: number }[];
            if (subPokemon.base.skill.name == 'へんしん(スキルコピー)' || subPokemon.base.skill.name == 'ものまね(スキルコピー)') {
              list = [{ skill: Skill.map['エナジーチャージS'], weight: 1 }]
            } else {
              list = pokemon.skillWeightList
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

    pokemon.dayHelpNum   = (24 - this.config.sleepTime) * 3600 / pokemon.speed * pokemon.dayHelpRate;
    pokemon.nightHelpNum =       this.config.sleepTime  * 3600 / pokemon.speed * pokemon.nightHelpRate;

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
      if (this.mode != PokemonSimulator.MODE_SELECT) {
        for(let food of Food.list) {
          pokemon[food.name] = 0;
        }
        for(let food of pokemon.foodList) {
          pokemon[food.name] += Number(food.num) / pokemon.foodList.length * foodGetChance;
        }
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
      for(const foodProb of pokemon.foodProbList) {
        const num = this.#probBorder.get(pokemon.foodRate * foodProb.weight, pokemon.normalHelpNum) * foodProb.num
        pokemon.foodEnergyPerDay += num * this.foodEnergyMap[foodProb.name];
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

      if (pokemon.base.specialty == 'スキル') {
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

    for(let { skill, weight } of pokemon.skillWeightList) {
      const skillLv = (skill.effect.length >= pokemon.fixedSkillLv ? pokemon.fixedSkillLv : skill.effect.length) - 1;
      const effect = skill.effect[skillLv];
      let energy;
      switch(skill.name) {
        case 'エナジーチャージS':
        case 'エナジーチャージS(ランダム)':
        case 'エナジーチャージM':
        case 'たくわえる(エナジーチャージS)':
          energy = effect;
          break;
            
        case 'ナイトメア(エナジーチャージM)':
          energy = effect.energy;
          break;

        case 'ばけのかわ(きのみバースト)':
        case 'きのみバースト': {
          if (this.mode == PokemonSimulator.MODE_ABOUT) {
            energy = pokemon.berryEnergy * effect.self
            // 他メンバーのエナジーはあとで計算
            pokemon.burstBonus = effect.other;

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            energy = 0
            for(let subPokemon of pokemonList!) {
              energy += pokemon.berryEnergy * (pokemon == subPokemon ? effect.self : effect.other);
            }

          } else if (this.mode == PokemonSimulator.MODE_SELECT) {
            energy = 
              pokemon.berryEnergy * effect.self
              + Math.max(Berry.map['ヤチェ'].energy + pokemon.lv - 1, Berry.map['ヤチェ'].energy * (1.025 ** (pokemon.lv - 1))) * effect.other * 4;
          }

          if (skill.name == 'ばけのかわ(きのみバースト)') {
            let success = 1 - ((1 - skill.success!) ** pokemon.skillPerDay);
            energy *= (success * (pokemon.skillPerDay + 2) + (1 - success) * pokemon.skillPerDay) / pokemon.skillPerDay;
          }

          break;
        }
        
        case 'みかづきのいのり(げんきオールS)': {
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            const { self, other } = effect.team[helpBoostCount! - 1]
            energy = 
              pokemon.berryEnergy * self
              + Math.max(Berry.map['マゴ'].energy + pokemon.lv - 1, Berry.map['マゴ'].energy * (1.025 ** (pokemon.lv - 1))) * other * 4;

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            const { self, other } = effect.team.at(-1)
            energy = pokemon.berryEnergy * self
            // 他メンバーのエナジーはあとで計算
            pokemon.burstBonus = other;

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            const { self, other } = effect.team[helpBoostCount! - 1]
            energy = 0
            for(let subPokemon of pokemonList!) {
              energy += pokemon.berryEnergy * (pokemon == subPokemon ? self : other);
            }
          }

          break;
        }

        case 'おてつだいサポートS':
        case 'おてつだいブースト':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            energy = scoreForSupportEvaluate! * (skill.name == 'おてつだいブースト' ? effect.max * 5 : effect);

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

            energy = 0;
            for(let subPokemon of pokemonList!) {
              energy += subPokemon.berryEnergyPerHelp * helpCount * (1 - subPokemon.foodRate);
              for(let food of subPokemon.foodList) {
                pokemon[food.name] = (pokemon[food.name] ?? 0) + food.num / subPokemon.foodList.length * helpCount * subPokemon.foodRate * pokemon.skillPerDay * weight;
              }
            }
            
          }
          break;

        case '食材ゲットS':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            energy = Food.list.reduce((a, food) =>
              a + food.energy * (
                (food.bestRate * Cooking.maxRecipeBonus - 1) * this.config.selectEvaluate.specialty[pokemon.base.specialty].foodGetRate / 100 + 1
              )
              , 0
            ) / Food.list.length * effect;

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            if (this.#foodEnergyWeight > 0) {
              let num = effect / Food.list.length * pokemon.skillPerDay * weight;
              let foodEnergy = 0;
              for(let food of Food.list) {
                pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num * this.config.simulation.foodGetRate / 100;
                foodEnergy +=
                  (
                    this.foodEnergyMap[food.name] * this.config.simulation.foodGetRate / 100
                    + food.energy * (100 - this.config.simulation.foodGetRate) / 100
                  )
                  * this.config.simulation.cookingWeight
              }

              energy = foodEnergy / Food.list.length * effect * this.#foodEnergyWeight;
            }

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            if (!this.config.simulation.sundayPrepare) {
              let num = effect / Food.list.length * pokemon.skillPerDay * weight;
              for(let food of Food.list) {
                pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num * this.config.simulation.foodGetRate / 100;
              }
            }
          }
          break;


        case 'きょううん(食材セレクトS)':
          pokemon.shard += effect.shard * pokemon.skillPerDay * weight;

          if (this.mode == PokemonSimulator.MODE_SELECT) {
            energy = skill.foodList.reduce((a, food) =>
              a + food.energy * (
                (food.bestRate * Cooking.maxRecipeBonus - 1) * this.config.selectEvaluate.specialty[pokemon.base.specialty].foodGetRate / 100 + 1
              )
              , 0
            ) / skill.foodList.length * effect.food;

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            if (this.#foodEnergyWeight > 0) {
              let num = effect.food / skill.foodList.length * pokemon.skillPerDay * weight;
              console.log(num)
              let foodEnergy = 0;
              for(let food of skill.foodList) {
                pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num * this.config.simulation.foodGetRate / 100;
                foodEnergy +=
                  (
                    this.foodEnergyMap[food.name] * this.config.simulation.foodGetRate / 100
                    + food.energy * (100 - this.config.simulation.foodGetRate) / 100
                  )
                  * this.config.simulation.cookingWeight
              }

              energy = foodEnergy / skill.foodList.length * effect.food * this.#foodEnergyWeight;
            }

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            if (!this.config.simulation.sundayPrepare) {
              let num = effect.food / skill.foodList.length * pokemon.skillPerDay * weight;
              for(let food of skill.foodList) {
                pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num * this.config.simulation.foodGetRate / 100;
              }
            }
          }
          break;

        case 'ゆめのかけらゲットS':
        case 'ゆめのかけらゲットS(ランダム)':
          pokemon.shard += effect * pokemon.skillPerDay * weight;
          break;

        case '料理パワーアップS':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            // 最大料理と通常のなべサイズの差から、1日何回までが有効な効果か計算する
            let limit = Math.ceil((Cooking.maxFoodNum - Cooking.potMax) / effect) * 3
            let skillPerDay = pokemon.skillPerDay * weight;

            energy = (
              effect * Cooking.cookingPowerUpEnergy * Math.min(skillPerDay, limit)
              + effect * Food.averageEnergy * Math.max(skillPerDay - limit, 0)
            ) / skillPerDay;

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {

            // 料理は1日3回までしかできないので、3回以上発動するなら特殊補正
            let fixedRate = pokemon.skillPerDay > 3 ? pokemon.skillPerDay / 3 : 1;

            // 拡張後と拡張前で出来る料理の差を計算
            let afterPotSize = Math.round(
              (this.config.simulation.potSize + effect * fixedRate)
              * (this.config.simulation.campTicket ? 1.5 : 1)
            );

            let afterBestCooking = this.cookingList.filter(cooking => cooking.foodNum <= afterPotSize)
              .map(cooking => ({
                ...cooking,
                lastEnergy: cooking.fixEnergy + (afterPotSize - cooking.foodNum) * Food.averageEnergy,
              }))
              .sort((a, b) => b.lastEnergy - a.lastEnergy)[0];

            energy = (afterBestCooking.lastEnergy - this.#defaultBestCooking.lastEnergy) * this.config.simulation.cookingWeight / fixedRate;

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            // 効果量だけ記憶しておく
            pokemon.cookingPowerUpEffect = effect * weight;

          }
          break;

        case '料理チャンスS':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            let totalEffect = effect / 100 * pokemon.skillPerDay * weight * 7;
            energy = (Cooking.getChanceWeekEffect(totalEffect).total - 24.6) / 7 * Cooking.maxEnergy / pokemon.skillPerDay / weight;

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            if (!this.config.simulation.sundayPrepare) {
              // チームシミュレーションの際は後で正確に評価、そうでなければ概算評価する
              if (pokemon.skillPerDay) {
                let totalEffect = effect / 100 * pokemon.skillPerDay * weight * 7;
                energy = (Cooking.getChanceWeekEffect(totalEffect).total - 24.6) / 7 * this.#defaultBestCooking.lastEnergy / pokemon.skillPerDay * this.config.simulation.cookingWeight / weight
              }
            }

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            if (!this.config.simulation.sundayPrepare) {
              // 効果量だけ記憶しておく
              pokemon.cookingChanceEffect = effect / 100 * pokemon.skillPerDay * weight;
            }
          }

          break;

        case 'へんしん(スキルコピー)':
        case 'ものまね(スキルコピー)':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            // 厳選時はエナジーチャージM相当で計算
            energy = Skill.map['エナジーチャージM'].effect[skillLv]

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            // 概算時はエナジーチャージM相当で計算
            energy = Skill.map['エナジーチャージM'].effect[skillLv]

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            // スキルコピーがスキルコピーをコピーした場合はエナジーチャージS相当(公式)
            energy = Skill.map['エナジーチャージS'].effect[skillLv]
          }
          break;

        case 'げんきオールS':
        case 'げんきエールS':
        case 'げんきチャージS':
        case 'つきのひかり(げんきチャージS)':
          // 別の場所で計算
          break;
        
        default:
          throw `未実装のスキル: ${skill.name}`
      }
      
      if (energy) {
        energy *= weight;
        pokemon.skillEnergyMap[skill.name] = energy;
        pokemon.skillEnergy += energy;
      }
    }

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
    for(let { name, num } of foodList) {
      for(let foodProb of foodProbList) {
        if (foodProb.name == name) {
          num -= foodProb.num;
          foodProb.weight += 1 / foodList.length;
        }
      }
      foodProbList.push({ name, num, weight: 1 / foodList.length })
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

  selectEvaluateToScore(pokemon, yumebo, risabo) {
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
