import HelpRate from '../models/help-rate.js';

import Pokemon from "../data/pokemon";
import Skill from "../data/skill";
import Food from "../data/food";
import Nature from "../data/nature";
import Field from '../data/field.js';
import Berry from '../data/berry.js';
import Cooking from '../data/cooking.js';
import SubSkill from '../data/sub-skill.js';

const GENKI_EFFECT = [0, 0.45, 0.52, 0.62, 0.71, 1.00];

// const FOOD_EMPTY_MAP = Object.fromEntries(Food.list.map(x => [x.name, 0]))

class PokemonSimulator {

  static MODE_ABOUT = 1;
  static MODE_TEAM = 2;
  static MODE_SELECT = 3;

  constructor(config, mode) {
    if (!mode) throw 'モードが指定されていません'

    this.config = config;
    this.mode = mode;
    this.helpEffectCache = new Map();
    this.helpRateCache = new Map();

    this.fixedPotSize =
      mode == PokemonSimulator.MODE_SELECT ? Cooking.potMax
      : Math.round(this.config.simulation.potSize * (this.config.simulation.campTicket ? 1.5 : 1))

    // 今週の料理タイプのリスト
    this.cookingList =
      mode == PokemonSimulator.MODE_SELECT ? Cooking.list
      : Cooking.list.filter(c => c.type == this.config.simulation.cookingType && (config.simulation.enableCooking[c.name] || c.foodNum == 0));

    // 有効な料理に対しての食材のエナジー評価
    this.foodEnergyMap = {};
    for(const food of Food.list) this.foodEnergyMap[food.name] = food.energy;
    for(const cooking of this.cookingList) {
      for(const cookingFood of cooking.foodList) {
        this.foodEnergyMap[cookingFood.name] = Math.max(
          this.foodEnergyMap[cookingFood.name],
          Food.map[cookingFood.name].energy * cooking.rate * Cooking.recipeLvs[this.config.simulation.cookingRecipeLv ?? 1]
        )
      }
    }

    // 現状の鍋のサイズでできる一番いい料理
    this.defaultBestCooking = this.cookingList
      .filter(cooking => cooking.foodNum <= this.fixedPotSize)
      .map(cooking => ({
        ...cooking,
        lastEnergy: cooking.energy * Cooking.recipeLvs[this.config.simulation.cookingRecipeLv ?? 1] + (this.fixedPotSize - cooking.foodNum) * Food.maxEnergy,
      }))
      .sort((a, b) => b.lastEnergy - a.lastEnergy)[0];

      this.calcStatusCache = new Map();

    this.defaultHelpRate = HelpRate.getHelpRate(Math.min(config.sleepTime / 8.5, 1) * 100, 0, 0, this.config)
  }

  static get isReady() {
    return HelpRate.isReady;
  }

