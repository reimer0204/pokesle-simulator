import type { EvaluateResult, EvaluateResultKey, PokemonBoxType, PokemonType, SimulatedPokemon } from "@/type";
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

    const evaluateTypeList = [null] as [string | null]
    if (config.pureMint) {
      evaluateTypeList.push('pureMint')
    }

    const evaluateResultKeyList = ['energy', 'berry', 'food', 'skill', 'specialty'] as [EvaluateResultKey, EvaluateResultKey, EvaluateResultKey, EvaluateResultKey, EvaluateResultKey];

    for(let i = 0; i < pokemonList.length; i++) {
      const box: PokemonBoxType = pokemonList[i];
      const base: PokemonType = Pokemon.map[pokemonList[i].name];

      // 仮定計算の結果、リストに追加することになったポケモンの一覧
      // 例) イーブイの場合はイーブイの代わりにブイズが複数匹入ったりする
      let addPokemonList = []

      let evaluateResult: EvaluateResult | null = null;
      let fix = false;

      // 厳選
      if (evaluateTable) {
        evaluateResult = null;
        let foodIndexList = pokemonList[i].foodList.map(foodName => base.foodNameList.findIndex(baseFood => baseFood == foodName))
        if (!foodIndexList.includes(-1)) {
          for(let after of base.afterList) {
            if (!evaluateTable[after]) {
              continue;
            }
            
            if (evaluateResult == null) evaluateResult = {}

            let afterPokemon = Pokemon.map[after];
            let evaluateMaxScore = 0;
            let evaluateSpecialtyMaxScore = 0;
            
            for(let lv of lvList) {
              if (evaluateResult[lv] == null) evaluateResult[lv] = {};
              
              let foodNum = lv < 30 ? 1 : lv < 60 ? 2 : 3;

              const simulatedPokemon = evaluateSimulator.fromEvaluate(
                afterPokemon, lv, pokemonList[i].foodList,
              )

              let subSkillNum = lv < 10 ? 0 : lv < 25 ? 1 : lv < 50 ? 2 : lv < 75 ? 3 : lv < 100 ? 4 : 5;

              let subSkillList: string[] = (
                config.selectEvaluate.silverSeedUse ? SubSkill.useSilverSeed(box.subSkillList) : box.subSkillList
              ).slice(0, subSkillNum);

              for(const evaluateType of evaluateTypeList) {

                // 計算
                let selectEvaluate = evaluateSimulator.selectEvaluate(
                  simulatedPokemon,
                  subSkillList.map(x => SubSkill.map[x]),
                  evaluateType == 'pureMint' ? Nature.map['まじめ'] : Nature.map[box.nature], 
                  evaluateTable.scoreForHealerEvaluate[lv][''].energy, evaluateTable.scoreForSupportEvaluate[lv][''].energy
                )
                let score = evaluateSimulator.selectEvaluateToScore(
                  selectEvaluate, 
                  subSkillList.includes('ゆめのかけらボーナス'), 
                  subSkillList.includes('リサーチEXPボーナス')
                )

                function getRate(list: number[], num: number) {
                  let max = list.length - 1;
                  let percentileLower = Math.min(Math.max(list.findLastIndex(x => x <= num), 0), max)
                  let percentileUpper = list[percentileLower] >= num ? percentileLower : Math.min(percentileLower + 1, max);

                  return percentileUpper == percentileLower ? percentileUpper / max
                    : ((num - list[percentileLower]) / (list[percentileUpper] - list[percentileLower]) + percentileLower) / max
                }

                if (evaluateResult[lv][after] === undefined) {
                  evaluateResult[lv][after] = {} as any
                }
                for(let { value, evaluateKey } of [
                  { value: score,                         evaluateKey: 'energy' as EvaluateResultKey },
                  { value: selectEvaluate.berryNumPerDay, evaluateKey: 'berry'  as EvaluateResultKey },
                  { value: selectEvaluate.foodNumPerDay,  evaluateKey: 'food'   as EvaluateResultKey },
                  { value: selectEvaluate.skillPerDay,    evaluateKey: 'skill'  as EvaluateResultKey },
                ]) {

                  // 総合スコアの厳選状況
                  let percentileList = evaluateTable[after][lv][foodIndexList.slice(0, foodNum).join('')]?.[evaluateKey] ?? [];
                  let rate = getRate(percentileList, value)
                  let ratio = value / percentileList[config.simulation.selectBorder];
                  let item = {
                    name: after,
                    rate,
                    ratio,
                    score: config.simulation.selectType == 0 ? rate : ratio,
                    value,
                  };
                  if (evaluateType == null) {
                    evaluateResult[lv][after][evaluateKey] = item
                  }
                  if (evaluateType == 'pureMint') {
                    evaluateResult[lv][after][evaluateKey].pureMint = item
                  }
                }
                evaluateResult[lv][after].foodNumList = afterPokemon.foodList.map(f => simulatedPokemon[f.name]);
                
                if (evaluateType == null) {
                  if (afterPokemon.specialty == 'きのみ') evaluateResult[lv][after].specialty = evaluateResult[lv][after].berry;
                  if (afterPokemon.specialty == '食材')   evaluateResult[lv][after].specialty = evaluateResult[lv][after].food;
                  if (afterPokemon.specialty == 'スキル') evaluateResult[lv][after].specialty = evaluateResult[lv][after].skill;
                }
                if (evaluateType == 'pureMint') {
                  if (afterPokemon.specialty == 'きのみ') evaluateResult[lv][after].specialty.pureMint = evaluateResult[lv][after].berry.pureMint;
                  if (afterPokemon.specialty == '食材')   evaluateResult[lv][after].specialty.pureMint = evaluateResult[lv][after].food.pureMint;
                  if (afterPokemon.specialty == 'スキル') evaluateResult[lv][after].specialty.pureMint = evaluateResult[lv][after].skill.pureMint;
                }
                
                evaluateMaxScore = Math.max(evaluateMaxScore, evaluateResult[lv][after].energy.score)
                if (evaluateResult[lv][after].specialty) {
                  evaluateSpecialtyMaxScore = Math.max(evaluateSpecialtyMaxScore, evaluateResult[lv][after].specialty.score)
                }
              }
            }

            let thisFix = config.simulation.fix && fixablePokemonIndexSet!.has(box.index) && (
              evaluateMaxScore >= config.simulation.fixBorder / 100
              || evaluateSpecialtyMaxScore >= config.simulation.fixBorderSpecialty / 100
            );
            fix ||= thisFix

            // 最終進化想定シミュをする場合、別個体に切り出し
            if (thisFix && (config.simulation.fixEvolve || config.simulation.fixResourceMode == 1)) {
              if (!config.simulation.fixEvolveExcludeSleep || !Pokemon.map[after].requireSleep[pokemonList[i].name]) {
                addPokemonList.push(after)
              }
            }
          }
        }
      }

      if (addPokemonList.length == 0) {
        addPokemonList.push(box.name);
      }
      
      // スキルレベル未指定の場合のスキルレベルを計算
      let original = simulator.fromBox({ ...pokemonList[i], skillLv: undefined });

      let thisResult: SimulatedPokemon[] = [];
      for(let j = 0; j < addPokemonList.length; j++) {
        let pokemonName = addPokemonList[j]
        const base = Pokemon.map[pokemonName];
        let skillLv = box.skillLv
        if (skillLv != null) {
          // 進化後でスキルレベルが未指定の場合のスキルレベルを計算
          let simulatedPokemon = simulator.fromBox(
            { ...pokemonList[i], name: pokemonName, skillLv: undefined }, 
            fix, 
            config.simulation.fixResourceMode == 0 ? 0 : base.evolveCandyMap[pokemonList[i].name],
            pokemonList[i].name != pokemonName ? (base.evolve.lv || undefined) : 0,
          );

          skillLv += simulatedPokemon.fixedSkillLv - original.fixedSkillLv
        }

        let simulatedPokemon = simulator.fromBox(
          { ...pokemonList[i], name: pokemonName, skillLv }, 
          fix, 
          config.simulation.fixResourceMode == 0 ? 0 : base.evolveCandyMap[pokemonList[i].name],
          pokemonList[i].name != pokemonName ? (base.evolve.lv || undefined) : 0,
        );

        // 進化仮定を計算しても必要レベルに達していない場合はキャンセル
        // 進化仮定に誰も届かないなら進化前のまま計算
        if (pokemonList[i].name != pokemonName && base.evolve.lv != null && simulatedPokemon.lv < base.evolve.lv) {
          if (j == addPokemonList.length - 1 && thisResult.length == 0) {
            simulatedPokemon = simulator.fromBox(
              { ...pokemonList[i] }, 
              fix, 
              0,
              0,
            );
          } else {
            continue;
          }
        }
        simulatedPokemon.beforeName = pokemonList[i].name;
        thisResult.push(simulatedPokemon)

        if (evaluateResult) {
          if (pokemonName == box.name) {
            // 仮定計算で進化の計算がされなかった場合は、進化先全ての結果を詰める
            simulatedPokemon.evaluateResult = evaluateResult;

          } else {
            // 仮定計算で進化の計算がされた場合は、進化先1つだけの結果を詰める
            simulatedPokemon.evaluateResult = {}
            for(let lv of lvList) {
              simulatedPokemon.evaluateResult[lv] = {
                [pokemonName]: evaluateResult[lv][pokemonName],
              }
            }
          }
          
          if (simulatedPokemon.evaluateResult?.[lvList[0]]) {
            simulatedPokemon.evaluateResult.max = {};
            for(let after of Object.keys(simulatedPokemon.evaluateResult[lvList[0]])) {
              simulatedPokemon.evaluateResult.max[after] = {} as any;
              for(let key of evaluateResultKeyList) {
                simulatedPokemon.evaluateResult.max[after][key] = lvList
                  .map(lv => simulatedPokemon.evaluateResult[lv][after][key])
                  .sort((a, b) => b.score - a.score)[0];
              }
            }
            // 各レベルごとに最適な進化先のスコアを算出
            for(let lv of [...lvList, 'max']) {
              const best = {} as any
              for(let key of evaluateResultKeyList) {
                
                if (config.pureMint) {
                  const [name, value] = Object.entries(simulatedPokemon.evaluateResult[lv])
                    .sort(([_1, a], [_2, b]) => b[key].pureMint!.score - a[key].pureMint!.score)[0]
                  best[key] = {
                    name,
                    ...value[key].pureMint!
                  }
                } else {
                  const [name, value] = Object.entries(simulatedPokemon.evaluateResult[lv])
                    .sort(([_1, a], [_2, b]) => b[key].score - a[key].score)[0]
                    
                  best[key] = {
                    name,
                    ...value[key]
                  }
                }
              }
              simulatedPokemon.evaluateResult[lv].best = best;
            }
          }
        }
      }
      result.push(...thisResult)
    }
    
    if (config.simulation.bagOverOperation) {
      result.push(
        ...result
        .filter(x => x.base.specialty == 'きのみ' || x.base.specialty == 'オール' || x.subSkillNameList?.includes('きのみの数S'))
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
        (pokemon.subSkillNameList?.includes('おてつだいボーナス') ? 1 : 0) + (config.simulation.helpBonus ?? 0),
        pokemon.subSkillNameList?.includes('げんき回復ボーナス') ? 1 : 0,
      )

      simulator.calcTeamHeal([pokemon])

      simulator.calcHelp(pokemon)

      // スコアを一旦計算する
      pokemon.tmpScore = pokemon.energyPerDay * (100 + config.simulation.fieldBonus) / 100;
      pokemon.tmpScore += (
        pokemon.tmpScore * (config.simulation.researchRankMax ? 0.5 : 0)
        + pokemon.shard * (config.simulation.shardToEnergy ?? config.selectEvaluate.shardEnergyRate / 4)
      ) * config.simulation.shardWeight / 100;
    }

    simulator.dump()
    
    postMessage({
      status: 'success',
      body: result,
    })
  }

  if (type == 'assist') {
    let pokemonList: SimulatedPokemon[] = event.data.pokemonList;
    let basedPokemonList: SimulatedPokemon[] = event.data.basedPokemonList;
    const fixPokemonList = basedPokemonList.filter(x => x.box?.fix == 1)
    const kouhoPokemonList = basedPokemonList.filter(x => x.box?.fix == null)

    // ゆめボ/リサボ用
    let energyTop5 = kouhoPokemonList.toSorted((a, b) => b.energyPerDay! - a.energyPerDay!)
      .slice(0, 5 - fixPokemonList.length).concat(fixPokemonList);

    // おてボ用に概算日給の高い上位5匹をリストアップしておく
    let helpBonusTop5 = kouhoPokemonList.toSorted((a, b) => b.tmpScore! - a.tmpScore!)
      .slice(0, 5 - fixPokemonList.length).concat(fixPokemonList);

    // きのみバースト用に1回の手伝いが多い上位5匹をリストアップしておく
    let berryEnergyTop5 = kouhoPokemonList.toSorted((a, b) => b.berryEnergy - a.berryEnergy)
      .slice(0, 5 - fixPokemonList.length).concat(fixPokemonList);

    // おてサポ用に1回の手伝いが多い上位6匹をリストアップしておく
    let pickupEnergyPerHelpTop5 = kouhoPokemonList.toSorted((a, b) => b.pickupEnergyPerHelp - a.pickupEnergyPerHelp)
      .slice(0, 6 - fixPokemonList.length).concat(fixPokemonList);

    // げんき回復スキルの効果を概算するため、げんき回復なしの強い上位6匹と、その6位より強い回復持ちをリストアップしておく
    let healCheckTarget = kouhoPokemonList.filter(x => x.healEffect == 0).toSorted((a, b) => b.tmpScore! - a.tmpScore!).slice(0, 6 - fixPokemonList.length);
    healCheckTarget.push(...kouhoPokemonList.filter(x => x.healEffect != 0 && x.tmpScore! > (healCheckTarget.at(-1)?.tmpScore ?? 0)));
    healCheckTarget.push(...fixPokemonList);
    healCheckTarget.sort((a, b) => b.tmpScore! - a.tmpScore!)


    // 他メンバーに影響を与える要素について計算
    for(const pokemon of pokemonList) {
      pokemon.supportEnergyPerDay = 0;
      pokemon.supportShardPerDay = 0;
  
      if (pokemon.subSkillNameList?.includes('おてつだいボーナス')) {
        // 概算日給の高い上位6匹から自身を除外し、上位4匹のおてスピが70%→65%になった時の増加量をおてボの効果とする
        for(let subPokemon of helpBonusTop5.filter(x => x.box!.index != pokemon.box!.index).slice(0, 4)) {
          // 素のおてスピ補正をかけて補正なしの能力にし、そこに65%時-70%時の倍率をかける
          let effect = (1 - subPokemon.speedBonus) * (1 / 0.65 - 1 / 0.7);
          pokemon.supportEnergyPerDay += subPokemon.energyPerDay * effect
          pokemon.supportShardPerDay += subPokemon.shard * (1 - effect) * (1 / 0.65 - 1 / 0.7);// * config.simulation.shardWeight / 100
        }
      }
  
      if (pokemon.subSkillNameList?.includes('ゆめのかけらボーナス')) {
        // 概算日給の高い上位6匹から自身を除外した上位4匹＋自身の6%分のエナジーをゆめボの効果とする
        for(let subPokemon of [...energyTop5.filter(x => x.box!.index != pokemon.box!.index).slice(0, 4), pokemon]) {
          pokemon.supportShardPerDay += subPokemon.energyPerDay / config.selectEvaluate.shardEnergyRate * 0.06
        }
      }
  
      if (config.simulation.researchRankMax && pokemon.subSkillNameList?.includes('リサーチEXPボーナス')) {
        // 概算日給の高い上位6匹から自身を除外し、上位4匹の3%分のエナジーをリサボの効果とする
        for(let subPokemon of [...helpBonusTop5.filter(x => x.box!.index != pokemon.box!.index).slice(0, 4), pokemon]) {
          pokemon.supportShardPerDay += subPokemon.energyPerDay / config.selectEvaluate.shardEnergyRate / 2 * 0.09
        }
      }

      // げんき回復系スキル評価
      if (pokemon.otherHeal && !config.simulation.genkiFull) {

        let healedAddEnergyList = healCheckTarget.filter(subPokemon => subPokemon.box!.index != pokemon.box!.index).map(subPokemon => {
          let helpRate = simulator.getHelpRate(pokemon.otherHealList)

          let dayHelpNum = (24 - config.sleepTime) * 3600 / subPokemon.speed * helpRate.day;
          let nightHelpNum = config.sleepTime  * 3600 / subPokemon.speed * helpRate.night;
          let addEffect = Math.max((dayHelpNum + nightHelpNum) / (subPokemon.dayHelpNum + subPokemon.nightHelpNum) - 1, 0);
          let score = subPokemon.tmpScore! * addEffect;
          let energy = subPokemon.energyPerDay * addEffect;
          let shard = subPokemon.shard * addEffect;
          
          return { score, energy, shard };
        }).sort((a, b) => b.score - a.score).slice(0, 4);

        pokemon.supportEnergyPerDay += healedAddEnergyList.reduce((a, x) => a + x.energy, 0);
        pokemon.supportShardPerDay += healedAddEnergyList.reduce((a, x) => a + x.shard, 0);
      }
  
      if (pokemon.bag > 0) {
        for(let { skill, weight} of pokemon.skillWeightList) {
          let supportSkillEnergy = 0;
          let effect = skill.effect[(skill.effect.length >= pokemon.fixedSkillLv ? pokemon.fixedSkillLv : skill.effect.length) - 1];
          switch(skill.name) {
            case 'ばけのかわ(きのみバースト)':
            case 'きのみバースト': {
              let berryEnergySum = [...berryEnergyTop5.filter(x => x.box!.index != pokemon.box!.index).slice(0, 4)].reduce((a, x) => a + x.berryEnergy, 0)

              if (skill.name == 'ばけのかわ(きのみバースト)') {
                let success = 1 - ((1 - skill.success!) ** pokemon.skillPerDay);
                supportSkillEnergy += berryEnergySum * pokemon.burstBonus * (success * (pokemon.skillPerDay + 2) + (1 - success) * pokemon.skillPerDay) / pokemon.skillPerDay;
              } else {
                supportSkillEnergy += berryEnergySum * pokemon.burstBonus;
              }
              break;
            }

            case 'みかづきのいのり(げんきオールS)': {
              let berryEnergySum = [...berryEnergyTop5.filter(x => x.box!.index != pokemon.box!.index).slice(0, 4)].reduce((a, x) => a + x.berryEnergy, 0)
              supportSkillEnergy += berryEnergySum * pokemon.burstBonus;
              break;
            }
            
            case 'おてつだいサポートS':
            case 'おてつだいブースト': {
              let pickupEnergySum = [...pickupEnergyPerHelpTop5.filter(x => x.box!.index != pokemon.box!.index).slice(0, 4), pokemon].reduce((a, x) => a + x.pickupEnergyPerHelp, 0)
              supportSkillEnergy += pickupEnergySum * (skill.name == 'おてつだいブースト' ? effect.max : effect / 5);
              break;
            }
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
        + (pokemon.shard + pokemon.supportShardPerDay) * (config.simulation.shardToEnergy ?? config.selectEvaluate.shardEnergyRate / 4)
      ) * config.simulation.shardWeight / 100;
    }

    postMessage({
      status: 'success',
      body: pokemonList,
    })
  }
})

export default {}