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
    this.cookingList = Cooking.evaluateLvList(config)
    this.cookingList =
      mode == PokemonSimulator.MODE_SELECT ? this.cookingList
      : this.cookingList.filter(c => c.type == this.config.simulation.cookingType && (c.enable || c.foodNum == 0));

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
    this.defaultBestCooking = this.cookingList
      .filter(cooking => cooking.foodNum <= this.fixedPotSize)
      .map(cooking => ({
        ...cooking,
        lastEnergy: cooking.fixEnergy + (this.fixedPotSize - cooking.foodNum) * Food.maxEnergy,
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
      skillLv: pokemon.fixable && this.config.simulation.fixSkillSeed ? skill.effect.length : pokemon.skillLv,
      // ...FOOD_EMPTY_MAP,
      eventBonus:
        this.config.simulation.eventBonusType == 'all'
        || this.config.simulation.eventBonusType == base.type
        || this.config.simulation.eventBonusType == base.specialty,
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
      let num = base.foodList.find(baseFood => baseFood.name == food.name)?.numList[i] ?? 0;
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
  calcParameter(pokemon, foodList, subSkillList, nature, berryMatch) {
    if (pokemon.fixLv == null) pokemon.fixLv = pokemon.lv

    pokemon.cookingPowerUpEffect = 0;
    pokemon.cookingChanceEffect = 0;
    pokemon.supportScorePerDay = 0;
    pokemon.shard = 0;
    pokemon.enableFoodList = foodList;
    pokemon.enableSubSkillList = subSkillList;
    pokemon.nature = nature;
    pokemon.natureName = nature?.name,
    pokemon.sleepTime ??= 0;

    // きのみの個数
    pokemon.berryNum = (pokemon.specialty == 'きのみ' ? 2 : 1)
      + (subSkillList.includes('きのみの数S') ? 1 : 0)

    // きのみエナジー/手伝い
    pokemon.berryEnergy = Math.max(
      pokemon.berry.energy + pokemon.fixLv - 1,
      pokemon.berry.energy * (1.025 ** (pokemon.fixLv - 1))
    )
    * (berryMatch ? 2 : 1)
    * (this.config.simulation.berryWeight ?? 1)

    pokemon.berryEnergyPerHelp = pokemon.berryEnergy * pokemon.berryNum

    // 食材確率
    pokemon.fixedFoodRate = pokemon.foodRate
      * (
        1
        + (subSkillList.includes('食材確率アップS') ? 0.18 : 0)
        + (subSkillList.includes('食材確率アップM') ? 0.36 : 0)
      )
      * (nature?.good == '食材お手伝い確率' ? 1.2 : nature?.weak == '食材お手伝い確率' ? 0.8 : 1)

    // 食材数/手伝い
    pokemon.foodNum = pokemon.enableFoodList.reduce((a, x) => a + x.num, 0) / pokemon.enableFoodList.length;

    // 食材エナジー/手伝い
    pokemon.foodEnergyPerHelp = pokemon.enableFoodList.reduce((a, x) => a + x.energy, 0)
      / pokemon.enableFoodList.length;

    if (this.mode != PokemonSimulator.MODE_SELECT) {
      pokemon.foodEnergyPerHelp *= this.config.simulation.cookingWeight;
    }

    // 食材/手伝い
    pokemon.foodPerHelp = {}
    for(let food of pokemon.enableFoodList) {
      pokemon.foodPerHelp[food.name] = (pokemon.foodPerHelp[food.name] ?? 0) + Number(food.num) / pokemon.enableFoodList.length;
    }


    // きのみor食材エナジー/手伝い
    pokemon.pickupEnergyPerHelp =
      pokemon.berryEnergyPerHelp * (1 - pokemon.fixedFoodRate)
      + pokemon.foodEnergyPerHelp * pokemon.fixedFoodRate;


    // 最大所持数計算
    pokemon.fixedBag = pokemon.bag ?? (
      pokemon.base.bag + (pokemon.base.evolveLv - 1) * 5
      + (subSkillList.includes('最大所持数アップS') ? 6 : 0)
      + (subSkillList.includes('最大所持数アップM') ? 12 : 0)
      + (subSkillList.includes('最大所持数アップL') ? 18 : 0)
    );
    if (pokemon.sleepTime >=  200) pokemon.fixedBag += 1;
    if (pokemon.sleepTime >=  500) pokemon.fixedBag += 2;
    if (pokemon.sleepTime >= 1000) pokemon.fixedBag += 3;
    if (pokemon.sleepTime >= 2000) pokemon.fixedBag += 2;
    if (this.mode != PokemonSimulator.MODE_SELECT && this.config.simulation.campTicket) {
      pokemon.fixedBag *= 1.2;
    }

    // いつ育到達は所持数がいっぱい＋4回(キュー消化分)以降
    pokemon.bagFullHelpNum = Math.max(pokemon.fixedBag / (
      pokemon.berryNum * (1 - pokemon.fixedFoodRate)
      + pokemon.foodNum * pokemon.fixedFoodRate
    ) + 4, 0);

    // スキルレベル計算
    pokemon.fixedSkillLv = pokemon.skillLv ?? (
      pokemon.evolveLv
      + (subSkillList.includes('スキルレベルアップS') ? 1 : 0)
      + (subSkillList.includes('スキルレベルアップM') ? 2 : 0)
    )
    if (this.mode != PokemonSimulator.MODE_SELECT && pokemon.eventBonus) {
      pokemon.fixedSkillLv += this.config.simulation.eventBonusTypeSkillLv;
    }
    if (pokemon.fixedSkillLv < 1) pokemon.fixedSkillLv = 1;
    if (pokemon.fixedSkillLv > pokemon.skill.effect.length) pokemon.fixedSkillLv = pokemon.skill.effect.length;

    // スキル確率
    pokemon.fixedSkillRate = pokemon.skillRate
      * (
        1
        + (subSkillList.includes('スキル確率アップS') ? 0.18 : 0)
        + (subSkillList.includes('スキル確率アップM') ? 0.36 : 0)
      )
      * (nature?.good == 'メインスキル発生確率' ? 1.2 : nature?.weak == 'メインスキル発生確率' ? 0.8 : 1)

    if (this.mode != PokemonSimulator.MODE_SELECT && pokemon.eventBonus) {
      pokemon.fixedSkillRate *= this.config.simulation.eventBonusTypeSkillRate;
    }

    // 天井を考慮したスキル確率
    pokemon.skillCeil = pokemon.specialty == 'スキル' ? 40 * 3600 / pokemon.help : 78;
    pokemon.ceilSkillRate =
      pokemon.fixedSkillRate > 0
      ? pokemon.fixedSkillRate / (1 - Math.pow(1 - pokemon.fixedSkillRate, pokemon.skillCeil))
      : 1 / pokemon.skillCeil;

    // 発動するスキルの一覧(ゆびをふる用)
    if (pokemon.skill.name == 'ゆびをふる') {
      pokemon.skillList = Skill.metronomeWeightMap;
    } else {
      pokemon.skillList = {[pokemon.skill.name]: { skill: pokemon.skill, weight: 1 }}
    }

    return pokemon;
  }

  // チームによって決まる値の計算
  calcStatus(pokemon, helpBonus, genkiHealBonus = 0, pokemonList = null) {

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
    

    // 特定のスキルの場合はチームのスキル一覧に変換
    if (pokemonList) {
      if (pokemon.skill.name == 'へんしん(スキルコピー)' || pokemon.skill.name == 'ものまね(スキルコピー)') {
        pokemon.skillList = {};
        for(let subPokemon of pokemonList) {
          if (pokemon != subPokemon) {
            let list;
            if (subPokemon.skill.name == 'へんしん(スキルコピー)' || subPokemon.skill.name == 'ものまね(スキルコピー)') {
              list = [{ skill: Skill.map['エナジーチャージS'], weight: 1 }]
            } else {
              list = Object.values(pokemon.skillList)
            }
            for(let { skill, weight } of list) {
              pokemon.skillList[skill.name] = { skill, weight: (pokemon.skillList[skill.name]?.weight ?? 0) + weight / 4 }
            }
          }
        }
      }
    }


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
      let healSkillList = 
        pokemon.skill.genki ? [pokemon.skill] :
        Object.values(pokemon.skillList).filter(x => x.genki);

      if (healSkillList?.length) {
        let selfEffectSum = 0;
        let otherEffectSum = 0;
        for(let skill of healSkillList) {
          const effect = skill.effect[(skill.effect.length >= pokemon.fixedSkillLv ? pokemon.fixedSkillLv : skill.effect.length) - 1];
          selfEffectSum += effect.self ?? 0;
          otherEffectSum += effect.other ?? 0;
        }
        const effectSum = selfEffectSum + otherEffectSum

        let fixedEffectSum = effectSum * pokemon.natureGenkiMultiplier
        if (pokemon.skill.name == 'ゆびをふる') {
          fixedEffectSum /= Skill.metronomeTarget.length;
        }
  
        let cacheKey = fixedEffectSum ? `${pokemon.morningHealGenki.toFixed(3)}_${pokemon.fixedSkillRate.toFixed(3)}_${pokemon.speed.toFixed(3)}_${pokemon.bagFullHelpNum.toFixed(3)}_${pokemon.skillCeil.toFixed(3)}_${fixedEffectSum.toFixed(3)}` : ``
        let cache = this.helpEffectCache.get(cacheKey);
        if(cache == null) {
          cache = fixedEffectSum ? HelpRate.getHealEffect(pokemon, fixedEffectSum, this.config) : [0, 0];
          this.helpEffectCache.set(cacheKey, cache)
        }
        let [morningHealEffect, dayHealEffect] = cache;
  
        selfMorningHealEffect += morningHealEffect * selfEffectSum / effectSum;
        selfDayHealEffect += dayHealEffect * selfEffectSum / effectSum;
        otherMorningHealEffect += morningHealEffect * otherEffectSum / effectSum;
        otherDayHealEffect += dayHealEffect * otherEffectSum / effectSum;
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

    for(let { skill, weight } of Object.values(pokemon.skillList)) {
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

        case 'ばけのかわ(きのみバースト)':
        case 'きのみバースト': {
          if (this.mode == PokemonSimulator.MODE_ABOUT) {
            energy = pokemon.berryEnergy * effect.self
            // 他メンバーのエナジーはあとで計算
            pokemon.burstBonus = effect.other;

          } else if (this.mode == PokemonSimulator.MODE_TEAM) {
            energy = 0
            for(let subPokemon of pokemonList) {
              energy += pokemon.berryEnergy * (pokemon == subPokemon ? effect.self : effect.other);
            }

          } else if (this.mode == PokemonSimulator.MODE_SELECT) {
            energy = 
              pokemon.berryEnergy * effect.self
              + Math.max(Berry.map['ヤチェ'].energy + pokemon.fixLv - 1, Berry.map['ヤチェ'].energy * (1.025 ** (pokemon.fixLv - 1))) * effect.other * 4;
          }

          if (skill.name == 'ばけのかわ(きのみバースト)') {
            let success = 1 - ((1 - skill.success) ** pokemon.skillPerDay);
            energy *= (success * (pokemon.skillPerDay + 2) + (1 - success) * pokemon.skillPerDay) / pokemon.skillPerDay;
          }

          break;
        }

        case 'おてつだいサポートS':
        case 'おてつだいブースト':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            energy = scoreForSupportEvaluate * (skill.name == 'おてつだいブースト' ? effect.max * 5 : effect);

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
              helpCount += effect.team[helpBoostCount - 1]
            }

            energy = 0;
            for(let subPokemon of pokemonList) {
              energy += subPokemon.berryEnergyPerHelp * helpCount * (1 - subPokemon.fixedFoodRate);
              for(let foodName in subPokemon.foodPerHelp) {
                pokemon[foodName] = (pokemon[foodName] ?? 0) + subPokemon.foodPerHelp[foodName] * helpCount * subPokemon.fixedFoodRate * pokemon.skillPerDay * weight;
              }
            }
            
          }
          break;

        case '食材ゲットS':
          if (this.mode == PokemonSimulator.MODE_SELECT) {
            energy = Food.list.reduce((a, food) =>
              a + food.energy * (
                (food.bestRate * Cooking.maxRecipeBonus - 1) * this.config.selectEvaluate.foodGetRate / 100 + 1
              )
              , 0
            ) / Food.list.length * effect;

          } else if (this.mode == PokemonSimulator.MODE_ABOUT) {
            if (!this.config.simulation.sundayPrepare) {
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

              energy = foodEnergy / Food.list.length * effect;
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

        case 'ゆめのかけらゲットS':
        case 'ゆめのかけらゲットS(ランダム)':
          pokemon.shard = effect * pokemon.skillPerDay * weight;
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
            if (!this.config.simulation.sundayPrepare) {
              // 拡張後と拡張前で出来る料理の差を計算
              let afterPotSize = Math.round(
                (this.config.simulation.potSize + effect)
                * (this.config.simulation.campTicket ? 1.5 : 1)
              );

              let afterBestCooking = this.cookingList.filter(cooking => cooking.foodNum <= afterPotSize)
                .map(cooking => ({
                  ...cooking,
                  lastEnergy: cooking.fixEnergy + (afterPotSize - cooking.foodNum) * Food.maxEnergy,
                }))
                .sort((a, b) => b.lastEnergy - a.lastEnergy)[0];

              energy = (afterBestCooking.lastEnergy - this.defaultBestCooking.lastEnergy) * this.config.simulation.cookingWeight;
            } else {
              energy = Food.averageEnergy * effect
            }

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
                energy = (Cooking.getChanceWeekEffect(totalEffect).total - 24.6) / 7 * this.defaultBestCooking.lastEnergy / pokemon.skillPerDay * this.config.simulation.cookingWeight / weight
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
    if (pokemon.otherMorningHealEffect > 0 && this.mode == PokemonSimulator.MODE_SELECT) {
      // げんき回復量は事前に総合的に計算しているので、ゆびをふるの場合は1回だけ評価
      let cacheKey = `${pokemon.morningHealGenki.toFixed(3)}_${otherMorningHealEffect.toFixed(3)}_${otherDayHealEffect.toFixed(3)}`
      let helpRate = this.helpRateCache.get(cacheKey);
      if(helpRate == null) {
        helpRate = HelpRate.getHelpRate(Math.min(this.config.sleepTime / 8.5, 1) * 100, otherMorningHealEffect, otherDayHealEffect, this.config)
        this.helpRateCache.set(cacheKey, helpRate)
      }

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
        
      pokemon.skillEnergyMap[pokemon.skill.name] = (pokemon.skillEnergyMap[pokemon.skill.name] ?? 0) + energy;
      pokemon.skillEnergy += energy;
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