  memberToInfo(pokemon) {

    let base = Pokemon.map[pokemon.name];
    let skill = Skill.map[base.skill];
    pokemon = {
      ...base,
      ...pokemon,
      fixLv: pokemon.fixable && this.config.simulation.fixLv ? Math.max(this.config.simulation.fixLv, pokemon.lv) : pokemon.lv,
      base,
      box: pokemon,
      berry: Berry.map[base.berry],
      berryName: base.berry,
      skill,
      skillName: base.skill,
      skillLv: pokemon.fixable && this.config.simulation.fixSkillSeed ? skill.effect.length : (pokemon.skillLv ?? base.evolveLv),
      // ...FOOD_EMPTY_MAP,
      eventBonus: this.config.simulation.eventBonusType == 'all' || this.config.simulation.eventBonusType == base.type,
    };

    // 有効なサブスキル計算
    let enableSubSkillLength = 0;
    if (pokemon.fixLv >=  10) enableSubSkillLength++;
    if (pokemon.fixLv >=  25) enableSubSkillLength++;
    if (pokemon.fixLv >=  50) enableSubSkillLength++;
    if (pokemon.fixLv >=  75) enableSubSkillLength++;
    if (pokemon.fixLv >= 100) enableSubSkillLength++;

    // 銀種
    let subSkillList = [...pokemon.subSkillList];
    if (pokemon.fixable && this.config.simulation.fixSubSkillSeed) {
      let hit;
      do {
        hit = false;
        subSkillList.slice(0, enableSubSkillLength).forEach((subSkill, i) => {
          subSkill = SubSkill.map[subSkill];
          if (subSkill?.next && !subSkillList.includes(subSkill.next)) {
            hit = true;
            subSkillList[i] = subSkill?.next;
          }
        })
      } while(hit)
    }
    let enableSubSkillList = subSkillList.slice(0, enableSubSkillLength);

    // サブスキルのレベルアップ計算
    pokemon.nextSubSkillList = pokemon.subSkillList.map(subSkill => {
      subSkill = SubSkill.map[subSkill];
      if (subSkill?.next && !pokemon.subSkillList.includes(subSkill.next)) {
        return subSkill.next;
      } else {
        return subSkill.name;
      }
    })

    // 有効な食材計算
    let enableFoodList = [];
    for(let i = 0; i < (pokemon.fixLv < 30 ? 1 : pokemon.fixLv < 60 ? 2 : 3); i++) {
      let food = Food.map[pokemon.foodList[i]];
      let num = base.foodList.find(baseFood => baseFood.name == food.name).numList[i];
      if (pokemon.eventBonus) {
        num += this.config.simulation.eventBonusTypeFood;
      }
      enableFoodList.push({
        name: food.name,
        num,
        energy: this.foodEnergyMap[food.name] * num,
      });
    }

    this.calcParameter(
      pokemon,
      enableFoodList,
      enableSubSkillList,
      pokemon.nature?.name ? pokemon.nature : Nature.map[pokemon.nature],
      (
        this.config.simulation.field == 'ワカクサ本島' ? this.config.simulation.berryList : Field.map[this.config.simulation.field].berryList
      )?.includes(pokemon.berry.name)
    )

    return pokemon;
  }

