import Cooking from "../data/cooking";
import Food from "../data/food";
import Nature from "../data/nature";
import SubSkill from "../data/sub-skill";
import SubSkillCombination from "../data/sub-skill-combination";
import PokemonSimulator from "../models/pokemon-simulator";
import TimeCounter from "../models/time-counter";

self.addEventListener('message', async (event) => {
  const {
    config,
    lv,
    pokemonList,
    foodCombinationList,
    scoreForHealerEvaluate,
    scoreForSupportEvaluate,
  } = event.data;


  // サブスキルの組み合わせを列挙
  const subSkillNum = lv < 10 ? 0 : lv < 25 ? 1 : lv < 50 ? 2 : lv < 75 ? 3 : lv < 100 ? 4 : 5;
  let subSkillCombinationList = SubSkillCombination[(config.selectEvaluate.silverSeedUse ? 's' : 'n') + subSkillNum] ?? [[1]]
  if (subSkillCombinationList == null) {
    throw 'サブスキルの組み合わせの取得に失敗しました。'
  }

  subSkillCombinationList = subSkillCombinationList.map(subSkillCombination => {
    let weightList = [];
    if (subSkillCombination[0]) weightList.push({ yumebo: false, risabo: false, weight: subSkillCombination[0] })
    if (subSkillCombination[1]) weightList.push({ yumebo:  true, risabo: false, weight: subSkillCombination[1] })
    if (subSkillCombination[2]) weightList.push({ yumebo: false, risabo:  true, weight: subSkillCombination[2] })
    if (subSkillCombination[3]) weightList.push({ yumebo:  true, risabo:  true, weight: subSkillCombination[3] })
    return {
      subSkillList: subSkillCombination.s.map(id => SubSkill.idMap[id].name),
      weightList,
    }
  })

  let natureList = [...Nature.list.filter(x => x.good != null), null];

  let result = {};
  let count = 0;
  let countMax = pokemonList.length
    * foodCombinationList.length
    * subSkillCombinationList.length
    * natureList.length;

  let foodIndexListList = foodCombinationList.map(x => x.split('').map(Number))

  await PokemonSimulator.isReady
  const simulator = new PokemonSimulator(config, PokemonSimulator.MODE_SELECT)

  let scoreForHealerEvaluateList = [];
  let scoreForSupportEvaluateList = [];

  // let timeCounter = new TimeCounter();

  let totalWeight = subSkillCombinationList.reduce((a, x) => a + x.weightList.reduce((a, x) => a + x.weight, 0), 0) * Nature.list.length;

  for(let pokemon of pokemonList) {
    result[pokemon.name] = {};

    for(let foodIndexList of foodIndexListList) {

      // 食材を設定しておく
      let foodList = foodIndexList.map((f, i) => {
        const food = Food.map[pokemon.foodList[f]?.name];
        if (food == null) return null;
        return {
          name: pokemon.foodList[f].name,
          num: pokemon.foodList[f].numList[i],
          energy: food.energy * pokemon.foodList[f].numList[i]
            * ((food.bestRate * Cooking.maxRecipeBonus - 1) * config.selectEvaluate.foodEnergyRate / 100 + 1),
        }
      });
      if (foodList.includes(null)) continue;

      let scoreList = [];
      let specialtyNumList = [];

      for(const subSkillCombination of subSkillCombinationList) {
        let { subSkillList, weightList } = subSkillCombination

        for(let nature of natureList) {
          let natureWeight = nature == null ? 5 : 1;

          let eachResult = simulator.selectEvaluate(pokemon, lv, foodList, subSkillList, nature,
            scoreForHealerEvaluate, scoreForSupportEvaluate, 
            // timeCounter
          );

          if (isNaN(eachResult.energyPerDay)) {
            console.log(eachResult);
            throw '計算エラーが発生しました。'
          }

          for(let weight of weightList) {
            let score = simulator.selectEvaluateToScore(pokemon, weight.yumebo, weight.risabo)

            scoreList.push({
              score: score,
              baseScore: score / eachResult.averageHelpRate,
              pickupEnergyPerHelp: eachResult.pickupEnergyPerHelp,
              // subSkillList,
              eachResult,
              weight: weight.weight * natureWeight,
              // nature,
            });
            let specialtyScore;
            if (pokemon.specialty == 'きのみ') specialtyScore = eachResult.berryNumPerDay;
            if (pokemon.specialty == '食材')   specialtyScore = eachResult.foodNumPerDay;
            if (pokemon.specialty == 'スキル') specialtyScore = eachResult.skillPerDay;
            specialtyNumList.push({ score: specialtyScore, weight: weight.weight * natureWeight })

          }

          if(++count % 1000 == 0) {
            // console.log(count, countMax);
            postMessage({
              status: 'progress',
              body: count / countMax,
            })
          }
        }
      }

      scoreList.sort((a, b) => a.score - b.score)
      specialtyNumList.sort((a, b) => a.score - b.score);
      let percentile = [];
      let specialtyNumList100 = [];

      let weightSum = 0;
      let percentileIndex = 0;
      let nextIndex = 0;
      for(let i = 0; i < scoreList.length; i++) {
        let nextWeightSum = weightSum + scoreList[i].weight
        while (weightSum <= nextIndex && nextIndex < nextWeightSum && percentileIndex <= 100) {
          let percentileItem = { ...scoreList[i] };
          delete percentileItem.weight
          percentile.push(percentileItem);
          specialtyNumList100.push(specialtyNumList[i].score);

          percentileIndex++;
          nextIndex = Math.round((totalWeight - 1) * percentileIndex / 100)
        }
        weightSum = nextWeightSum;
      }

      result[pokemon.name][foodIndexList.join('')] = {
        percentile,
        specialtyNumList: specialtyNumList100,
      }

      scoreForHealerEvaluateList.push(percentile[config.selectEvaluate.supportBorder].baseScore)
      scoreForSupportEvaluateList.push(percentile[config.selectEvaluate.supportBorder].pickupEnergyPerHelp)

    }
  }

  // timeCounter.print();

  postMessage({
    status: 'success',
    body: {
      scoreForHealerEvaluateList: scoreForHealerEvaluateList,
      scoreForSupportEvaluateList: scoreForSupportEvaluateList,
      result,
    }
  })

})

export default {}