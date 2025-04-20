import PokemonSimulator from './pokemon-simulator'

import { Food, Cooking } from '../../data/food_and_cooking'
import Berry from '../../data/berry';
import Field from '../../data/field';
import Skill from '../../data/skill';
import NightCapPikachu from '../../data/nightcap_pikachu';
import type { SimulatedPokemon } from '@/type';
import HelpRate from '../help-rate';

let borderScore = 0;
self.addEventListener('message', async (event) => {
  const { type, ...body } = event.data

  try {
    if (type == 'combination') {
      const { rankMax, pickup, topList, targetPokemonList, pattern } = event.data

      // 組み合わせを列挙
      let combinationList = [];
      let count = 0;
      for(let top of topList) {
        let combination = [top, ...new Array(pickup - 1).fill(0).map((_, i) => i + top + 1)];
        let combinationLimit = new Array(pickup).fill(0).map((_, i) => i > 0 ? rankMax - pickup + i : top);
        combinationLoop: while(true) {
          let aboutScore = 0;
          if (targetPokemonList) {
            for(let index of combination) {
              aboutScore += targetPokemonList[index].score
            }
          }

          combinationList.push({ combination: [...combination], aboutScore })

          if (++count % 10000 == 0) {
            postMessage({
              status: 'progress',
              body: count / pattern,
            })
          }

          for(let i = pickup - 1; i >= 0; i--) {
            combination[i]++;
            if(combination[i] > combinationLimit[i]) {
              if (i == 0) {
                break combinationLoop;
              }
            } else {
              for(let j = i + 1; j < pickup; j++) {
                combination[j] = combination[j - 1] + 1;
              }
              break;
            }
          }
        }
      }

      postMessage({
        status: 'success',
        body: combinationList,
      })

      return;
    }

    if (type == 'border') {
      borderScore = Math.max(borderScore, body.border);
      return;
    }

    if (type == 'simulate') {
      let bestResult = [];
      borderScore = -1;
      let { rankMax, pickup, topList, pattern, fixedPokemonList, targetPokemonList, config } = body as {
        rankMax: number,
        pickup: number,
        topList: number[],
        pattern: number,
        fixedPokemonList: SimulatedPokemon[],
        targetPokemonList: SimulatedPokemon[],
      };
      const helpRate = new HelpRate(config);
      
      const freeCandy = config.candy.bag.s * 3 + config.candy.bag.m * 20 + config.candy.bag.l * 100
      
      // 組み合わせを列挙
      let combinationList = [];
      if (pickup > 0) {
        for(let top of topList) {
          let combination = [top, ...new Array(pickup - 1).fill(0).map((_, i) => i + top + 1)];
          let combinationLimit = new Array(pickup).fill(0).map((_, i) => i > 0 ? rankMax - pickup + i : top);
          combinationLoop: while(true) {
            let aboutScore = 0;
            if (targetPokemonList) {
              for(let index of combination) {
                aboutScore += targetPokemonList[index].score
              }
            }

            combinationList.push({ combination: [...combination], aboutScore })

            if (combinationList.length % 10000 == 0) {
              postMessage({
                status: 'progress',
                body: combinationList.length / pattern * 0.1,
              })
            }

            for(let i = pickup - 1; i >= 0; i--) {
              combination[i]++;
              if(combination[i] > combinationLimit[i]) {
                if (i == 0) {
                  break combinationLoop;
                }
              } else {
                for(let j = i + 1; j < pickup; j++) {
                  combination[j] = combination[j - 1] + 1;
                }
                break;
              }
            }
          }
        }
      } else {
        combinationList.push({ combination: [], aboutScore: 0 })
      }
      
      let nightCapPikachu = null;
      if (config.teamSimulation.nightCapPikachu > 0) {
        nightCapPikachu = NightCapPikachu.get(config.teamSimulation.nightCapPikachu);

        if((
          config.simulation.field == 'ワカクサ本島' ? config.simulation.berryList : Field.map[config.simulation.field].berryList
        )?.includes('ウブ')) {
          nightCapPikachu.berryEnergyPerDay *= 2;
        }
      }

      // 料理チャンス結果計算用キャッシュ
      let cookingChangeCache = new Map();

      // 料理を良い順にソートしておく
      let cookingList = Cooking.evaluateLvList(config);
      let cookingListMap: { [key: string]: CookingType[] } = {
        'カレー': cookingList.filter(c => c.type == 'カレー' && (c.enable || c.foodNum == 0)).sort((a, b) => b.fixAddEnergy - a.fixAddEnergy),
        'サラダ': cookingList.filter(c => c.type == 'サラダ' && (c.enable || c.foodNum == 0)).sort((a, b) => b.fixAddEnergy - a.fixAddEnergy),
        'デザート': cookingList.filter(c => c.type == 'デザート' && (c.enable || c.foodNum == 0)).sort((a, b) => b.fixAddEnergy - a.fixAddEnergy),
      }
      let targetCookingList = config.simulation.cookingType
        ? cookingListMap[config.simulation.cookingType]
        : cookingList.filter(c => config.simulation.enableCooking[c.name] || c.foodNum == 0).sort((a, b) => b.fixAddEnergy - a.fixAddEnergy);

      // シミュレーター用意
      let simulator = new PokemonSimulator(config, PokemonSimulator.MODE_TEAM);

      // 対象のポケモンをすべてシミュレーターの初期化にかけておく
      // for(let pokemon of fixedPokemonList) simulator.memberToInfo(pokemon);
      // for(let pokemon of targetPokemonList) simulator.memberToInfo(pokemon);

      let count = 0;
      let dayLength = config.teamSimulation.day != null ? 1 : 7;
      let food0Map = { ...Object.fromEntries(Food.list.map(f => [f.name, 0])) };
      let defaultFoodNum = { ...food0Map, ...config.foodDefaultNum };

      combinationLoop: for(let { aboutScore, combination } of combinationList) {
        // aboutScore *= dayLength;

        // TODO: できれば途中で概算値が下回ったら抜けたい
        // if (aboutScore < borderScore) {
        //   console.log('break', aboutScore, borderScore);
        //   break;
        // }

        const pokemonList = [...fixedPokemonList];
        for(let index of combination) {
          pokemonList.push(targetPokemonList[index]);
        }

        let score = 0;
        let energy = 0;
        let helpBonusCount = 0;
        let genkiBonusCount = 0;
        let shardBonusCount = 0;
        let suiminExpBonusCount = 0;
        let researchExpBonusCount = 0;
        let cookingPowerUpEffectList = new Array(21).fill(0);
        let totalCookingPowerUpEffect = 0;
        let totalCookingChanceEffect = 0;
        let foodNum = { ...defaultFoodNum };
        let useFoodNum = { ...food0Map };
        let addFoodNum = { ...food0Map };
        let energyShard = 0;
        let researchExp = 0;
        let skillShard = 0;
        let bonusShard = 0;
        let typeSetMap: { [key: string]: Set<string> } = {};
        let noDuplicateCheck = new Set();
        let resultOption = {};
        let legendNum = 0;
        let todayShard = 0;
        let todayResearchExp = 0;
        let useTotalShard = 0;
        let useCandies: { [key: string]: number } = {};

        for(let pokemon of pokemonList) {
          helpBonusCount += pokemon.subSkillNameList.includes('おてつだいボーナス') ? 1 : 0;
          genkiBonusCount += pokemon.subSkillNameList.includes('げんき回復ボーナス') ? 1 : 0;
          shardBonusCount += pokemon.subSkillNameList.includes('ゆめのかけらボーナス') ? 1 : 0;
          suiminExpBonusCount += pokemon.subSkillNameList.includes('睡眠EXPボーナス') ? 1 : 0;
          legendNum += pokemon.base.legend as unknown as number;
          useTotalShard += pokemon.useShard;
          useCandies[pokemon.base.candyName] = (useCandies[pokemon.base.candyName] ?? 0) + pokemon.useCandy;
          if (useCandies[pokemon.base.candyName] > (config.candy.bag[pokemon.base.candyName] ?? 0) + freeCandy * 5) {
            continue combinationLoop;
          }

          researchExpBonusCount += config.simulation.researchRankMax && pokemon.subSkillNameList.includes('リサーチEXPボーナス') ? 1 : 0;

          if (typeSetMap[pokemon.base.type] === undefined) typeSetMap[pokemon.base.type] = new Set();
          typeSetMap[pokemon.base.type].add(pokemon.base.name);

          // 通常といつ育モードは同じPTに入らない
          if (!noDuplicateCheck.has(pokemon.box!.index)) {
            noDuplicateCheck.add(pokemon.box!.index)
          } else {
            continue combinationLoop;
          }
        }

        // 睡眠EXPボーナスが指定値に満たない場合は不採用
        if (suiminExpBonusCount < config.teamSimulation.require.suiminExp) {
          continue;
        }

        // 伝説は2匹以上入れられない
        if (legendNum >= 2) {
          continue;
        }

        // 仮定計算をしていて所持ゆめのかけらを超える場合は不採用
        if (config.simulation.fix && config.simulation.fixResourceMode != 0 && config.candy.shard && useTotalShard > config.candy.shard) {
          continue;
        }

        // 個々の評価
        // let totalOtherMorningHealEffect = 0;
        // let totalOtherDayHealEffect = 0;
        for(let pokemon of pokemonList) {
          simulator.calcStatus(pokemon, helpBonusCount, genkiBonusCount, pokemonList);
          // totalOtherMorningHealEffect += pokemon.otherMorningHealEffect;
          // totalOtherDayHealEffect += pokemon.otherDayHealEffect;
        }

        helpRate.calcTeamHeal(pokemonList)

        // 睡眠EXPボーナスが指定値に満たない場合は不採用
        if (suiminExpBonusCount < config.teamSimulation.require.suiminExp) {
          continue;
        }

        for(let pokemon of pokemonList) {
          simulator.calcHelp(
            pokemon,
            // totalOtherMorningHealEffect,
            // totalOtherDayHealEffect,
            {
              pokemonList: pokemonList,
              helpBoostCount: typeSetMap[pokemon.base.type].size,
            },
          )
          
          // げんきによるお手伝い効率が指定値を下回ったら不採用
          if (pokemon.dayHelpRate * 100 < config.teamSimulation.require.dayHelpRate
            || pokemon.nightHelpRate * 100 < config.teamSimulation.require.nightHelpRate
          ) {
            continue combinationLoop;
          }

          energy += pokemon.berryEnergyPerDay;
          energy += pokemon.skillEnergyPerDay;
          skillShard += pokemon.shard;

          for(let food of Food.list) {
            addFoodNum[food.name] += pokemon[food.name] ?? 0;
          }

          pokemon.shard *= dayLength;
          pokemon.skillPerDay *= dayLength;

          // 料理パワーアップを発動回数に応じて振り分けておく
          let skillNum = Math.floor(pokemon.skillPerDay / (pokemon.base.skill.name == 'ゆびをふる' ? Skill.metronomeTarget.length : 1));
          for(let i = 0; i < skillNum; i++) {
            cookingPowerUpEffectList[Math.floor(i / skillNum * 3 * dayLength)] += pokemon.cookingPowerUpEffect
          }
          totalCookingPowerUpEffect += pokemon.cookingPowerUpEffect * skillNum;

          // 料理チャンスの効果量を加算
          totalCookingChanceEffect += pokemon.cookingChanceEffect;
        }

        if (nightCapPikachu) {
          pokemonList.push(nightCapPikachu)
          
          for(let food of Food.list) {
            addFoodNum[food.name] += nightCapPikachu[food.name] ?? 0;
          }
        }

        // ここまでの計算結果は日給なのでそれぞれ7倍する
        if (config.teamSimulation.day == null) {
          energy *= 7;
          skillShard *= 7;
          totalCookingChanceEffect *= 7;
          for(let food of Food.list) {
            addFoodNum[food.name] *= 7
          }
        }
        for(let food of Food.list) {
          foodNum[food.name] += addFoodNum[food.name];
        }

        // 料理
        // 食材の総数と平均エナジー計算
        let averageFoodEnergy = 0;
        let sumFoodCount = 0;
        for(const food of Food.list) {
          averageFoodEnergy += food.energy * foodNum[food.name];
          sumFoodCount += foodNum[food.name];
        }
        averageFoodEnergy /= sumFoodCount;
        averageFoodEnergy = averageFoodEnergy || 0;

        // なべのサイズ、食材が足りていて、エナジーが最も高い料理を21回分計算
        // 最終エナジーを評価する場合は日曜優先で良い料理を作成、そうでなければ月曜から作成
        const selectedCookingList = [];
        let cookingCount = 0;
        let cookingList = [];
        if (config.simulation.cookingWeight > 0) {

          let cookingTimingList = [];
          if (config.teamSimulation.day != null) {
            for(let i = 0; i < config.teamSimulation.cookingNum ?? 3; i++) {
              cookingTimingList.push({ week: (config.teamSimulation.day + Math.floor(i / 3)) % 7, i: i % 3 });
            }
          } else {
            for(let i = 0; i < 21; i++) {
              cookingTimingList.push({ week: Math.floor(i / 3), i: i % 3 });
            }
          }
          
          for(let { week, i } of cookingTimingList) {
            let potSize = Math.round(
              (
                (week == 6 ? config.simulation.potSize * 2 : config.simulation.potSize)
                + cookingPowerUpEffectList[cookingCount]
              ) * (config.simulation.campTicket ? 1.5 : 1)
            );

            // いい料理を検索
            let bestCooking = null;
            for(let cooking of targetCookingList) {
              if(cooking.foodNum <= potSize && cooking.foodList.every(({ name, num }) => foodNum[name] >= num)
              ) {
                bestCooking = { cooking, week, potSize, sunday: week == 6, index: week * 3 + i };

                // 食材を減らす
                for(const { name, num } of cooking.foodList) {
                  foodNum[name] -= num;
                  useFoodNum[name] += num;
                }
                break;
              }
            }

            selectedCookingList.push(bestCooking);
            cookingCount++;
          }

          // 料理チャンスによる倍率を計算
          let chanceWeekEffect = cookingChangeCache.get(totalCookingChanceEffect)
          if (chanceWeekEffect == null) {
            chanceWeekEffect = Cooking.getChanceWeekEffect(totalCookingChanceEffect, config.teamSimulation.day)
            cookingChangeCache.set(totalCookingChanceEffect, chanceWeekEffect)
          }

          // 最終的に余った食材の平均パワーを計算
          let remainFoodList = Object.entries(foodNum).map(([name, num]) => ({ name, num, energy: Food.map[name].energy })).sort((a, b) => b.energy - a.energy);
          for(const { cooking, potSize, sunday, week, index } of selectedCookingList) {
            let potRemain = potSize - cooking.foodNum;

            if (config.teamSimulation.day == null) {
              // 余った食材を詰める
              let addFoodPower = 0;
              while(potRemain > 0 && remainFoodList.length) {
                const num = Math.min(potRemain, remainFoodList[0].num);
                potRemain -= num;
                remainFoodList[0].num -= num;
                addFoodPower += remainFoodList[0].energy * num;
                if (remainFoodList[0].num <= 0) remainFoodList.shift();
              }

              const successPower = (chanceWeekEffect.successProbabilityList[index] * (sunday ? 2 : 1) + 1);
              const cookingEnergy =
                (cooking.fixEnergy + addFoodPower)
                * successPower
                * config.simulation.cookingWeight;

              cookingList.push({
                cooking,
                energy: cookingEnergy,
                successPower,
                addEnergy: addFoodPower,
                successPower,
                potSize,
              });

              energy += cookingEnergy;

            } else {
              const successPower = chanceWeekEffect.successProbabilityList[index % 3] * (sunday ? 2 : 1) + 1;
              const cookingEnergy =
                cooking.fixEnergy
                * successPower
                * config.simulation.cookingWeight;

              cookingList.push({
                cooking,
                energy: cookingEnergy,
                successPower,
                addEnergy: 0,
                potSize,
              });

              energy += cookingEnergy;

            }
          }
        }
        // remainFoodNum = Object.fromEntries(remainFoodList.map(({ name, num }) => [name, num]));

        // フィールドボーナスをかける
        let rawEnergy = energy;
        energy *= (100 + config.simulation.fieldBonus) / 100;

        if (isNaN(energy)) {
          console.error({
            pokemonList,
            fieldBonus: config.simulation.fieldBonus,
            cookingList,
          });
          throw '計算ロジックに誤りが見つかりました';
        }
        
        // エナジーにより得られるゆめのかけら

        // スコアを計算
        // ゆめのかけらの倍率をエナジーに加算
        let shardRate;
        if (config.teamSimulation.day != null) {
          let dayRate = 7 - config.teamSimulation.day
          let shardEnergy = energy * dayRate

          energyShard = shardEnergy / config.selectEvaluate.shardEnergyRate;
          researchExp = config.simulation.researchRankMax ? shardEnergy / config.selectEvaluate.shardEnergyRate * 0.5 : 0;

          // ゆめボとリサボで得られるゆめのかけら
          todayShard = ((config.teamSimulation.beforeEnergy ?? 0) + energy) / config.selectEvaluate.shardEnergyRate;
          todayResearchExp = config.simulation.researchRankMax ? ((config.teamSimulation.beforeEnergy ?? 0) + energy) / config.selectEvaluate.shardEnergyRate * 0.5 : 0;

        } else {
          todayShard = energyShard = energy * 4 / config.selectEvaluate.shardEnergyRate;
          todayResearchExp = researchExp = config.simulation.researchRankMax ? energy * 4 / config.selectEvaluate.shardEnergyRate * 0.5 : 0;
        }
        bonusShard = todayShard * shardBonusCount * 0.06 + todayResearchExp * researchExpBonusCount * 0.09 * 0.5
        shardRate = (bonusShard + skillShard) / (energyShard + researchExp)
        score = energy * (shardRate * config.simulation.shardWeight / 100 + 1)

        resultOption = {
          rawEnergy,
          cookingList,
        }

        if (borderScore < score) {
          let result = JSON.parse(JSON.stringify({
            beforeEnergy: config.teamSimulation.beforeEnergy,
            energy,
            // aboutScore,
            energyShard,
            bonusShard,
            skillShard,
            todayShard,
            todayResearchExp,
            score,
            shardBonusCount,
            researchExpBonusCount,
            // baseScoreList: pokemonList.map(pokemon => (pokemon['きのみ期待値/日'] + pokemon['自己完結スキル期待値/日']) * helpBonus + pokemon['手伝期待値/回'] * otesapo / 5),
            pokemonList,
            useFoodNum,
            addFoodNum,
            defaultFoodNum,
            foodNum,
            cookingPowerUpEffectList,
            ...resultOption,
          }))

          for(let pokemon of result.pokemonList) {
            if (config.teamSimulation.day == null) {
              for(let food of Food.list) {
                pokemon[food.name] = (pokemon[food.name] ?? 0) * 7;
              }
            }
            pokemon.shardBonus = pokemon.shard
              + (pokemon.subSkillNameList?.includes('ゆめのかけらボーナス') ? result.todayShard * 0.06 : 0)
              + (pokemon.subSkillNameList?.includes('リサーチEXPボーナス') ? result.todayResearchExp * 0.09 : 0)
          }

          bestResult.push(result);
          bestResult = bestResult.sort((a, b) => b.score - a.score).slice(0, 10);

          if (bestResult.length >= 10) {
            borderScore = bestResult.at(-1).score;
          }
        }

        if (++count % 1000 == 0) {
          postMessage({
            status: 'progress',
            body: {
              progress: count / combinationList.length * 0.9 + 0.1,
              bestResult,
            }
          })
        }
      }

      helpRate.dump()

      postMessage({
        status: 'progress',
        body: {
          progress: 1,
          bestResult,
        }
      })
      postMessage({
        status: 'success',
        body: bestResult,
      })

    }
  } catch(e) {
    console.error(e);
    postMessage({
      status: 'error',
      body: e.message,
    })
  }
});

export default {};