  // おてスピや所持数、各種確率等の基本的な計算
  calcParameter(result, foodList, subSkillList, nature, berryMatch) {
    if (result.fixLv == null) result.fixLv = result.lv

    result.cookingPowerUpEffect = 0;
    result.cookingChanceEffect = 0;
    result.supportScorePerDay = 0;
    result.shard = 0;
    result.enableFoodList = foodList;
    result.enableSubSkillList = subSkillList;
    result.nature = nature;
    result.natureName = nature?.name,
    result.sleepTime ??= 0;

    // きのみの個数
    result.berryNum = (result.specialty == 'きのみ' ? 2 : 1)
      + (subSkillList.includes('きのみの数S') ? 1 : 0)

    // きのみエナジー/手伝い
    result.berryEnergy = Math.max(
      result.berry.energy + result.fixLv - 1,
      result.berry.energy * (1.025 ** (result.fixLv - 1))
    )
    * (berryMatch ? 2 : 1)
    * (this.config.simulation.berryWeight ?? 1)

    result.berryEnergyPerHelp = result.berryEnergy * result.berryNum

    // 食材確率
    result.fixedFoodRate = result.foodRate
      * (
        1
        + (subSkillList.includes('食材確率アップS') ? 0.18 : 0)
        + (subSkillList.includes('食材確率アップM') ? 0.36 : 0)
      )
      * (nature?.good == '食材お手伝い確率' ? 1.2 : nature?.weak == '食材お手伝い確率' ? 0.8 : 1)

    // 食材数/手伝い
    result.foodNum = result.enableFoodList.reduce((a, x) => a + x.num, 0) / result.enableFoodList.length;

    // 食材エナジー/手伝い
    result.foodEnergyPerHelp = result.enableFoodList.reduce((a, x) => a + x.energy, 0)
      / result.enableFoodList.length;

    if (this.mode != PokemonSimulator.MODE_SELECT) {
      result.foodEnergyPerHelp *= this.config.simulation.cookingWeight;
    }

    // 食材/手伝い
    result.foodPerHelp = {}
    for(let food of result.enableFoodList) {
      result.foodPerHelp[food.name] = (result.foodPerHelp[food.name] ?? 0) + Number(food.num) / result.enableFoodList.length;
    }


    // きのみor食材エナジー/手伝い
    result.pickupEnergyPerHelp =
      result.berryEnergyPerHelp * (1 - result.fixedFoodRate)
      + result.foodEnergyPerHelp * result.fixedFoodRate;


    // 最大所持数計算
    result.fixedBag = result.bag ?? (
      result.base.bag + (result.base.evolveLv - 1) * 5
      + (subSkillList.includes('最大所持数アップS') ? 6 : 0)
      + (subSkillList.includes('最大所持数アップM') ? 12 : 0)
      + (subSkillList.includes('最大所持数アップL') ? 18 : 0)
    );
    if (result.sleepTime >=  200) result.fixedBag += 1;
    if (result.sleepTime >=  500) result.fixedBag += 2;
    if (result.sleepTime >= 1000) result.fixedBag += 3;
    if (result.sleepTime >= 2000) result.fixedBag += 2;

    // いつ育到達は所持数がいっぱい＋4回(キュー消化分)以降
    result.bagFullHelpNum = Math.max(result.fixedBag / (
      result.berryNum * (1 - result.fixedFoodRate)
      + result.foodNum * result.fixedFoodRate
    ) + 4, 0);

    // スキルレベル計算
    result.fixedSkillLv = result.skillLv ?? (
      result.evolveLv
      + (subSkillList.includes('スキルレベルアップS') ? 1 : 0)
      + (subSkillList.includes('スキルレベルアップM') ? 2 : 0)
    )
    if (this.mode != PokemonSimulator.MODE_SELECT && result.eventBonus) {
      result.fixedSkillLv += this.config.simulation.eventBonusTypeSkillLv;
    }
    if (result.fixedSkillLv < 1) result.fixedSkillLv = 1;
    if (result.fixedSkillLv > result.skill.effect.length) result.fixedSkillLv = result.skill.effect.length;

    // スキル確率
    result.fixedSkillRate = result.skillRate
      * (
        1
        + (subSkillList.includes('スキル確率アップS') ? 0.18 : 0)
        + (subSkillList.includes('スキル確率アップM') ? 0.36 : 0)
      )
      * (nature?.good == 'メインスキル発生確率' ? 1.2 : nature?.weak == 'メインスキル発生確率' ? 0.8 : 1)

    if (this.mode != PokemonSimulator.MODE_SELECT && result.eventBonus) {
      result.fixedSkillRate *= this.config.simulation.eventBonusTypeSkillRate;
    }

    // 天井を考慮したスキル確率
    result.skillCeil = result.specialty == 'スキル' ? 40 * 3600 / result.help : 78;
    result.ceilSkillRate =
      result.fixedSkillRate > 0
      ? result.fixedSkillRate / (1 - Math.pow(1 - result.fixedSkillRate, result.skillCeil))
      : 1 / result.skillCeil;

    // ゆびをふるの場合は全ての効果量を1/スキル数で評価
    result.skillEffectRate = result.skill.name == 'ゆびをふる' ? (1 / Skill.metronomeTarget.length) : 1;

    // 発動するスキルの一覧(ゆびをふる用)
    result.skillList = result.skill.name == 'ゆびをふる' ? Skill.metronomeTarget : [result.skill];

    return result;
  }

