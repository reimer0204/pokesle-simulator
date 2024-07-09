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
    this.config = config;
    this.mode = mode;
    this.helpRateCache = new Map();

    this.fixedPotSize =
      mode == PokemonSimulator.MODE_SELECT ? Cooking.potMax
      : Math.round(this.config.simulation.potSize * (this.config.simulation.campTicket ? 1.5 : 1))

    // 今週の料理タイプのリスト
    this.cookingList =
      mode == PokemonSimulator.MODE_SELECT ? Cooking.list
      : Cooking.list.filter(cooking => cooking.type == this.config.simulation.cookingType);

    // 現状の鍋のサイズでできる一番いい料理
    this.defaultBestCooking = this.cookingList
      .filter(cooking => cooking.foodNum <= this.fixedPotSize)
      .map(cooking => ({
        ...cooking,
        lastEnergy: cooking.energy * Cooking.recipeLvs[this.config.simulation.cookingRecipeLv ?? 1] + (this.fixedPotSize - cooking.foodNum) * Food.maxEnergy,
      }))
      .sort((a, b) => b.lastEnergy - a.lastEnergy)[0];

      this.calcStatusCache = new Map();

    this.defaultHelpRate = {
      day: HelpRate.getHelpRate(0, this.config.dayHelpParameter),
      night: HelpRate.getHelpRate(0, this.config.nightHelpParameter),
    }
  }

  memberToInfo(pokemon) {

    let base = Pokemon.map[pokemon.name];
    pokemon = {
      ...base,
      ...pokemon,
      fixLv: this.config.simulation.fixLv ? Math.max(this.config.simulation.fixLv, pokemon.lv) : pokemon.lv,
      base,
      berry: Berry.map[base.berry],
      berryName: base.berry,
      skill: Skill.map[base.skill],
      skillName: base.skill,
      // ...FOOD_EMPTY_MAP,
    };

    // 有効なサブスキル計算
    let enableSubSkillList = [];
    if (pokemon.fixLv >=  10) enableSubSkillList.push(pokemon.subSkillList[0]);
    if (pokemon.fixLv >=  25) enableSubSkillList.push(pokemon.subSkillList[1]);
    if (pokemon.fixLv >=  50) enableSubSkillList.push(pokemon.subSkillList[2]);
    if (pokemon.fixLv >=  75) enableSubSkillList.push(pokemon.subSkillList[3]);
    if (pokemon.fixLv >= 100) enableSubSkillList.push(pokemon.subSkillList[4]);

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
      if (this.config.simulation.eventBonusType == base.type) {
        num += this.config.simulation.eventBonusTypeFood;
      }
      enableFoodList.push({
        name: food.name,
        num,
        energy: food.energy * num
          * (this.config.simulation.cookingType ? food.bestTypeRate[this.config.simulation.cookingType] : food.bestRate)
          * Cooking.recipeLvs[this.config.simulation.cookingRecipeLv ?? 1],
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

    // きのみの個数
    result.berryNum = (result.specialty == 'きのみ' ? 2 : 1)
      + (subSkillList.includes('きのみの数S') ? 1 : 0)

    // きのみエナジー/手伝い
    result.berryEnergyPerHelp = result.berryNum
    * Math.max(
      result.berry.energy + result.fixLv - 1,
      result.berry.energy * (1.025 ** (result.fixLv - 1))
    )
    * (berryMatch ? 2 : 1)
    * (this.config.simulation.berryWeight ?? 1)

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
    )

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
    if (this.mode != PokemonSimulator.MODE_SELECT && this.config.simulation.eventBonusType == result.type) {
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

    if (this.mode != PokemonSimulator.MODE_SELECT && this.config.simulation.eventBonusType == result.type) {
      result.fixedSkillRate *= this.config.simulation.eventBonusTypeSkillRate;
    }

    // 天井を考慮したスキル確率
    let ceil = result.specialty == 'スキル' ? 40 * 3600 / result.help : 78;
    result.ceilSkillRate =
      result.fixedSkillRate > 0
      ? result.fixedSkillRate / (1 - Math.pow(1 - result.fixedSkillRate, ceil))
      : 1 / ceil;

    // ゆびをふるの場合は全ての効果量を1/スキル数で評価
    result.skillEffectRate = result.skill.name == 'ゆびをふる' ? (1 / Skill.metronomeTarget.length) : 1;

    // 発動するスキルの一覧(ゆびをふる用)
    result.skillList = result.skill.name == 'ゆびをふる' ? Skill.metronomeTarget : [result.skill];

    return result;
  }

  calcStatus(pokemon, helpBonus) {

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

    // げんき回復系スキル
    let selfHealEffect = 0;
    let otherHealEffect = 0;
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
      let fixedEffectSum = effectSum * (pokemon.nature?.good == 'げんき回復量' ? 1.2 : pokemon.nature?.weak == 'げんき回復量' ? 0.88 : 1)
      if (pokemon.skill.name == 'ゆびをふる') {
        fixedEffectSum = fixedEffectSum / healSkillList.length * healSkillList.length / Skill.metronomeTarget.length;
      }

      let thisHealEffect = HelpRate.getHealEffect({
        p: pokemon.fixedSkillRate,
        speed: pokemon.speed,
        bagSize: pokemon.fixedBag,
        baseDayHelpNum: baseDayHelpNum,
        effect: fixedEffectSum,
      }, this.config.healEffectParameter, this.config);

      for(let skill of healSkillList) {
        if (skill.name == 'げんきチャージS') {
          selfHealEffect += thisHealEffect * effectMap[skill.name] / effectSum;
        } else {
          otherHealEffect += thisHealEffect * effectMap[skill.name] / effectSum;
        }
      }
    }
    pokemon.selfHealEffect = selfHealEffect / (pokemon.nature?.good == 'げんき回復量' ? 1.2 : pokemon.nature?.weak == 'げんき回復量' ? 0.88 : 1);
    pokemon.otherHealEffect = otherHealEffect / (pokemon.nature?.good == 'げんき回復量' ? 1.2 : pokemon.nature?.weak == 'げんき回復量' ? 0.88 : 1);

    return pokemon
  }

  calcHelp(pokemon, otherHealEffect, mode, modeOption = {}) {
    let { pokemonList, helpBoostCount, scoreForHealerEvaluate, scoreForSupportEvaluate, } = modeOption;

    let totalHealEffect = (pokemon.selfHealEffect + otherHealEffect) * (pokemon.nature?.good == 'げんき回復量' ? 1.2 : pokemon.nature?.weak == 'げんき回復量' ? 0.88 : 1);

    let helpRate = this.helpRateCache.get(totalHealEffect);
    if(helpRate == null) {
      helpRate = {
        day: HelpRate.getHelpRate(totalHealEffect, this.config.dayHelpParameter),
        night: HelpRate.getHelpRate(totalHealEffect, this.config.nightHelpParameter),
      }
      this.helpRateCache.set(totalHealEffect, helpRate)
    }
    pokemon.healEffect = totalHealEffect;

    pokemon.dayHelpNum   = (24 - this.config.sleepTime) * 3600 / pokemon.speed * helpRate.day;
    pokemon.nightHelpNum =       this.config.sleepTime  * 3600 / pokemon.speed * helpRate.night;
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
    pokemon.berryEnergyPerDay =
      pokemon.berryEnergyPerHelp * (
        pokemon.normalHelpNum * (1 - pokemon.fixedFoodRate)
        + pokemon.berryHelpNum
      )

    // 食材エナジー/日
    pokemon.foodEnergyPerDay = pokemon.foodEnergyPerHelp * pokemon.normalHelpNum * pokemon.fixedFoodRate;

    // 食材の個数
    for(let food of Food.list) {
      pokemon[food.name] = (pokemon.foodPerHelp[food.name] ?? 0) * pokemon.normalHelpNum * pokemon.fixedFoodRate;
    }

    // きのみor食材エナジー/日
    pokemon.pickupEnergyPerDay = pokemon.berryEnergyPerDay + pokemon.foodEnergyPerDay;

    // スキル発動回数の期待値を計算(チェックごとの確率の総和)
    if (pokemon.fixedBag > 0) {
      pokemon.skillPerDay =
        (1 - (1 - pokemon.ceilSkillRate) ** Math.min(pokemon.dayHelpNum / (this.config.checkFreq - 1), pokemon.bagFullHelpNum)) * (this.config.checkFreq - 1)
        + (1 - (1 - pokemon.ceilSkillRate) ** Math.min(pokemon.nightHelpNum, pokemon.bagFullHelpNum))
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

        case 'おてつだいサポートS':
        case 'おてつだいブースト':

          if (mode == PokemonSimulator.MODE_ABOUT) {
            // あとで概算値計算

          } else if (mode == PokemonSimulator.MODE_TEAM) {
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

            for(let subPokemon of pokemonList) {
              pokemon.berryEnergyPerDay += subPokemon.berryEnergyPerHelp * helpCount * (1 - subPokemon.fixedFoodRate);
              for(let foodName in subPokemon.foodPerHelp) {
                pokemon[foodName] = (pokemon[foodName] ?? 0) + subPokemon.foodPerHelp[foodName] * helpCount * subPokemon.fixedFoodRate;
              }
            }

          } else if (mode == PokemonSimulator.MODE_SELECT) {
            energy = scoreForSupportEvaluate * effect * (skill.name == 'おてつだいブースト' ? 5 : 1) * pokemon.skillEffectRate;
          }
          break;

        case 'げんきエールS':
        case 'げんきオールS':
          if (mode == PokemonSimulator.MODE_SELECT) {
            // げんき回復量は事前に総合的に計算しているので、ゆびをふるの場合は1回だけ評価
            if (pokemon.skill.name != 'ゆびをふる' || (pokemon.skill.name == 'ゆびをふる' && skill.name == 'げんきエールS')) {
              let helpRate = this.helpRateCache.get(otherHealEffect);
              if(helpRate == null) {
                helpRate = {
                  day: HelpRate.getHelpRate(otherHealEffect, this.config.dayHelpParameter),
                  night: HelpRate.getHelpRate(otherHealEffect, this.config.nightHelpParameter),
                }
                this.helpRateCache.set(otherHealEffect, helpRate)
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
          if (mode == PokemonSimulator.MODE_ABOUT) {
            if (!this.config.simulation.sundayPrepare) {
              let num = effect / Food.list.length * pokemon.skillPerDay * pokemon.skillEffectRate;
              let foodEnergy = 0;
              for(let food of Food.list) {
                pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num * this.config.simulation.foodGetRate / 100;
                foodEnergy += food.energy
                  * (
                    (
                      (this.config.simulation.cookingType ? food.bestTypeRate[this.config.simulation.cookingType] : food.bestRate)
                      * Cooking.recipeLvs[this.config.simulation.cookingRecipeLv ?? 1]
                      - 1
                    ) * this.config.simulation.foodGetRate / 100
                    + 1
                  )
                  * this.config.simulation.cookingWeight
              }

              energy = foodEnergy / Food.list.length * effect * pokemon.skillEffectRate;
            }

          } else if (mode == PokemonSimulator.MODE_TEAM) {
            if (!this.config.simulation.sundayPrepare) {
              let num = effect / Food.list.length * pokemon.skillPerDay * pokemon.skillEffectRate;
              for(let food of Food.list) {
                pokemon[food.name] = Number(pokemon[food.name] ?? 0) + num * this.config.simulation.foodGetRate / 100;
              }
            }
          } else if (mode == PokemonSimulator.MODE_SELECT) {
            energy = Food.list.reduce((a, food) =>
              a + food.energy * (
                (food.bestRate * Cooking.maxRecipeBonus - 1) * this.config.selectEvaluate.foodEnergyRate / 100 + 1
              )
              , 0
            ) / Food.list.length * effect * pokemon.skillEffectRate;

          }
          break;

        case 'ゆめのかけらゲットS':
        case 'ゆめのかけらゲットS(ランダム)':
          if (mode == PokemonSimulator.MODE_SELECT) {
            energy = effect * this.config.selectEvaluate.shardEnergy * pokemon.skillEffectRate;

          } else {
            pokemon.shard = effect * pokemon.skillPerDay * pokemon.skillEffectRate;
          }
          break;

        case '料理パワーアップS':
          if (mode == PokemonSimulator.MODE_ABOUT) {
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

          } else if (mode == PokemonSimulator.MODE_TEAM) {
            // 効果量だけ記憶しておく
            pokemon.cookingPowerUpEffect = effect * pokemon.skillPerDay * pokemon.skillEffectRate;

          } else if (mode == PokemonSimulator.MODE_SELECT) {
            // 通常なべサイズから最大料理
            energy = effect * Cooking.cookingPowerUpEnergy * pokemon.skillEffectRate;

          }
          break;

        case '料理チャンスS':
          if (mode == PokemonSimulator.MODE_ABOUT) {
            if (!this.config.simulation.sundayPrepare) {
              // チームシミュレーションの際は後で正確に評価、そうでなければ概算評価する
              if (pokemon.skillPerDay) {
                let totalEffect = effect / 100 * pokemon.skillPerDay * pokemon.skillEffectRate * 7;
                energy = (Cooking.getChanceWeekEffect(totalEffect).total - 24.6) / 7 * this.defaultBestCooking.lastEnergy / pokemon.skillPerDay * this.config.simulation.cookingWeight
              }
            }
          } else if (mode == PokemonSimulator.MODE_TEAM) {
            if (!this.config.simulation.sundayPrepare) {
              // 効果量だけ記憶しておく
              pokemon.cookingChanceEffect = effect / 100 * pokemon.skillPerDay * pokemon.skillEffectRate;
            }

          } else if (mode == PokemonSimulator.MODE_SELECT) {
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
  selectEvaluate(basePokemon, lv, foodList, subSkillList, nature, scoreForHealerEvaluate, scoreForSupportEvaluate) {
    let result = this.calcParameter(
      {
        ...basePokemon,
        base: basePokemon,
        bag: null,
        lv,
        berry: Berry.map[basePokemon.berry],
        skill: Skill.map[basePokemon.skill],
        skillLv: this.config.selectEvaluate.skillLevel[basePokemon.skill],
      },
      foodList,
      subSkillList,
      nature,
      this.config.selectEvaluate.berryMatchAll || basePokemon.specialty == 'きのみ',
      PokemonSimulator.MODE_SELECT,
    )

    this.calcStatus(
      result,
      subSkillList.includes('おてつだいボーナス') ? this.config.selectEvaluate.helpBonus / 5 : 0,
      PokemonSimulator.MODE_SELECT,
    )

    this.calcHelp(
      result,
      result.otherHealEffect || (result.selfHealEffect ? 0 : this.config.selectEvaluate.healer),
      PokemonSimulator.MODE_SELECT,
      {
        scoreForHealerEvaluate,
        scoreForSupportEvaluate,
        helpBoostCount: 5,
      }
    )

    // おてボの残り評価はシンプルに倍率にする
    if (subSkillList.includes('おてつだいボーナス')) {
      result.energyPerDay /= 1 - (25 - this.config.selectEvaluate.helpBonus) * 0.01
    }

    if (subSkillList.includes('ゆめのかけらボーナス')) {
      result.energyPerDay *= 1 + 0.06 * this.config.selectEvaluate.shardBonus / 100;
    }
    if (subSkillList.includes('リサーチEXPボーナス')) {
      result.energyPerDay *= 1 + 0.06 * this.config.selectEvaluate.shardBonus / 100 / 2;
    }

    return result;
  }
}

export default PokemonSimulator;
