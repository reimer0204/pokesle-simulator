import PokemonSimulator from '../models/pokemon-simulator'

import Cooking from '../data/cooking'
import Food from '../data/food'

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
          for(let index of combination) {
            aboutScore += targetPokemonList[index].score
          }

          combinationList.push({ combination: [...combination], aboutScore })

          if (++count % 1000 == 0) {
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
      let { fixedPokemonList, targetPokemonList, combinationList, config } = body;

      // 料理チャンス結果計算用キャッシュ
      let cookingChangeCache = new Map();

      // 料理を良い順にソートしておく
      let targetCookingList = Cooking.list.filter(c => c.type == config.simulation.cookingType)
        .sort((a, b) => b.addEnergy - a.addEnergy)

      // シミュレーター用意
      let simulator = new PokemonSimulator(config);

      // 対象のポケモンをすべてシミュレーターの初期化にかけておく
      for(let pokemon of fixedPokemonList) simulator.memberToInfo(pokemon);
      for(let pokemon of targetPokemonList) simulator.memberToInfo(pokemon);

      let bestResult = [];
      let count = 0;

      combinationLoop: for(let { aboutScore, combination } of combinationList) {
        aboutScore *= 7;

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
        let shardBonusCount = 0;
        let researchExpBonusCount = 0;
        let cookingPowerUpEffectList = new Array(21).fill(0);
        let totalCookingChanceEffect = 0;
        let foodNum = { ...Object.fromEntries(Food.list.map(f => [f.name, 0])), ...config.foodDefaultNum };
        let addShard = 0;
        let typeSetMap = {};
        let noDuplicateCheck = new Set();

        for(let pokemon of pokemonList) {
          helpBonusCount += pokemon.enableSubSkillList.includes('おてつだいボーナス') ? 1 : 0;
          shardBonusCount += pokemon.enableSubSkillList.includes('ゆめのかけらボーナス') ? 1 : 0;
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

        let totalOtherHealEffect = 0;
        for(let pokemon of pokemonList) {
          simulator.calcStatus(pokemon, helpBonusCount);
          totalOtherHealEffect += pokemon.otherHealEffect;
        }

        for(let pokemon of pokemonList) {
          simulator.calcHelp(
            pokemon,
            totalOtherHealEffect,
            PokemonSimulator.MODE_TEAM,
            {
              pokemonList: pokemonList,
              helpBoostCount: typeSetMap[pokemon.type].size,
            },
          )

          energy += pokemon.berryEnergyPerDay;
          energy += pokemon.skillEnergyPerDay;
          addShard += pokemon.shard;

          for(let food of Food.list) {
            foodNum[food.name] += (pokemon[food.name] ?? 0) * 7;
          }

          // 1週間分の料理パワーアップ、料理チャンスを総計しておく
          let skillNum = Math.floor(pokemon.skillEnergyPerDay / pokemon.skillName == 'ゆびをふる' ? Skill.metronomeTarget.length : 1) * 7;
          for(let i = 0; i < skillNum; i++) {
            cookingPowerUpEffectList[Math.floor(i / skillNum * 21)] += pokemon.cookingPowerUpEffect
          }
          totalCookingChanceEffect += pokemon.cookingChanceEffect * 7;
        }

        // 日給エナジーは28回評価される(月曜のエナジーは7回評価、火曜は6回評価…される)
        energy *= 7;

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
        let remainFoodNum = { ...foodNum };
        for(let week = 0; week < 7; week++) {
          for(let i = 0; i < 3; i++) {
            let potSize = Math.round(
              (
                (week == 6 ? config.simulation.potSize * 2 : config.simulation.potSize)
                + cookingPowerUpEffectList[cookingCount]
              ) * (config.simulation.campTicket ? 1.5 : 1)
            );

            // いい料理を検索
            let bestCooking = null;
            for(let cooking of targetCookingList) {
              if(cooking.foodNum <= potSize && cooking.foodList.every(({ name, num }) => remainFoodNum[name] >= num)
              ) {
                bestCooking = { cooking, week, potSize, sunday: week == 6, index: week * 3 + i };

                // 食材を減らす
                for(const { name, num } of cooking.foodList) {
                  remainFoodNum[name] -= num;
                }
                break;
              }
            }

            selectedCookingList.push(bestCooking);
            cookingCount++;
          }
        }

        // 料理チャンスによる倍率を計算
        let chanceWeekEffect = cookingChangeCache.get(totalCookingChanceEffect)
        if (chanceWeekEffect == null) {
          chanceWeekEffect = Cooking.getChanceWeekEffect(totalCookingChanceEffect)
          cookingChangeCache.set(totalCookingChanceEffect, chanceWeekEffect)
        }

        // 最終的に余った食材の平均パワーを計算
        let remainFoodList = Object.entries(remainFoodNum).map(([name, num]) => ({ name, num, energy: Food.map[name].energy })).sort((a, b) => b.energy - a.energy);
        let cookingList = new Array(21);
        for(const { cooking, potSize, sunday, week, index } of selectedCookingList) {
          let potRemain = potSize - cooking.foodCount;

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
            (cooking.energy * Cooking.recipeLvs[config.simulation.cookingRecipeLv ?? 1] + addFoodPower)
            * (chanceWeekEffect.successProbabilityList[index] * (sunday ? 2 : 1) + 1)
            * config.simulation.cookingWeight;

          cookingList[index] = {
            cooking,
            energy: cookingEnergy,
          };

          // 月曜にいい料理が揃うとは限らないので一律1～7倍の平均の4倍で評価
          energy += cookingEnergy;
        }
        // remainFoodNum = Object.fromEntries(remainFoodList.map(({ name, num }) => [name, num]));

        // フィールドボーナスをかける
        energy *= (100 + config.simulation.fieldBonus) / 100;

        if (isNaN(energy)) {
          console.error({
            pokemonList,
            fieldBonus: config.simulation.fieldBonus, 
            cookingList,
          });
          throw '計算ロジックに誤りが見つかりました';
        }

        // スコアリングがゆめのかけらならエナジーをゆめのかけらに変換する計算をする
        score = energy;
        score += (
          energy * (
            shardBonusCount * 0.06
            + (config.simulation.researchRankMax ? (1 + researchExpBonusCount * 0.06) * 0.5 : 0)
          )
          + addShard
        ) * config.simulation.shardWeight / 100;

        if (borderScore < score) {
          bestResult.push(JSON.parse(JSON.stringify({
            energy,
            aboutScore,
            score,
            addShard,
            // baseScoreList: pokemonList.map(pokemon => (pokemon['きのみ期待値/日'] + pokemon['自己完結スキル期待値/日']) * helpBonus + pokemon['手伝期待値/回'] * otesapo / 5),
            pokemonList,
            cookingList,
            foodNum,
            remainFoodNum,
          })));
          bestResult = bestResult.sort((a, b) => b.score - a.score).slice(0, 10);

          if (bestResult.length >= 10) {
            borderScore = bestResult.at(-1).score;
          }
        }

        if (++count % 1000 == 0) {
          postMessage({
            status: 'progress',
            body: {
              progress: count / combinationList.length,
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