  calcStatus(pokemon, helpBonus, genkiHealBonus = 0) {

    // おてつだい速度短縮量計算
    pokemon.speedBonus = 0;
    if (pokemon.enableSubSkillList.includes('おてつだいスピードS')) pokemon.speedBonus += 0.07;
    if (pokemon.enableSubSkillList.includes('おてつだいスピードM')) pokemon.speedBonus += 0.14;
    pokemon.speedBonus += helpBonus * 0.05;
    pokemon.speedBonus = Math.min(pokemon.speedBonus, 0.35);

    // おてつだいスピード計算
    pokemon.speed = Math.floor(
      pokemon.help
      * (1 - (pokemon.fixLv - 1) * 0.002)
      * (1 - pokemon.speedBonus)
      * (pokemon.nature?.good == '手伝いスピード' ? 0.9 : pokemon.nature?.weak == '手伝いスピード' ? 1.1 : 1)
      / (this.mode != PokemonSimulator.MODE_SELECT && this.config.simulation.campTicket ? 1.2 : 1)
    );
    if (pokemon.remainEvolveLv == 1 && pokemon.sleepTime >=  500) pokemon.speed *= 0.95
    if (pokemon.remainEvolveLv == 1 && pokemon.sleepTime >= 2000) pokemon.speed *= 0.88
    if (pokemon.remainEvolveLv == 2 && pokemon.sleepTime >=  500) pokemon.speed *= 0.89
    if (pokemon.remainEvolveLv == 2 && pokemon.sleepTime >= 2000) pokemon.speed *= 0.75

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

    // 性格のげんき回復係数
    pokemon.natureGenkiMultiplier = (pokemon.nature?.good == 'げんき回復量' ? 1.2 : pokemon.nature?.weak == 'げんき回復量' ? 0.88 : 1)

    // 起床時の回復量
    pokemon.morningHealGenki = Math.min(
      Math.min(this.config.sleepTime / 8.5, 1) * 100
      * pokemon.natureGenkiMultiplier
      * (1 + genkiHealBonus * 0.14)
      , 100
    )

    // げんき回復系スキル
    let selfMorningHealEffect = 0;
    let selfDayHealEffect = 0;
    let otherMorningHealEffect = 0;
    let otherDayHealEffect = 0;
    if (pokemon.fixedBag > 0) {
      let healSkillList = pokemon.skill.name == 'げんきチャージS' || pokemon.skill.name == 'げんきエールS' || pokemon.skill.name == 'げんきオールS' ? [pokemon.skill] :
        pokemon.skill.name == 'ゆびをふる' ? [Skill.map['げんきチャージS'], Skill.map['げんきエールS'], Skill.map['げんきオールS']] :
        []

      let effectSum = 0;
      let effectMap = {};
      for(let skill of healSkillList) {
        let effect = skill.effect[pokemon.fixedSkillLv - 1] / (skill.name == 'げんきエールS' ? 5 : 1);
        effectSum += effect
        effectMap[skill.name] = effect;
      }
      let fixedEffectSum = effectSum * pokemon.natureGenkiMultiplier
      if (pokemon.skill.name == 'ゆびをふる') {
        fixedEffectSum = fixedEffectSum / healSkillList.length * healSkillList.length / Skill.metronomeTarget.length;
      }

      let cacheKey = fixedEffectSum ? `${pokemon.morningHealGenki.toFixed(3)}_${pokemon.fixedSkillRate.toFixed(3)}_${pokemon.speed.toFixed(3)}_${pokemon.bagFullHelpNum.toFixed(3)}_${pokemon.skillCeil.toFixed(3)}_${fixedEffectSum.toFixed(3)}` : ``
      let cache = this.helpEffectCache.get(cacheKey);
      if(cache == null) {
        cache = fixedEffectSum ? HelpRate.getHealEffect(pokemon, fixedEffectSum, this.config) : [0, 0];
        this.helpEffectCache.set(cacheKey, cache)
      }
      let [morningHealEffect, dayHealEffect] = cache;
      // let [morningHealEffect, dayHealEffect] = [0, 0];

      for(let skill of healSkillList) {
        if (skill.name == 'げんきチャージS') {
          selfMorningHealEffect += morningHealEffect * effectMap[skill.name] / effectSum;
          selfDayHealEffect += dayHealEffect * effectMap[skill.name] / effectSum;
        } else {
          otherMorningHealEffect += morningHealEffect * effectMap[skill.name] / effectSum;
          otherDayHealEffect += dayHealEffect * effectMap[skill.name] / effectSum;
        }
      }
    }
    pokemon.selfMorningHealEffect = selfMorningHealEffect / pokemon.natureGenkiMultiplier;
    pokemon.selfDayHealEffect = selfDayHealEffect / pokemon.natureGenkiMultiplier;
    pokemon.otherMorningHealEffect = otherMorningHealEffect / pokemon.natureGenkiMultiplier;
    pokemon.otherDayHealEffect = otherDayHealEffect / pokemon.natureGenkiMultiplier;

    return pokemon
  }

