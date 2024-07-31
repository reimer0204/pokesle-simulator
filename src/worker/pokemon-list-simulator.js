import Cooking from "../data/cooking";
import Food from "../data/food";
import Pokemon from "../data/pokemon";
import Skill from "../data/skill";
import SubSkill from "../data/sub-skill";
import HelpRate from "../models/help-rate";
import PokemonSimulator from "../models/pokemon-simulator";

let simulator;
let evaluateSimulator;
let config;

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
    let {
      pokemonList, 
      startIndex,
      evaluateTable,
    } = event.data;

    let result = [];
    let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))

    for(let i = 0; i < pokemonList.length; i++) {
      const pokemon = simulator.memberToInfo(pokemonList[i]);
      pokemon.index = i + startIndex;
    }
  
    for(let i = 0; i < pokemonList.length; i++) {
      let base = Pokemon.map[pokemonList[i].name]
      let pokemonNameList = config.simulation.fixEvolve && base?.afterList ? base?.afterList : [pokemonList[i].name];
      for(let pokemonName of pokemonNameList) {
        const pokemon = simulator.memberToInfo({
          ...pokemonList[i],
          beforeName: pokemonList[i].name != pokemonName ? pokemonList[i].name : null,
          name: pokemonName,
        });
        pokemon.index = i + startIndex;

        if (config.simulation.selectInfo && evaluateTable) {
          pokemon.evaluateResult = {};
          pokemon.foodIndexList = pokemon.foodList.map(foodName => pokemon.base.foodList.findIndex(baseFood => baseFood.name == foodName))
          if (!pokemon.foodIndexList.includes(-1)) {
            pokemon.evaluateResult.max = {
              best: { name: null, score: 0 },
            };
            for(let lv of lvList) {
              pokemon.evaluateResult[lv] = {
                best: { name: null, score: 0 },
              }
            }
  
            for(let after of pokemon.base.afterList) {
              if (!evaluateTable[after]) {
                continue;
              }
  
              let afterPokemon = Pokemon.map[after];
              pokemon.evaluateResult.max[after] = { name: null, score: 0 }
              
              for(let lv of lvList) {
                
                let foodList = pokemon.foodIndexList.slice(0, lv < 30 ? 1 : lv < 60 ? 2 : 3).map((foodIndex, i) => {
                  const food = Food.map[pokemon.base.foodList[foodIndex].name];
                  if (food == null) return null;
                  const baseFood = pokemon.base.foodList[foodIndex];
  
                  return {
                    name: baseFood.name,
                    num: baseFood.numList[i],
                    energy: food.energy * baseFood.numList[i]
                      * ((food.bestRate * Cooking.maxRecipeBonus - 1) * config.selectEvaluate.foodEnergyRate / 100 + 1),
                  }
                });
  
                let foodNum = lv < 30 ? 1 : lv < 60 ? 2 : 3;
                let subSkillNum = lv < 10 ? 0 : lv < 25 ? 1 : lv < 50 ? 2 : lv < 75 ? 3 : lv < 100 ? 4 : 5;
  
                let subSkillList = SubSkill.useSilverSeed(pokemon.subSkillList).slice(0, subSkillNum);
                
                let selectEvaluate = await evaluateSimulator.selectEvaluate(
                  afterPokemon, lv, 
                  foodList.slice(0, foodNum), 
                  subSkillList,
                  pokemon.nature, 
                  evaluateTable.scoreForHealerEvaluate[lv], evaluateTable.scoreForSupportEvaluate[lv]
                )
                let { energyPerDay } = selectEvaluate
                
                let evaluateResult;
                let rate;
                let ratio;
                let percentileList = evaluateTable[after][lv][pokemon.foodIndexList.slice(0, foodNum).join('')]?.percentile ?? [];
                let percentileUpper = Math.min(Math.max(percentileList.findIndex(x => x >= energyPerDay), 0), 100);
                let percentileLower = percentileList[percentileUpper] == energyPerDay ? percentileUpper
                  : Math.max(percentileUpper - 1, 0);
  
                if (percentileUpper == percentileLower) {
                  rate = percentileUpper / 100
                } else {
                  rate = ((energyPerDay - percentileList[percentileLower]) / (percentileList[percentileUpper] - percentileList[percentileLower]) + percentileLower) / 100
                }
                ratio = energyPerDay / percentileList[config.simulation.selectBorder]
  
                let item = {
                  name: after,
                  rate,
                  ratio,
                  score: config.simulation.selectType == 0 ? rate : ratio,
                  energy: energyPerDay,
                };
                pokemon.evaluateResult[lv][after] = item
                if (pokemon.evaluateResult[lv].best.score <= item.score) {
                  pokemon.evaluateResult[lv].best = item;
                }
                
                if (pokemon.evaluateResult.max[after].score <= item.score) {
                  pokemon.evaluateResult.max[after] = item;
                }
                if (pokemon.evaluateResult.max.best.score <= item.score) {
                  pokemon.evaluateResult.max.best = item;
                }
              }
            }
            
            pokemon.evaluate_max = pokemon.evaluateResult.max.best.score;
            pokemon.evaluate_energy_max = pokemon.evaluateResult.max.best.energy;
            for(let lv of lvList) {
              pokemon[`evaluate_${lv}`] = pokemon.evaluateResult[lv].best.score;
              pokemon[`evaluate_energy_${lv}`] = pokemon.evaluateResult[lv].best.energy;
            }
          }
        }
        
        result.push(pokemon)
      }
    }
    
    if (config.simulation.bagOverOperation) {
      result.push(
        ...result
        .filter(x => Pokemon.map[x.name].specialty == 'きのみ' || x.enableSubSkillList.includes('きのみの数S'))
        .map(pokemon => {
          return {
            ...pokemon,
            bagOverOperation: true,
            bag: -100,
            fixedBag: -100,
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
        pokemon.enableSubSkillList.includes('おてつだいボーナス') ? 1 : 0,
        pokemon.enableSubSkillList.includes('げんき回復ボーナス') ? 1 : 0,
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
      pokemonList, 
      helpBonusTop6,
      pickupEnergyPerHelpTop5,
      healCheckTarget,
    } = event.data;

    let helpRateCache = new Map();

    // 他メンバーに影響を与える要素について計算
    await Promise.all(pokemonList.map(async pokemon => {
      pokemon.supportScorePerDay = 0;
      pokemon.supportEnergyPerDay = 0;
  
      if (pokemon.enableSubSkillList.includes('おてつだいボーナス')) {
        // 概算日給の高い上位6匹から自身を除外し、上位4匹のおてスピが70%→65%になった時の増加量をおてボの効果とする
        for(let subPokemon of helpBonusTop6.filter(x => x.index != pokemon.index).slice(0, 4)) {
          pokemon.supportEnergyPerDay += subPokemon.energyPerDay * (0.70 / 0.65 - 1)
  
          pokemon.supportScorePerDay += subPokemon.shard * (0.70 / 0.65 - 1) * config.simulation.shardWeight / 100
        }
      }
  
      if (pokemon.enableSubSkillList.includes('ゆめのかけらボーナス')) {
        // 概算日給の高い上位6匹から自身を除外した上位4匹＋自身の6%分のエナジーをゆめボの効果とする
        for(let subPokemon of [...helpBonusTop6.filter(x => x.index != pokemon.index).slice(0, 4), pokemon]) {
          pokemon.supportEnergyPerDay += subPokemon.energyPerDay * 0.06 * config.simulation.shardWeight / 100
        }
      }
  
      if (config.simulation.researchRankMax && pokemon.enableSubSkillList.includes('リサーチEXPボーナス')) {
        // 概算日給の高い上位6匹から自身を除外し、上位4匹の3%分のエナジーをリサボの効果とする
        for(let subPokemon of [...helpBonusTop6.filter(x => x.index != pokemon.index).slice(0, 4), pokemon]) {
          pokemon.supportEnergyPerDay += subPokemon.energyPerDay * 0.03 * config.simulation.shardWeight / 100
        }
      }

      // げんき回復系評価
      if (pokemon.otherMorningHealEffect > 0 || pokemon.otherDayHealEffect > 0) {

        let healedAddEnergyList = await Promise.all(healCheckTarget.map(async subPokemon => {
          if (subPokemon.index == pokemon.index) return 0;

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
        }));

        pokemon.supportScorePerDay += healedAddEnergyList.sort((a, b) => b - a).slice(0, 4).reduce((a, x) => a + x, 0);
      }
  
      if (pokemon.fixedBag > 0) {
        let skillList = pokemon.skill.name == 'ゆびをふる' ? Skill.metronomeTeamTarget : [pokemon.skill];
        let effectRate = pokemon.skill.name == 'ゆびをふる' ? (1 / Skill.metronomeTarget.length) : 1;
        let effect = pokemon.skill.effect[pokemon.fixedSkillLv - 1];
        for(let skill of skillList) {
          switch(skill.name) {
            case 'おてつだいサポートS':
            case 'おてつだいブースト':
              let pickupEnergySum = [...pickupEnergyPerHelpTop5.filter(x => x.index != pokemon.index).slice(0, 4), pokemon].reduce((a, x) => a + x.pickupEnergyPerHelp, 0)
              pokemon.supportEnergyPerDay += effect * pickupEnergySum / (skill.name == 'おてつだいブースト' ? 1 : 5) * effectRate * pokemon.skillPerDay;
              break;
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
    }))

    postMessage({
      status: 'success',
      body: pokemonList,
    })
  }
})

export default {}