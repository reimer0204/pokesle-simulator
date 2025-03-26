import type { PokemonBoxType, PokemonType, SimulatedPokemon } from "@/type";
import { Food, Cooking } from "../../data/food_and_cooking";
import Pokemon from "../../data/pokemon";
import Skill from "../../data/skill";
import SubSkill from "../../data/sub-skill";
import HelpRate from "../help-rate";
import PokemonFilter from "../pokemon-filter";
import PokemonSimulator from "../simulation/pokemon-simulator";
import Nature from "../../data/nature";

let simulator: PokemonSimulator;
let evaluateSimulator: PokemonSimulator;
let config: any;

addEventListener('message', async (event) => {
  let type = event.data.type;

  if (type == 'config') {
    await PokemonSimulator.isReady;
    config = event.data.config;
    simulator = new PokemonSimulator(config, PokemonSimulator.MODE_ABOUT);
    evaluateSimulator = new PokemonSimulator(config, PokemonSimulator.MODE_SELECT);
    
    postMessage({
      status: 'success',
      body: null,
    })
  }

  if (type == 'basic') {
    let pokemonList: PokemonBoxType[] = event.data.pokemonList; 
    let evaluateTable = event.data.evaluateTable;

    let result: SimulatedPokemon[] = [];
    let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))

    let fixablePokemonIndexSet = null;
    if (config.simulation.fix) {
      fixablePokemonIndexSet = new Set(PokemonFilter.filter(pokemonList, config.simulation.fixFilter).pokemonList.map(x => x.index));
    }

    for(let i = 0; i < pokemonList.length; i++) {
      const box: PokemonBoxType = pokemonList[i];
      const base: PokemonType = Pokemon.map[pokemonList[i].name];
      let addPokemonList = []
      let evaluateResult: { [type: number | string]: { [key: string]: {
        name: string,
        rate: number,
        ratio: number,
        score: number,
        energy: number,
      }}} | null = null;
      let evaluateSpecialty: { [type: number | string]: { [key: string]: {
        name: string,
        rate: number,
        ratio: number,
        score: number,
        num: number,
      }}} | null = null;
      let fix = false;

      // 厳選
      if (evaluateTable) {
        evaluateResult = {}
        evaluateSpecialty = {}
        let foodIndexList = pokemonList[i].foodList.map(foodName => base.foodNameList.findIndex(baseFood => baseFood == foodName))
        if (!foodIndexList.includes(-1)) {

          for(let after of base.afterList) {
            if (!evaluateTable[after]) {
              continue;
            }

            let afterPokemon = Pokemon.map[after];
            let evaluateMaxScore = 0;
            let evaluateSpecialtyMaxScore = 0;
            
            for(let lv of lvList) {
              if (evaluateResult[lv] == null) evaluateResult[lv] = {};
              if (evaluateSpecialty[lv] == null) evaluateSpecialty[lv] = {};
              
              let foodNum = lv < 30 ? 1 : lv < 60 ? 2 : 3;

              const simulatedPokemon = evaluateSimulator.fromEvaluate(
                afterPokemon, lv, pokemonList[i].foodList,
              )

              let subSkillNum = lv < 10 ? 0 : lv < 25 ? 1 : lv < 50 ? 2 : lv < 75 ? 3 : lv < 100 ? 4 : 5;

              let subSkillList: string[] = (
                config.selectEvaluate.silverSeedUse ? SubSkill.useSilverSeed(box.subSkillList) : box.subSkillList
              ).slice(0, subSkillNum);

              
              // 計算
              let selectEvaluate = evaluateSimulator.selectEvaluate(
                simulatedPokemon,
                subSkillList.map(x => SubSkill.map[x]),
                Nature.map[box.nature], 
                evaluateTable.scoreForHealerEvaluate[lv], evaluateTable.scoreForSupportEvaluate[lv]
              )
              let score = evaluateSimulator.selectEvaluateToScore(
                selectEvaluate, 
                subSkillList.includes('ゆめのかけらボーナス'), 
                subSkillList.includes('リサーチEXPボーナス')
              )
              
              let specialtyScore: number = 0;
              if (afterPokemon.specialty == 'きのみ') specialtyScore = selectEvaluate.berryNumPerDay;
              if (afterPokemon.specialty == '食材')   specialtyScore = selectEvaluate.foodNumPerDay;
              if (afterPokemon.specialty == 'スキル') specialtyScore = selectEvaluate.skillPerDay;

              function getRate(list: number[], num: number) {
                let max = list.length - 1;
                let percentileLower = Math.min(Math.max(list.findLastIndex(x => x <= num), 0), max)
                let percentileUpper = list[percentileLower] >= num ? percentileLower : Math.min(percentileLower + 1, max);

                return percentileUpper == percentileLower ? percentileUpper / max
                  : ((num - list[percentileLower]) / (list[percentileUpper] - list[percentileLower]) + percentileLower) / max
              }

              // 総合スコアの厳選状況
              let percentileList = evaluateTable[after][lv][foodIndexList.slice(0, foodNum).join('')]?.percentile ?? [];
              let rate = getRate(percentileList, score)
              let ratio = score / percentileList[config.simulation.selectBorder];
              let item = {
                name: after,
                rate, ratio,
                score: config.simulation.selectType == 0 ? rate : ratio,
                energy: score,
              };
              evaluateResult[lv][after] = item
              evaluateMaxScore = Math.max(evaluateMaxScore, item.score)

              // とくい分野の厳選状況
              let specialtyNumList = evaluateTable[after][lv][foodIndexList.slice(0, foodNum).join('')]?.specialtyNumList ?? [];
              let specialtyRate = getRate(specialtyNumList, specialtyScore)
              let specialtyRatio = specialtyScore / specialtyNumList[config.simulation.selectBorder];
              let specialtyItem = {
                name: after,
                rate: specialtyRate, 
                ratio: specialtyRatio,
                score: config.simulation.selectType == 0 ? specialtyRate : specialtyRatio,
                num: specialtyScore,
              };
              evaluateSpecialty[lv][after] = specialtyItem
              evaluateSpecialtyMaxScore = Math.max(evaluateSpecialtyMaxScore, specialtyItem.score)
            }

            let thisFix = config.simulation.fix && fixablePokemonIndexSet.has(box.index) && (
              evaluateMaxScore >= config.simulation.fixBorder / 100
              || evaluateSpecialtyMaxScore >= config.simulation.fixBorderSpecialty / 100
            );
            fix ||= thisFix

            // 最終進化想定シミュをする場合、別個体に切り出し
            if (thisFix && config.simulation.fixEvolve) {
              addPokemonList.push(after)
            }
          }
        }
      }

      if (addPokemonList.length == 0) {
        addPokemonList.push(box.name);
      }

      for(let pokemonName of addPokemonList) {

        const simulatedPokemon = simulator.fromBox({ ...pokemonList[i], name: pokemonName }, fix);
        simulatedPokemon.beforeName = pokemonList[i].name;
        result.push(simulatedPokemon)

        if (evaluateResult && evaluateSpecialty) {
          if (pokemonName == box.name) {
            simulatedPokemon.evaluateResult = evaluateResult;
            simulatedPokemon.evaluateSpecialty = evaluateSpecialty;

          } else {
            simulatedPokemon.evaluateResult = {}
            simulatedPokemon.evaluateSpecialty = {}

            for(let lv of lvList) {
              simulatedPokemon.evaluateResult[lv] = {
                [pokemonName]: evaluateResult[lv][pokemonName],
              }
              simulatedPokemon.evaluateSpecialty[lv] = {
                [pokemonName]: evaluateSpecialty[lv][pokemonName],
              }
            }
          }
          
          if (simulatedPokemon.evaluateResult) {
            simulatedPokemon.evaluateResult.max = {};
            simulatedPokemon.evaluateSpecialty.max = {};
            for(let after of Object.keys(simulatedPokemon.evaluateResult[lvList[0]])) {
              simulatedPokemon.evaluateResult.max[after] = lvList.map(lv => simulatedPokemon.evaluateResult[lv][after]).sort((a, b) => b.score - a.score)[0];
              simulatedPokemon.evaluateSpecialty.max[after] = lvList.map(lv => simulatedPokemon.evaluateSpecialty[lv][after]).sort((a, b) => b.score - a.score)[0];
            }
            for(let lv of [...lvList, 'max']) {
              simulatedPokemon.evaluateResult[lv].best = Object.values(simulatedPokemon.evaluateResult[lv]).sort((a, b) => b.score - a.score)[0];
              simulatedPokemon[`evaluate_${lv}`] = simulatedPokemon.evaluateResult[lv].best.score;
              simulatedPokemon[`evaluate_energy_${lv}`] = simulatedPokemon.evaluateResult[lv].best.energy;
              simulatedPokemon.evaluateSpecialty[lv].best = Object.values(simulatedPokemon.evaluateSpecialty[lv]).sort((a, b) => b.score - a.score)[0];
              simulatedPokemon[`specialty_percentile_${lv}`] = simulatedPokemon.evaluateSpecialty[lv].best.score;
              simulatedPokemon[`specialty_num_${lv}`] = simulatedPokemon.evaluateSpecialty[lv].best.num;
            }
          }
        }
      }
    }
    
    if (config.simulation.bagOverOperation) {
      result.push(
        ...result
        .filter(x => x.base.specialty == 'きのみ' || x.subSkillNameList?.includes('きのみの数S'))
        .map(pokemon => {
          return {
            ...pokemon,
            bagOverOperation: true,
            bag: -100,
            foodRate: 0,
            skillRate: 0,
            ceilSkillRate: 0,
          }
        })
      )
    }

    for(let pokemon of result) {
      simulator.calcStatus(
        pokemon,
        pokemon.subSkillNameList?.includes('おてつだいボーナス') ? 1 : 0,
        pokemon.subSkillNameList?.includes('げんき回復ボーナス') ? 1 : 0,
      )

      simulator.calcHelp(
        pokemon,
        0,
        0,
      )

      pokemon.tmpScore = pokemon.energyPerDay * (100 + config.simulation.fieldBonus) / 100;
      pokemon.tmpScore += (
        pokemon.tmpScore * (config.simulation.researchRankMax ? 0.5 : 0)
        + pokemon.shard * config.selectEvaluate.shardEnergyRate / 4
      ) * config.simulation.shardWeight / 100;
    }
    
    postMessage({
      status: 'success',
      body: result,
    })
  }

  if (type == 'assist') {
    let {
      pickupEnergyPerHelpTop5,
      healCheckTarget,
    } = event.data;
    let pokemonList: SimulatedPokemon[] = event.data.pokemonList;
    let helpBonusTop6: SimulatedPokemon[] = event.data.helpBonusTop6;
    let berryEnergyTop5: SimulatedPokemon[] = event.data.berryEnergyTop5;

    let helpRateCache = new Map();

    // 他メンバーに影響を与える要素について計算
    for(const pokemon of pokemonList) {
      pokemon.supportScorePerDay = 0;
      pokemon.supportEnergyPerDay = 0;
  
      if (pokemon.subSkillNameList?.includes('おてつだいボーナス')) {
        // 概算日給の高い上位6匹から自身を除外し、上位4匹のおてスピが70%→65%になった時の増加量をおてボの効果とする
        for(let subPokemon of helpBonusTop6.filter(x => x.box.index != pokemon.box.index).slice(0, 4)) {
          pokemon.supportEnergyPerDay += subPokemon.energyPerDay * (0.70 / 0.65 - 1)
  
          pokemon.supportScorePerDay += subPokemon.shard * (0.70 / 0.65 - 1) * config.simulation.shardWeight / 100
        }
      }
  
      if (pokemon.subSkillNameList?.includes('ゆめのかけらボーナス')) {
        // 概算日給の高い上位6匹から自身を除外した上位4匹＋自身の6%分のエナジーをゆめボの効果とする
        for(let subPokemon of [...helpBonusTop6.filter(x => x.box.index != pokemon.box.index).slice(0, 4), pokemon]) {
          pokemon.supportEnergyPerDay += subPokemon.energyPerDay * 0.06 * config.simulation.shardWeight / 100
        }
      }
  
      if (config.simulation.researchRankMax && pokemon.subSkillNameList?.includes('リサーチEXPボーナス')) {
        // 概算日給の高い上位6匹から自身を除外し、上位4匹の3%分のエナジーをリサボの効果とする
        for(let subPokemon of [...helpBonusTop6.filter(x => x.box.index != pokemon.box.index).slice(0, 4), pokemon]) {
          pokemon.supportEnergyPerDay += subPokemon.energyPerDay * 0.03 * config.simulation.shardWeight / 100
        }
      }

      // げんき回復系スキル評価
      if (pokemon.otherMorningHealEffect > 0 || pokemon.otherDayHealEffect > 0) {

        let healedAddEnergyList = healCheckTarget.map(subPokemon => {
          if (subPokemon.box.index == pokemon.box.index) return 0;

          let totalMorningHealEffect = subPokemon.morningHealEffect + pokemon.otherMorningHealEffect * subPokemon.natureGenkiMultiplier;
          let totalDayHealEffect = subPokemon.dayHealEffect + pokemon.otherDayHealEffect * subPokemon.natureGenkiMultiplier;
          let cacheKey = `${subPokemon.morningHealGenki.toFixed(8)}_${totalMorningHealEffect.toFixed(8)}_${totalDayHealEffect.toFixed(8)}`
          let helpRate = helpRateCache.get(cacheKey);
          if(helpRate == null) {
            helpRate = HelpRate.getHelpRate(subPokemon.morningHealGenki, totalMorningHealEffect, totalDayHealEffect, config)
            helpRateCache.set(cacheKey, helpRate)
          }

          let dayHelpNum = (24 - config.sleepTime) * 3600 / subPokemon.speed * helpRate.day;
          let nightHelpNum = config.sleepTime  * 3600 / subPokemon.speed * helpRate.night;
          let healedAddEnergy = subPokemon.tmpScore * Math.max((dayHelpNum + nightHelpNum) / (subPokemon.dayHelpNum + subPokemon.nightHelpNum) - 1, 0);
          
          return healedAddEnergy;
        });

        pokemon.supportScorePerDay += healedAddEnergyList.sort((a, b) => b - a).slice(0, 4).reduce((a, x) => a + x, 0);
      }
  
      if (pokemon.bag > 0) {
        for(let { skill, weight} of pokemon.skillWeightList) {
          let supportSkillEnergy = 0;
          let effect = skill.effect[(skill.effect.length >= pokemon.fixedSkillLv ? pokemon.fixedSkillLv : skill.effect.length) - 1];
          switch(skill.name) {
            case 'ばけのかわ(きのみバースト)':
            case 'きのみバースト': {
              let berryEnergySum = [...berryEnergyTop5.filter(x => x.box.index != pokemon.box.index).slice(0, 4)].reduce((a, x) => a + x.berryEnergy, 0)

              if (skill.name == 'ばけのかわ(きのみバースト)') {
                let success = 1 - ((1 - skill.success) ** pokemon.skillPerDay);
                pokemon.supportEnergyPerDay += berryEnergySum * pokemon.burstBonus * (success * (pokemon.skillPerDay + 2) + (1 - success) * pokemon.skillPerDay) / pokemon.skillPerDay;
              } else {
                pokemon.supportEnergyPerDay += berryEnergySum * pokemon.burstBonus;
              }
              break;
            }
            
            case 'おてつだいサポートS':
            case 'おてつだいブースト':
              let pickupEnergySum = [...pickupEnergyPerHelpTop5.filter(x => x.box.index != pokemon.box.index).slice(0, 4), pokemon].reduce((a, x) => a + x.pickupEnergyPerHelp, 0)
              pokemon.supportEnergyPerDay += pickupEnergySum * (skill.name == 'おてつだいブースト' ? effect.max : effect / 5);
              break;
          }
          if (supportSkillEnergy) {
            pokemon.supportEnergyPerDay += supportSkillEnergy * pokemon.skillPerDay * weight
          }
        }
      }
  
      // 最終的なスコア計算
      pokemon.score = (pokemon.energyPerDay + pokemon.supportEnergyPerDay) * (100 + config.simulation.fieldBonus) / 100;

      pokemon.score += (
        pokemon.score * (config.simulation.researchRankMax ? 0.5 : 0)
        + pokemon.shard * (config.simulation.shardToEnergy ?? config.selectEvaluate.shardEnergyRate / 4)
      ) * config.simulation.shardWeight / 100;

      pokemon.score += pokemon.supportScorePerDay
    }

    postMessage({
      status: 'success',
      body: pokemonList,
    })
  }
})

export default {}