  async calcHelp(pokemon, otherMorningHealEffect, otherDayHealEffect, modeOption = {}, timeCounter = null) {
    let { pokemonList, helpBoostCount, scoreForHealerEvaluate, scoreForSupportEvaluate, } = modeOption;

    let totalMorningHealEffect = (pokemon.selfMorningHealEffect + otherMorningHealEffect) * pokemon.natureGenkiMultiplier;
    let totalDayHealEffect = (pokemon.selfDayHealEffect + otherDayHealEffect) * pokemon.natureGenkiMultiplier;

    let cacheKey = `${pokemon.morningHealGenki.toFixed(3)}_${totalMorningHealEffect.toFixed(3)}_${totalDayHealEffect.toFixed(3)}`
    let helpRate = this.helpRateCache.get(cacheKey)
    if(helpRate == null) {
      helpRate = HelpRate.getHelpRate(pokemon.morningHealGenki, totalMorningHealEffect, totalDayHealEffect, this.config)
      this.helpRateCache.set(cacheKey, helpRate)
    }

    pokemon.morningHealEffect = totalMorningHealEffect
    pokemon.dayHealEffect = totalDayHealEffect
    pokemon.healEffect = totalMorningHealEffect

    pokemon.dayHelpNum   = (24 - this.config.sleepTime) * 3600 / pokemon.speed * helpRate.day;
    pokemon.nightHelpNum =       this.config.sleepTime  * 3600 / pokemon.speed * helpRate.night;

    pokemon.dayHelpRate = helpRate.day
    pokemon.nightHelpRate = helpRate.night
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
    let berryHelpNum = pokemon.normalHelpNum * (1 - pokemon.fixedFoodRate) + pokemon.berryHelpNum
    pokemon.berryEnergyPerDay = pokemon.berryEnergyPerHelp * berryHelpNum
    pokemon.berryNumPerDay = pokemon.berryNum * berryHelpNum;

    // 食材エナジー/日
    pokemon.foodEnergyPerDay = pokemon.foodEnergyPerHelp * pokemon.normalHelpNum * pokemon.fixedFoodRate;
    pokemon.foodNumPerDay = pokemon.foodNum * pokemon.normalHelpNum * pokemon.fixedFoodRate;
    
    // 食材の個数
    if (this.mode != PokemonSimulator.MODE_SELECT) {
      for(let food of Food.list) {
        pokemon[food.name] = (pokemon.foodPerHelp[food.name] ?? 0) * pokemon.normalHelpNum * pokemon.fixedFoodRate;
      }
    }
    
    // きのみor食材エナジー/日
    pokemon.pickupEnergyPerDay = pokemon.berryEnergyPerDay + pokemon.foodEnergyPerDay;

    // スキル発動回数の期待値を計算(チェックごとの確率の総和)
    if (pokemon.fixedBag > 0) {
      let daySkillableNum = Math.min(pokemon.dayHelpNum / (this.config.checkFreq - 1), pokemon.bagFullHelpNum);
      let nightSkillableNum = Math.min(pokemon.nightHelpNum, pokemon.bagFullHelpNum);

      if (pokemon.specialty == 'スキル') {
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

    for(let skill of pokemon.skillList) {
      const effect = skill.effect[pokemon.fixedSkillLv - 1];
      let energy;
      switch(skill.name) {
        case 'エナジーチャージS':
        case 'エナジーチャージS(ランダム)':
        case 'エナジーチャージM':
          energy = effect * pokemon.skillEffectRate;
          break;

        case 'ばけのかわ(きのみバースト)':
          let bonus = [1, 2, 2, 3, 4, 5][pokemon.fixedSkillLv - 1] ?? 0

          if (this.mode == PokemonSimulator.MODE_ABOUT) {
            energy = pokemon.berryEnergy * effect
            // 他メンバーのエナジーはあとで計算
            pokemon.burstBonus = bonus;

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            energy = 0
            for(let subPokemon of pokemonList) {
              energy += pokemon.berryEnergy * (pokemon == subPokemon ? effect : bonus);
            }

          } else if (this.mode == PokemonSimulator.MODE_SELECT) {
            energy = 
              pokemon.berryEnergy * effect
              + Math.max(Berry.map['ヤチェ'].energy + pokemon.fixLv - 1, Berry.map['ヤチェ'].energy * (1.025 ** (pokemon.fixLv - 1))) * bonus * 4;
          }

          let success = 1 - (0.9 ** pokemon.skillPerDay);
          energy *= (success * (pokemon.skillPerDay + 2) + (1 - success) * pokemon.skillPerDay) / pokemon.skillPerDay;

          break;

        case 'おてつだいサポートS':
        case 'おてつだいブースト':

          if (this.mode == PokemonSimulator.MODE_ABOUT) {
            // あとで概算値計算

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            // チームが分かっている時はここで獲得エナジーと食材の期待値計算
            let helpCount;
            if (skill.name == 'おてつだいサポートS') {
              helpCount = effect / 5;
            }
            if (skill.name == 'おてつだいブースト') {
              helpCount = [2, 3, 3, 4, 4, 5][pokemon.fixedSkillLv - 1];
              helpCount += [
                [0, 0, 1, 2, 4],
                [0, 0, 1, 2, 4],
                [0, 0, 2, 3, 5],
                [0, 0, 2, 3, 5],
                [0, 1, 3, 4, 6],
                [0, 1, 3, 4, 6],
              ][pokemon.fixedSkillLv - 1][helpBoostCount - 1]
            }
            helpCount *= pokemon.skillEffectRate;

            energy = 0;
            for(let subPokemon of pokemonList) {
              energy += subPokemon.berryEnergyPerHelp * helpCount * (1 - subPokemon.fixedFoodRate);
              for(let foodName in subPokemon.foodPerHelp) {
                pokemon[foodName] = (pokemon[foodName] ?? 0) + subPokemon.foodPerHelp[foodName] * helpCount * subPokemon.fixedFoodRate * pokemon.skillPerDay;
              }
            }

          } else if (this.mode == PokemonSimulator.MODE_SELECT) {
            energy = scoreForSupportEvaluate * effect * (skill.name == 'おてつだいブースト' ? 5 : 1) * pokemon.skillEffectRate;
          }
          break;

        case 'げんきエールS':
        case 'げんきオールS':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            // げんき回復量は事前に総合的に計算しているので、ゆびをふるの場合は1回だけ評価
            if (pokemon.skill.name != 'ゆびをふる' || (pokemon.skill.name == 'ゆびをふる' && skill.name == 'げんきエールS')) {

              let cacheKey = `${pokemon.morningHealGenki.toFixed(3)}_${otherMorningHealEffect.toFixed(3)}_${otherDayHealEffect.toFixed(3)}`
              let helpRate = this.helpRateCache.get(cacheKey);
              if(helpRate == null) {
                helpRate = HelpRate.getHelpRate(Math.min(this.config.sleepTime / 8.5, 1) * 100, otherMorningHealEffect, otherDayHealEffect, this.config)
                this.helpRateCache.set(cacheKey, helpRate)
              }

              // 一番つよいポケモンが4匹いるとして、それらのげんきオールによる増分を効果とする
              energy =
                scoreForHealerEvaluate
                * (
                  (helpRate.day * (24 - this.config.sleepTime) + helpRate.night * this.config.sleepTime)
                  / (this.defaultHelpRate.day * (24 - this.config.sleepTime) + this.defaultHelpRate.night * this.config.sleepTime)
                  - 1
                )
                * 4
                / pokemon.skillPerDay;
            }
          }

          break;

        case '食材ゲットS':
          if (this.mode == PokemonSimulator.MODE_ABOUT) {
            if (!this.config.simulation.sundayPrepare) {
              let num = effect / Food.list.length * pokemon.skillPerDay * pokemon.skillEffectRate;
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

              energy = foodEnergy / Food.list.length * effect * pokemon.skillEffectRate;
            }

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            if (!this.config.simulation.sundayPrepare) {
              let num = effect / Food.list.length * pokemon.skillPerDay * pokemon.skillEffectRate;
              for(let food of Food.list) {
                pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num * this.config.simulation.foodGetRate / 100;
              }
            }
          } else if (this.mode == PokemonSimulator.MODE_SELECT) {
            energy = Food.list.reduce((a, food) =>
              a + food.energy * (
                (food.bestRate * Cooking.maxRecipeBonus - 1) * this.config.selectEvaluate.foodGetRate / 100 + 1
              )
              , 0
            ) / Food.list.length * effect * pokemon.skillEffectRate;

          }
          break;

        case 'ゆめのかけらゲットS':
        case 'ゆめのかけらゲットS(ランダム)':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            // energy = effect * this.config.selectEvaluate.shardEnergy * pokemon.skillEffectRate;
            pokemon.shard = effect * pokemon.skillPerDay * pokemon.skillEffectRate;

          } else {
            pokemon.shard = effect * pokemon.skillPerDay * pokemon.skillEffectRate;
          }
          break;

        case '料理パワーアップS':
          if (this.mode == PokemonSimulator.MODE_ABOUT) {
            if (!this.config.simulation.sundayPrepare) {
              // 拡張後と拡張前で出来る料理の差を計算
              let afterPotSize = Math.round(
                (this.config.simulation.potSize + effect)
                * (this.config.simulation.campTicket ? 1.5 : 1)
              );

              let afterBestCooking = this.cookingList.filter(cooking => cooking.foodNum <= afterPotSize)
                .map(cooking => ({
                  ...cooking,
                  lastEnergy: cooking.energy * Cooking.recipeLvs[this.config.simulation.cookingRecipeLv ?? 1] + (afterPotSize - cooking.foodNum) * Food.maxEnergy,
                }))
                .sort((a, b) => b.lastEnergy - a.lastEnergy)[0];

              energy = (afterBestCooking.lastEnergy - this.defaultBestCooking.lastEnergy) * pokemon.skillEffectRate * this.config.simulation.cookingWeight;
            } else {
              energy = Food.averageEnergy * effect * pokemon.skillEffectRate
            }

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            // 効果量だけ記憶しておく
            pokemon.cookingPowerUpEffect = effect * pokemon.skillEffectRate;

          } else if (this.mode == PokemonSimulator.MODE_SELECT) {
            let limit = Math.ceil((Cooking.maxFoodNum - Cooking.potMax) / effect) * 3

            // 通常なべサイズから最大料理
            energy = (
              effect * Cooking.cookingPowerUpEnergy * Math.min(pokemon.skillPerDay * pokemon.skillEffectRate, limit)
              + effect * Food.averageEnergy * Math.max(pokemon.skillPerDay * pokemon.skillEffectRate - limit, 0)
            ) / pokemon.skillPerDay;

          }
          break;

        case '料理チャンスS':
          if (this.mode == PokemonSimulator.MODE_ABOUT) {
            if (!this.config.simulation.sundayPrepare) {
              // チームシミュレーションの際は後で正確に評価、そうでなければ概算評価する
              if (pokemon.skillPerDay) {
                let totalEffect = effect / 100 * pokemon.skillPerDay * pokemon.skillEffectRate * 7;
                energy = (Cooking.getChanceWeekEffect(totalEffect).total - 24.6) / 7 * this.defaultBestCooking.lastEnergy / pokemon.skillPerDay * this.config.simulation.cookingWeight
              }
            }
          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            if (!this.config.simulation.sundayPrepare) {
              // 効果量だけ記憶しておく
              pokemon.cookingChanceEffect = effect / 100 * pokemon.skillPerDay * pokemon.skillEffectRate;
            }

          } else if (this.mode == PokemonSimulator.MODE_SELECT) {
            let totalEffect = effect / 100 * pokemon.skillPerDay * pokemon.skillEffectRate * 7;
            energy = (Cooking.getChanceWeekEffect(totalEffect).total - 24.6) / 7 * Cooking.maxEnergy / pokemon.skillPerDay;
          }

          break;
      }

      if (energy) {
        pokemon.skillEnergyMap[skill.name] = energy;
        pokemon.skillEnergy += energy;
      }
    }

    pokemon.skillEnergyPerDay = pokemon.skillEnergy * pokemon.skillPerDay;

    // ここまでの概算日給
    pokemon.energyPerDay = pokemon.pickupEnergyPerDay + pokemon.skillEnergyPerDay;

    return pokemon;
  }

