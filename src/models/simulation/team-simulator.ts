import PokemonSimulator from './pokemon-simulator'

import { Food, Cooking } from '../../data/food_and_cooking'
import Field from '../../data/field.ts';
import Skill from '../../data/skill';
import NightCapPikachu from '../../data/nightcap_pikachu';
import type { SimulatedPokemon } from '@/type';
import HelpRate from '../help-rate';

let borderScore = 0;
self.addEventListener('message', async (event) => {
  const { type, ...body } = event.data

  try {

    if (type == 'border') {
      borderScore = Math.max(borderScore, body.border);
      return;
    }

    if (type == 'simulate') {
      let bestResult = [];
      borderScore = -1;
      let { targetNum, pickup, topList, pattern, fixedPokemonList, targetPokemonList, config } = body as {
        targetNum: number,
        pickup: number,
        topList: number[],
        pattern: number,
        fixedPokemonList: SimulatedPokemon[],
        targetPokemonList: SimulatedPokemon[],
      };
      const helpRate = new HelpRate(config);

      const boxNoMap: { [key: number]: SimulatedPokemon[] } = {};
      for(let pokemon of fixedPokemonList) {
        if (boxNoMap[pokemon.box!.index] === undefined) {
          boxNoMap[pokemon.box!.index] = [];
        }
        boxNoMap[pokemon.box!.index].push(pokemon);
      }
      let fixedCombinationList: SimulatedPokemon[][] = [[]];
      for(let combination of Object.values(boxNoMap)) {
        const nextFixedCombinationList: SimulatedPokemon[][] = [];
        for(let fixedCombination of fixedCombinationList) {
          for(let pokemon of combination) {
            nextFixedCombinationList.push([...fixedCombination, pokemon]);
          }
        }
        fixedCombinationList = nextFixedCombinationList;
      }
      
      const freeCandy = config.candy.bag.s * 3 + config.candy.bag.m * 20 + config.candy.bag.l * 100

      // 全組み合わせを配列へ保持せず、同じ列挙順で逐次処理する。
      // 候補数が多いときの開始遅延とWorkerのメモリ使用量を抑えるため。
      function* getCombinations() {
        if (pickup <= 0) {
          yield { combination: [], aboutScore: 0 };
          return;
        }

        for(let top of topList) {
          let combination = [top, ...new Array(pickup - 1).fill(0).map((_, i) => i + top + 1)];
          let combinationLimit = new Array(pickup).fill(0).map((_, i) => i > 0 ? targetNum - pickup + i : top);
          combinationLoop: while(true) {
            let aboutScore = 0;
            for(let index of combination) {
              aboutScore += targetPokemonList[index].score;
            }
            yield { combination: [...combination], aboutScore };

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
      }
      
      let nightCapPikachu = null;
      if (config.teamSimulation.nightCapPikachu > 0) {
        nightCapPikachu = NightCapPikachu.get(config.teamSimulation.nightCapPikachu);

        if((
          config.simulation.field == 'ワカクサ本島' ? config.simulation.berryList : Field.map[config.simulation.field].berryList
        )?.includes('ウブ')) {
          nightCapPikachu.bEpD *= 2;
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
      const cookingTimingList = [];
      if (config.teamSimulation.day != null) {
        for(let i = 0; i < config.teamSimulation.cookingNum ?? 3; i++) {
          cookingTimingList.push({ week: (config.teamSimulation.day + Math.floor(i / 3)) % 7, i: i % 3 });
        }
      } else {
        for(let i = 0; i < 21; i++) {
          cookingTimingList.push({ week: Math.floor(i / 3), i: i % 3 });
        }
      }

      let foodCommonRate = (config.teamSimulation.day == null) ? ((2 * 0.1 + 0.9) * 6 + (3 * 0.3 + 0.7)) / 7
        : config.teamSimulation.day == 6 ? 1.3
        : 1.1;
      if (config.teamSimulation.initialCookingChange) {
        foodCommonRate = 0;
        let length = config.teamSimulation.day != null ? 3 : 21;
        let noSuccessRate = 1;
        for(let i = 0; i < length; i++) {
          let success = ((i >= 18 || config.teamSimulation.day == 6) ? 0.3 : 0.1) + config.teamSimulation.initialCookingChange * noSuccessRate;
          noSuccessRate *= 1 - success;
          foodCommonRate += success
        }
        foodCommonRate /= length;
      }
      foodCommonRate *= config.simulation.cookingWeight
      let foodEnergyMap = {};
      for(const cooking of cookingList) {
        for(const cookingFood of cooking.foodList) {
          foodEnergyMap[cookingFood.name] = Math.max(
            foodEnergyMap[cookingFood.name] || 0,
            Food.map[cookingFood.name].energy * cooking.rate * cooking.recipeLvBonus * foodCommonRate
          )
        }
      }
      
      // シミュレーター用意
      let simulator = new PokemonSimulator(config, PokemonSimulator.MODE_TEAM);

      // 対象のポケモンをすべてシミュレーターの初期化にかけておく
      // for(let pokemon of fixedPokemonList) simulator.memberToInfo(pokemon);
      // for(let pokemon of targetPokemonList) simulator.memberToInfo(pokemon);

      let count = 0;
      let dayLength = config.teamSimulation.day != null ? 1 : 7;
      let food0Map = { ...Object.fromEntries(Food.list.map(f => [f.name, 0])) };
      let defaultFoodNum = { ...food0Map, ...config.foodDefaultNum };
      const requiredTypeNum = Object.entries(config.teamSimulation.require.typeNum)
        .filter(([, num]) => num > 0);
      const totalPattern = Math.max(pattern * fixedCombinationList.length, 1);

      for(const fixedPokemonList of fixedCombinationList) {
        const fixedAboutScore = fixedPokemonList.reduce((a, x) => a + x.score, 0);
        combinationLoop: for(let { aboutScore, combination } of getCombinations()) {

          // 概算値の時点でボーダーを超えていなければこの組み合わせは計算するまでもないのでスキップ
          if ((aboutScore + fixedAboutScore) * dayLength < borderScore) {
            continue;
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
          let typeSetMap: { [key: string]: Set<string> } = {};
          let typeCountMap: { [key: string]: number } = {};
          let noDuplicateCheck = new Set();
          let resultOption = {};
          let legendNum = 0;
          let todayShard = 0;
          let todayResearchExp = 0;
          let useTotalShard = 0;
          let useCandies: { [key: string]: number } = {};
          let specialtyBerry = 0;
          let specialtyFood = 0;
          let specialtySkill = 0;

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

            if (pokemon.base.specialty == 'きのみ') specialtyBerry++;
            if (pokemon.base.specialty == '食材') specialtyFood++;
            if (pokemon.base.specialty == 'スキル') specialtySkill++;

            researchExpBonusCount += config.simulation.researchRankMax && pokemon.subSkillNameList.includes('リサーチEXPボーナス') ? 1 : 0;

            if (typeSetMap[pokemon.base.type] === undefined) typeSetMap[pokemon.base.type] = new Set();
            typeSetMap[pokemon.base.type].add(pokemon.base.name);
            typeCountMap[pokemon.base.type] = (typeCountMap[pokemon.base.type] ?? 0) + 1;

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
          
          // 各とくいの匹数が指定値に満たない場合は不採用
          if (specialtyBerry < config.teamSimulation.require.specialtyNum['きのみ']) {
            continue;
          }
          if (specialtyFood < config.teamSimulation.require.specialtyNum['食材']) {
            continue;
          }
          if (specialtySkill < config.teamSimulation.require.specialtyNum['スキル']) {
            continue;
          }

          // タイプの匹数が指定されているならチェック
          for(const [type, requiredNum] of requiredTypeNum) {
            if ((typeCountMap[type] ?? 0) < requiredNum) {
              continue combinationLoop;
            }
          }

          // 伝説は2匹以上入れられない
          // ただし2匹でもラティアスとラティオスの組み合わせはOK
          if (legendNum >= 2
            && !(legendNum === 2 && pokemonList.some(pokemon => pokemon.base.name == 'ラティアス') && pokemonList.some(pokemon => pokemon.base.name == 'ラティオス'))
          ) {
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

          // ほっぺすりすりは4匹から1匹を選んだ後に再発動抽選を行うため、対象ごとの確率には選択確率も掛ける。
          // トゲデマルが複数いる場合は追加発動したほっぺすりすりが相手を再発動させ得るので、期待回数が収束するまで少数回反復する。
          // まず各ポケモンが自力で発動する通常回数を求め、追加発動回数を算出する際の基準値にする。
          const baseSkillPerDayMap = new Map<SimulatedPokemon, number>(
            pokemonList.map(pokemon => [pokemon, simulator.calcSkillPerDay(pokemon)])
          );

          // 反復中の「通常発動＋ほっぺすりすりによる追加発動」の推定値を保持する。
          let totalSkillPerDayMap = new Map(baseSkillPerDayMap);

          // 追加発動を発生させる側だけを抽出し、対象がいないチームでは反復処理を行わない。
          const togedemaruList = pokemonList.filter(
            pokemon => pokemon.base.skill.name == 'ほっぺすりすり(げんきエールS)'
          );

          for(let iteration = 0; iteration < 10 && togedemaruList.length; iteration++) {
            // 前回分へ上乗せすると同じ効果を重複加算するため、毎回通常発動回数から計算し直す。
            const nextTotalSkillPerDayMap = new Map(baseSkillPerDayMap);

            for(const executor of togedemaruList) {
              // 前回の反復で増えた発動も、次のほっぺすりすりを発生させる回数として扱う。
              const executorSkillPerDay = totalSkillPerDayMap.get(executor) ?? 0;

              for(const target of pokemonList) {
                // ほっぺすりすりは使用者自身を対象にできないため、自分への追加分は計算しない。
                if (executor == target) continue;

                // 自分以外から対象が選ばれる確率と、選ばれた対象が再発動可能になる確率を求める。
                const targetSelectRate = 1 / (pokemonList.length - 1);
                const reactivateRate = 1 - (1 - target.skillRate) ** (executor.fixedSkillLv + 1);

                // 使用者の発動回数に両確率を掛けた期待回数を、対象側の発動回数へ加算する。
                nextTotalSkillPerDayMap.set(
                  target,
                  (nextTotalSkillPerDayMap.get(target) ?? 0) + executorSkillPerDay * targetSelectRate * reactivateRate
                );
              }
            }

            // 全ポケモンについて前回値との差を調べ、相互再発動の期待回数が収束したか判定する。
            const difference = Math.max(...pokemonList.map(pokemon =>
              Math.abs((nextTotalSkillPerDayMap.get(pokemon) ?? 0) - (totalSkillPerDayMap.get(pokemon) ?? 0))
            ));
            totalSkillPerDayMap = nextTotalSkillPerDayMap;

            // 選択確率が1/4なので通常は数回で十分収束する。微小な差になった時点で不要な反復を打ち切る。
            if (difference < 1e-6) break;
          }

          // calcHelpには追加分だけを渡すため、収束後の合計回数から通常発動回数を差し引く。
          const additionalSkillPerDayMap = new Map<SimulatedPokemon, number>(
            pokemonList.map(pokemon => [
              pokemon,
              (totalSkillPerDayMap.get(pokemon) ?? 0) - (baseSkillPerDayMap.get(pokemon) ?? 0),
            ])
          );

          for(let pokemon of pokemonList) {
            simulator.calcHelp(
              pokemon,
              // totalOtherMorningHealEffect,
              // totalOtherDayHealEffect,
              {
                pokemonList: pokemonList,
                helpBoostCount: typeSetMap[pokemon.base.type].size,
                // 追加効果は再発動した対象のスキルとして出力へ反映する。
                additionalSkillPerDay: additionalSkillPerDayMap.get(pokemon) ?? 0,
              },
            )
            
            // げんきによるお手伝い効率が指定値を下回ったら不採用
            if (pokemon.dayHelpRate * 100 < config.teamSimulation.require.dayHelpRate
              || pokemon.nightHelpRate * 100 < config.teamSimulation.require.nightHelpRate
            ) {
              continue combinationLoop;
            }

            energy += pokemon.bEpD;
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
          if (config.teamSimulation.initialCookingPowerUp) {
            cookingPowerUpEffectList[0] += config.teamSimulation.initialCookingPowerUp
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
          // なべのサイズ、食材が足りていて、エナジーが最も高い料理を21回分計算
          // 最終エナジーを評価する場合は日曜優先で良い料理を作成、そうでなければ月曜から作成
          const selectedCookingList = [];
          let cookingCount = 0;
          let cookingList = [];
          let remainFoodEnergy = 0;
          if (config.simulation.cookingWeight > 0) {
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
              chanceWeekEffect = Cooking.getChanceWeekEffect(totalCookingChanceEffect, config.teamSimulation.day, config.teamSimulation.initialCookingChange)
              cookingChangeCache.set(totalCookingChanceEffect, chanceWeekEffect)
            }

            // 最終的に余った食材の平均パワーを計算
            let remainFoodList = Object.entries(foodNum).map(([name, num]) => ({ name, num, energy: Food.map[name].energy })).sort((a, b) => b.energy - a.energy);
            for(const { cooking, potSize, sunday, week, index } of selectedCookingList) {
              let potRemain = potSize - cooking.foodNum;

              if (config.teamSimulation.day == null) {
                // 余った食材を詰める
                let addFoodPower = 0;
                if (config.simulation.remainFoodMode == 0) {
                  while(potRemain > 0 && remainFoodList.length) {
                    const num = Math.min(potRemain, remainFoodList[0].num);
                    potRemain -= num;
                    remainFoodList[0].num -= num;
                    addFoodPower += remainFoodList[0].energy * num;
                    if (remainFoodList[0].num <= 0) remainFoodList.shift();
                  }
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
            if (config.simulation.remainFoodMode == 1) {
              remainFoodEnergy = remainFoodList.reduce((sum, { name, num }) => sum + (foodEnergyMap[name] ?? 0) * (addFoodNum[name] ?? 0) * config.simulation.remainFoodRate, 0);
              energy += remainFoodEnergy;
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
              pokemonList: pokemonList.map(({ skillWeightList, ...pokemon }) => ({
                // スキルコピーの参照先がチーム内のポケモンを指すため、結果をJSON化する前に計算用リストを除外する。
                ...pokemon,
                otherHealList: undefined,
                selfHealList: undefined,
              })),
              useFoodNum,
              addFoodNum,
              defaultFoodNum,
              foodNum,
              cookingPowerUpEffectList,
              remainFoodEnergy,
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
                progress: count / totalPattern * 0.9 + 0.1,
                bestResult,
              }
            })
          }
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
