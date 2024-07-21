import Cooking from "../data/cooking";
import Food from "../data/food";
import Nature from "../data/nature";
import PokemonSimulator from "../models/pokemon-simulator";

self.addEventListener('message', async (event) => {
  const {
    config,
    lv,
    pokemonList,
    foodCombinationList,
    subSkillCombinationMap,
    scoreForHealerEvaluate,
    scoreForSupportEvaluate,
  } = event.data

  let natureList = [...Nature.list.filter(x => x.good != null), null];

  let result = {};
  let count = 0;
  let countMax = pokemonList.length
    * foodCombinationList.length
    * Object.values(subSkillCombinationMap).length
    * natureList.length;

  let foodIndexListList = foodCombinationList.map(x => x.split('').map(Number))

  await PokemonSimulator.isReady
  const simulator = new PokemonSimulator(config, PokemonSimulator.MODE_SELECT)

  let scoreForHealerEvaluateList = [];
  let scoreForSupportEvaluateList = [];

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
      let promiseList = []

      for(const subSkillCombination in subSkillCombinationMap) {
        let subSkillWeight = subSkillCombinationMap[subSkillCombination];
        let subSkillList = subSkillCombination.split('/')

        for(let nature of natureList) {
          promiseList.push((async () => {
            let natureWeight = nature == null ? 5 : 1;

            let eachResult = await simulator.selectEvaluate(pokemon, lv, foodList, subSkillList, nature,
              scoreForHealerEvaluate, scoreForSupportEvaluate,
            );
            if (isNaN(eachResult.energyPerDay)) {
              console.log(eachResult);
              throw '計算エラーが発生しました。'
            }
  
            scoreList.push(...new Array(subSkillWeight * natureWeight).fill({
              score: eachResult.energyPerDay,
              baseScore: eachResult.energyPerDay / eachResult.averageHelpRate,
              pickupEnergyPerHelp: eachResult.pickupEnergyPerHelp,
              subSkillList,
              eachResult,
              // nature,
            }));
  
            if(++count % 1000 == 0) {
              postMessage({
                status: 'progress',
                body: count / countMax,
              })
            }
          })())
        }
      }
      await Promise.all(promiseList);
      
      scoreList.sort((a, b) => a.score - b.score)
      let percentile = [];
      let eachResultList = [];
      for(let i = 0; i <= 100; i++) {
        percentile.push(scoreList[Math.round((scoreList.length - 1) * i / 100)]);
        eachResultList.push(scoreList[Math.round((scoreList.length - 1) * i / 100)])
      }

      result[pokemon.name][foodIndexList.join('')] = percentile

      scoreForHealerEvaluateList.push(percentile[config.selectEvaluate.supportBorder].baseScore)
      scoreForSupportEvaluateList.push(percentile[config.selectEvaluate.supportBorder].pickupEnergyPerHelp)

    }
  }

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