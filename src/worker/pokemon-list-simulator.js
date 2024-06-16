import Cooking from "../data/cooking";
import Food from "../data/food";
import Pokemon from "../data/pokemon";
import Skill from "../data/skill";
import HelpRate from "../models/help-rate";
import PokemonSimulator from "../models/pokemon-simulator";

addEventListener('message', (event) => {
  let {
    type, config, pokemonList, 
    helpBonusTop6,
    pickupEnergyPerHelpTop5,
    healCheckTarget,
    evaluateTable,
  } = event.data;

  let simulator = new PokemonSimulator(config);

  if (type == 'init') {
    let result = [];
    let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))
  
    for(let i = 0; i < pokemonList.length; i++) {
      const pokemon = simulator.memberToInfo(pokemonList[i]);
      
      pokemon.evaluateResult = {};
      if (config.simulation.selectInfo) {
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
            let afterPokemon = Pokemon.map[after];
            pokemon.evaluateResult.max[after] = { name: null, score: 0 }
            
            for(let lv of lvList) {
              
              let foodList = pokemon.foodIndexList.map((foodIndex, i) => {
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
              
              let selectEvaluate = simulator.selectEvaluate(
                afterPokemon, lv, 
                foodList.slice(0, foodNum), 
                pokemon.subSkillList.slice(0, subSkillNum), 
                pokemon.natureName, 
                evaluateTable.scoreForHealerEvaluate[lv], evaluateTable.scoreForSupportEvaluate[lv]
              )
              let { energyPerDay } = selectEvaluate
              
              let evaluateResult;
              let percentileList = evaluateTable[after][lv][pokemon.foodIndexList.slice(0, foodNum).join('')].percentile;
              if (config.simulation.selectType == 0) {
                let percentile1 = Math.max(percentileList.findLastIndex(x => x < energyPerDay), 0);
                let percentile2 = Math.min(percentile1 + 1, 100)
                if (percentile1 == percentile2) {
                  evaluateResult = percentile1 / 100
                } else {
                  evaluateResult = ((energyPerDay - percentileList[percentile2]) / (percentileList[percentile1] - percentileList[percentile2]) + percentile1) / 100
                }
              }
              if (config.simulation.selectType == 1) {
                evaluateResult = energyPerDay / percentileList[config.simulation.selectBorder]
              }

              let item = {
                name: after,
                score: evaluateResult,
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
          for(let lv of lvList) {
            pokemon[`evaluate_${lv}`] = pokemon.evaluateResult[lv].best.score;
          }
        }
      }

      result.push(pokemon)
    }

    postMessage({
      status: 'success',
      body: result,
    })
    return;
  }
  
  if (type == 'basic') {

    for(let pokemon of pokemonList) {
      simulator.calcStatus(
        pokemon,
        pokemon.enableSubSkillList.includes('おてつだいボーナス') ? 1 : 0,
      )

      simulator.calcHelp(
        pokemon,
        0,
        PokemonSimulator.MODE_ABOUT,
      )

      pokemon.tmpScore = pokemon.energyPerDay * (100 + config.simulation.fieldBonus) / 100;
      pokemon.tmpScore += (
        pokemon.tmpScore * (config.simulation.researchRankMax ? 0.5 : 0)
        + pokemon.shard * config.selectEvaluate.shardEnergyRate / 4
      ) * config.simulation.shardWeight / 100;
      
    }
    
    postMessage({
      status: 'success',
      body: pokemonList,
    })
  }

  if (type == 'assist') {

    let helpRateCache = new Map();

    // 他メンバーに影響を与える要素について計算
    for(let pokemon of pokemonList) {
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
  
      if (pokemon.fixedBag > 0) {
        let skillList = pokemon.skill.name == 'ゆびをふる' ? Skill.metronomeTeamTarget : [pokemon.skill];
        let effectRate = pokemon.skill.name == 'ゆびをふる' ? (1 / Skill.metronomeTarget.length) : 1;
        let effect = pokemon.skill.effect[pokemon.fixedSkillLv - 1];
        for(let skill of skillList) {
          switch(skill.name) {
            case 'げんきエールS':
            case 'げんきオールS':
  
              let healedAddEnergyList = [];
              for(let subPokemon of healCheckTarget) {
                if (subPokemon.index == pokemon.index) continue;
  
                let totalHealEffect = subPokemon.healEffect
                  + pokemon.otherHealEffect * (subPokemon.nature?.good == 'げんき回復量' ? 1.2 : subPokemon.nature?.weak == 'げんき回復量' ? 0.88 : 1);
                let helpRate = helpRateCache.get(totalHealEffect);
                if(helpRate == null) {
                  helpRate = {
                    day: HelpRate.getHelpRate(totalHealEffect, config.dayHelpParameter),
                    night: HelpRate.getHelpRate(totalHealEffect, config.nightHelpParameter),
                  }
                  helpRateCache.set(totalHealEffect, helpRate)
                }
  
                let dayHelpNum = (24 - config.sleepTime) * 3600 / subPokemon.speed * helpRate.day;
                let nightHelpNum = config.sleepTime  * 3600 / subPokemon.speed * helpRate.night;
                let healedAddEnergy = subPokemon.tmpScore * ((dayHelpNum + nightHelpNum) / (subPokemon.dayHelpNum + subPokemon.nightHelpNum) - 1);
                healedAddEnergyList.push(healedAddEnergy);
              }
              pokemon.supportScorePerDay += healedAddEnergyList.sort((a, b) => b - a).slice(0, 4).reduce((a, x) => a + x, 0);
              break;
  
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
        + pokemon.shard * config.selectEvaluate.shardEnergyRate / 4
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