  // 厳選用評価
  selectEvaluate(basePokemon, lv, foodList, subSkillList, nature, scoreForHealerEvaluate, scoreForSupportEvaluate, timeCounter = null) {

    // timeCounter?.start('calcParameter')
    let result = this.calcParameter(
      {
        ...basePokemon,
        base: basePokemon,
        bag: null,
        lv,
        berry: Berry.map[basePokemon.berry],
        skill: Skill.map[basePokemon.skill],
        skillLv: this.config.selectEvaluate.skillLevel[basePokemon.skill],
        sleepTime: this.config.selectEvaluate.pokemonSleepTime,
      },
      foodList,
      subSkillList,
      nature,
      this.config.selectEvaluate.berryMatchAll || basePokemon.specialty == 'きのみ',
    )
    // timeCounter?.stop('calcParameter')

    // timeCounter?.start('calcStatus')
    this.calcStatus(
      result,
      subSkillList.includes('おてつだいボーナス') ? this.config.selectEvaluate.helpBonus / 5 : 0,
      subSkillList.includes('げんき回復ボーナス') ? 1 : 0,
    )
    // timeCounter?.stop('calcStatus')

    // timeCounter?.start('calcHelp')
    this.calcHelp(
      result,
      result.otherMorningHealEffect,
      result.otherDayHealEffect || (result.selfDayHealEffect ? 0 : this.config.selectEvaluate.healer / 100),
      {
        scoreForHealerEvaluate,
        scoreForSupportEvaluate,
        helpBoostCount: 5,
      },
      timeCounter
    )

    // おてボの残り評価はシンプルに倍率にする
    if (subSkillList.includes('おてつだいボーナス')) {
      result.energyPerDay /= 1 - (25 - this.config.selectEvaluate.helpBonus) * 0.01
    }

    // timeCounter?.stop('calcHelp')

    return result;
  }

  selectEvaluateToScore(pokemon, yumebo, risabo) {
    let score = pokemon.energyPerDay;

    if (yumebo) {
      score *= 1 + 0.06 * this.config.selectEvaluate.shardBonus / 100;
    }
    if (risabo) {
      score *= 1 + 0.06 * this.config.selectEvaluate.shardBonus / 100 / 2;
    }

    score += pokemon.shard * this.config.selectEvaluate.shardEnergy * this.config.selectEvaluate.shardBonus / 100;

    return score;
  }
}

export default PokemonSimulator;
