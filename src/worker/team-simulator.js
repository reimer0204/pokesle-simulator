import PokemonSimulator from '../models/pokemon-simulator'

import Cooking from '../data/cooking'
import Food from '../data/food'
import Berry from '../data/berry';
import Field from '../data/field';
import Skill from '../data/skill';

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
      let { rankMax, pickup, topList, pattern, fixedPokemonList, targetPokemonList, config } = body;
      
      // 組み合わせを列挙
      let combinationList = [];
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
      
      let nightCapPikachu = null;
      if (config.teamSimulation.nightCapPikachu > 0) {
        nightCapPikachu = [
          {time: 4800, berry: 1, foodNumList: []},
          {time: 4680, berry: 1, foodNumList: []},
          {time: 4560, berry: 1, foodNumList: [1]},
          {time: 4440, berry: 1, foodNumList: [1]},
          {time: 4380, berry: 1, foodNumList: [1]},
          {time: 4320, berry: 1, foodNumList: [1]},
          {time: 4260, berry: 1, foodNumList: [1]},
          {time: 4200, berry: 1, foodNumList: [1]},
          {time: 4140, berry: 1, foodNumList: [1,1]},
          {time: 4080, berry: 1, foodNumList: [1,1]},
          {time: 4020, berry: 2, foodNumList: [1,1]},
          {time: 3960, berry: 2, foodNumList: [1,1]},
          {time: 3900, berry: 2, foodNumList: [2,1]},
          {time: 3840, berry: 2, foodNumList: [2,1]},
          {time: 3780, berry: 2, foodNumList: [2,1]},
          {time: 3720, berry: 2, foodNumList: [2,1]},
          {time: 3660, berry: 2, foodNumList: [2,2]},
          {time: 3600, berry: 2, foodNumList: [2,2]},
          {time: 3570, berry: 2, foodNumList: [2,2,2]},
          {time: 3540, berry: 2, foodNumList: [2,2,2]},
        ][config.teamSimulation.nightCapPikachu - 1]

        nightCapPikachu.name = 'ナイトキャップピカチュウ';
        nightCapPikachu.lv = config.teamSimulation.nightCapPikachu;
        nightCapPikachu.enableSubSkillList = [];
        nightCapPikachu.skillEnergyPerDay = 0;
        nightCapPikachu.shard = 0;
        
        nightCapPikachu.helpNum = 86400 / nightCapPikachu.time;
        nightCapPikachu.berryEnergyPerDay = nightCapPikachu.helpNum * Math.max(
          Berry.map['ウブ'].energy + config.teamSimulation.nightCapPikachu - 1,
          Berry.map['ウブ'].energy * (1.025 ** (config.teamSimulation.nightCapPikachu - 1))
        ) * (1 - 0.16 * nightCapPikachu.foodNumList.length)

        if((
          config.simulation.field == 'ワカクサ本島' ? config.simulation.berryList : Field.map[config.simulation.field].berryList
        )?.includes('ウブ')) {
          nightCapPikachu.berryEnergyPerDay *= 2;
        }

        nightCapPikachu['とくせんリンゴ'] = nightCapPikachu.foodNumList.length > 0 ? nightCapPikachu.helpNum * 0.16 * nightCapPikachu.foodNumList[0] : 0
        nightCapPikachu['リラックスカカオ'] = nightCapPikachu.foodNumList.length > 1 ? nightCapPikachu.helpNum * 0.16 * nightCapPikachu.foodNumList[1] : 0
        nightCapPikachu['あまいミツ'] = nightCapPikachu.foodNumList.length > 2 ? nightCapPikachu.helpNum * 0.16 * nightCapPikachu.foodNumList[2] : 0
      }

      // 料理チャンス結果計算用キャッシュ
      let cookingChangeCache = new Map();

      // 料理を良い順にソートしておく
      let cookingList = Cooking.evaluateLvList(config);
      let cookingListMap = {
        'カレー': cookingList.filter(c => c.type == 'カレー' && (config.simulation.enableCooking[c.name] || c.foodNum == 0)).sort((a, b) => b.addEnergy - a.addEnergy),
        'サラダ': cookingList.filter(c => c.type == 'サラダ' && (config.simulation.enableCooking[c.name] || c.foodNum == 0)).sort((a, b) => b.addEnergy - a.addEnergy),
        'デザート': cookingList.filter(c => c.type == 'デザート' && (config.simulation.enableCooking[c.name] || c.foodNum == 0)).sort((a, b) => b.addEnergy - a.addEnergy),
      }
      let targetCookingList = config.simulation.cookingType
        ? cookingListMap[config.simulation.cookingType]
        : cookingList.filter(c => config.simulation.enableCooking[c.name] || c.foodNum == 0).sort((a, b) => b.addEnergy - a.addEnergy);

      // シミュレーター用意
      await PokemonSimulator.isReady;
      let simulator = new PokemonSimulator(config, PokemonSimulator.MODE_TEAM);

      // 対象のポケモンをすべてシミュレーターの初期化にかけておく
      for(let pokemon of fixedPokemonList) simulator.memberToInfo(pokemon);
      for(let pokemon of targetPokemonList) simulator.memberToInfo(pokemon);

      let count = 0;
      let dayLength = config.teamSimulation.day != null ? 1 : 7;
      let cookingNum = config.teamSimulation.day != null ? (config.teamSimulation.cookingNum ?? 3) : 21
      let food0Map = { ...Object.fromEntries(Food.list.map(f => [f.name, 0])) };
      let defaultFoodNum = { ...food0Map, ...config.foodDefaultNum };

      combinationLoop: for(let { aboutScore, combination } of combinationList) {
        aboutScore *= dayLength;

        // TODO: できれば途中で概算値が下回ったら抜けたい
        if (aboutScore < borderScore) {
          // console.log('break', aboutScore, borderScore);
          // break;
        }

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
        let typeSetMap = {};
        let noDuplicateCheck = new Set();
        let resultOption = {};
        let legendNum = 0;
        let todayShard = 0;
        let todayResearchExp = 0;

        for(let pokemon of pokemonList) {
          helpBonusCount += pokemon.enableSubSkillList.includes('おてつだいボーナス') ? 1 : 0;
          genkiBonusCount += pokemon.enableSubSkillList.includes('げんき回復ボーナス') ? 1 : 0;
          shardBonusCount += pokemon.enableSubSkillList.includes('ゆめのかけらボーナス') ? 1 : 0;
          suiminExpBonusCount += pokemon.enableSubSkillList.includes('睡眠EXPボーナス') ? 1 : 0;
          legendNum += pokemon.legend;
          researchExpBonusCount += config.simulation.researchRankMax && pokemon.enableSubSkillList.includes('リサーチEXPボーナス') ? 1 : 0;

          if (typeSetMap[pokemon.type] === undefined) typeSetMap[pokemon.type] = new Set();
          typeSetMap[pokemon.type].add(pokemon.name);

          // 通常といつ育モードは同じPTに入らない
          if (!noDuplicateCheck.has(pokemon.index)) {
            noDuplicateCheck.add(pokemon.index)
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

        // 個々の評価
        let totalOtherMorningHealEffect = 0;
        let totalOtherDayHealEffect = 0;
        for(let pokemon of pokemonList) {
          simulator.calcStatus(pokemon, helpBonusCount, genkiBonusCount);
          totalOtherMorningHealEffect += pokemon.otherMorningHealEffect;
          totalOtherDayHealEffect += pokemon.otherDayHealEffect;
        }

        // 睡眠EXPボーナスが指定値に満たない場合は不採用
        if (suiminExpBonusCount < config.teamSimulation.require.suiminExp) {
          continue;
        }

        for(let pokemon of pokemonList) {
          simulator.calcHelp(
            pokemon,
            totalOtherMorningHealEffect,
            totalOtherDayHealEffect,
            {
              pokemonList: pokemonList,
              helpBoostCount: typeSetMap[pokemon.type].size,
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
          let skillNum = Math.floor(pokemon.skillPerDay / (pokemon.skillName == 'ゆびをふる' ? Skill.metronomeTarget.length : 1));
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

        if (config.teamSimulation.sundayPrepare) {

          // 日曜準備用評価
          for(let food of Food.list) {
            foodNum[food.name] += addFoodNum[food.name];
          }

          // チェックする料理タイプ
          let cookingTypeList = config.simulation.cookingType ? [config.simulation.cookingType] : ['カレー', 'サラダ', 'デザート'];

          energy = 1;
          let eachTypeResult = {}

          for(let cookingType of cookingTypeList) {
            let cookingList = []
            let remainFoodNum = { ...foodNum };
            let targetCookingList = cookingListMap[cookingType];

            let eachEnergy = 0;
            let firstCooking = true;

            cookingSearch: for(let week = 0; week < 7; week++) {
              let potSize = Math.round(
                (week == 6 ? config.simulation.potSize * 2 : config.simulation.potSize)
                * ((config.teamSimulation.campTicket ?? config.simulation.campTicket) ? 1.5 : 1)
              );

              for(let i = 0; i < 3; i++) {

                // いい料理を検索
                let bestCooking = targetCookingList.find(cooking => cooking.foodNum <= potSize && cooking.foodList.every(({ name, num }) => remainFoodNum[name] >= num))

                if (bestCooking.energy == 0) break cookingSearch;
                
                // 食材を減らす
                let useFoodNum = {};
                let beforeFoodNum = { ...remainFoodNum };
                for(const { name, num } of bestCooking.foodList) {
                  remainFoodNum[name] -= num;
                  useFoodNum[name] = num;
                }

                cookingList.push({
                  ...bestCooking,
                  beforeFoodNum,
                  useFoodNum,
                  remainFoodNum,
                })

                // 料理のスコアを加算、月曜は7倍で評価
                eachEnergy += (
                    bestCooking.fixEnergy
                    + (firstCooking ? Food.averageEnergy * totalCookingPowerUpEffect : 0)
                  )
                  * (100 + config.simulation.fieldBonus) / 100
                  * (7 - week)

                firstCooking = false;

                // きのみ担当で稼げる食材を加算
                for(let foodName in config.teamSimulation.sundayPrepare.foodNum) {
                  remainFoodNum[foodName] += config.teamSimulation.sundayPrepare.foodNum[foodName] / 3;
                }
              }
            }

            eachEnergy *= (100 + config.simulation.fieldBonus) / 100;
            energy *= eachEnergy;

            eachTypeResult[cookingType] = ({
              cookingList,
              remainFoodNum,
            })
          }
          score = energy ** (1 / cookingTypeList.length)
            * (1 + (config.simulation.researchRankMax ? 0.5 : 0) * config.simulation.shardWeight / 100)
            + skillShard * config.selectEvaluate.shardEnergyRate * config.simulation.shardWeight / 100
          energy = 0;
          
          resultOption = {
            eachTypeResult,
          }

        } else {

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
              let potRemain = potSize - cooking.foodCount;

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

                const cookingEnergy =
                  (cooking.fixEnergy + addFoodPower)
                  * (chanceWeekEffect.successProbabilityList[index] * (sunday ? 2 : 1) + 1)
                  * config.simulation.cookingWeight;

                cookingList.push({
                  cooking,
                  energy: cookingEnergy,
                  addEnergy: addFoodPower,
                  potSize,
                });

                energy += cookingEnergy;

              } else {
                const cookingEnergy =
                  cooking.fixEnergy
                  * (chanceWeekEffect.successProbabilityList[index % 3] * (sunday ? 2 : 1) + 1)
                  * config.simulation.cookingWeight;

                cookingList.push({
                  cooking,
                  energy: cookingEnergy,
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
          bonusShard = todayShard * shardBonusCount * 0.06 + todayResearchExp * researchExpBonusCount * 0.06 * 0.5
          shardRate = (bonusShard + skillShard) / (energyShard + researchExp)
          score = energy * (shardRate * config.simulation.shardWeight / 100 + 1)

          resultOption = {
            rawEnergy,
            cookingList,
          }
        }

        if (borderScore < score) {
          let result = JSON.parse(JSON.stringify({
            beforeEnergy: config.teamSimulation.beforeEnergy,
            energy,
            aboutScore,
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
              + (pokemon.enableSubSkillList.includes('ゆめのかけらボーナス') ? result.todayShard * 0.06 : 0)
              + (pokemon.enableSubSkillList.includes('リサーチEXPボーナス') ? result.todayResearchExp * 0.06 : 0)
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