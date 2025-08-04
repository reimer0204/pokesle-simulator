import Nature from "../../data/nature";
import SubSkill from "../../data/sub-skill";
import SubSkillCombination from "../../data/sub-skill-combination";
import PokemonSimulator from "../simulation/pokemon-simulator";
import TimeCounter from "../time-counter";
import type { NatureType, PokemonType } from "../../type";

declare const self: ServiceWorkerGlobalScope;
self.addEventListener('message', async (event: {
  data: {
    config: any,
    lv: number,
    pokemonList: PokemonType[],
    foodCombinationList: string[],
    scoreForHealerEvaluate: number,
    scoreForSupportEvaluate: number,
  }
}) => {
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
    if (subSkillCombination[0]) weightList.push({ yumebo: false, risabo: false, weight: subSkillCombination[0][0], ids: subSkillCombination[0].slice(1) })
    if (subSkillCombination[1]) weightList.push({ yumebo:  true, risabo: false, weight: subSkillCombination[1][0], ids: subSkillCombination[1].slice(1) })
    if (subSkillCombination[2]) weightList.push({ yumebo: false, risabo:  true, weight: subSkillCombination[2][0], ids: subSkillCombination[2].slice(1) })
    if (subSkillCombination[3]) weightList.push({ yumebo:  true, risabo:  true, weight: subSkillCombination[3][0], ids: subSkillCombination[3].slice(1) })
    return {
      subSkillList: subSkillCombination.s.map(id => SubSkill.idMap[id].name),
      weightList,
    }
  })

  let natureList: NatureType[] = [...Nature.list.filter(x => x.good != null), null];

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
      let foodNameList = foodIndexList.map((f, i) => pokemon.foodNameList[f]);
      if (foodNameList.includes(undefined)) continue;
      
      let scoreList = []
      let specialtyNumList = [];
      let scoreListIndex = 0;
      

      const simulatedPokemon = simulator.fromEvaluate(
        pokemon,
        lv,
        foodNameList,
      )

      for(const subSkillCombination of subSkillCombinationList) {
        let { subSkillList: subSkillNameList, weightList } = subSkillCombination
        const subSkillList = subSkillNameList.map(x => SubSkill.map[x])

        for(let nature of natureList) {
          let natureWeight = nature == null ? 5 : 1;

          let eachResult = simulator.selectEvaluate(
            simulatedPokemon, subSkillList, nature,
            scoreForHealerEvaluate, scoreForSupportEvaluate, 
            // timeCounter
          );

          // if (isNaN(eachResult.energyPerDay)) {
          //   console.log(eachResult);
          //   throw '計算エラーが発生しました。'
          // }

          for(let weight of weightList) {
            let score = simulator.selectEvaluateToScore(eachResult, weight.yumebo, weight.risabo)

            const obj = [
              score,
              eachResult.berryNumPerDay,
              eachResult.foodNumPerDay,
              eachResult.skillPerDay,
              score / eachResult.averageHelpRate, // baseScore
              eachResult.pickupEnergyPerHelp, // pickupEnergyPerHelp
              subSkillNameList,               // subSkillList
              eachResult.nature?.name,              // nature
              weight.weight * natureWeight,             // weight
            ]
            scoreList.push(obj);
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

      let percentile = {
        energy: [],
        berry: [],
        food: [],
        skill: [],
      };
      for(const [index, key] of ['energy', 'berry', 'food', 'skill'].entries()) {
        scoreList.sort((a, b) => a[index] - b[index])
        let weightSum = 0;
        let nextIndex = 0;
        for(let i = 0; i < scoreList.length; i++) {
          let nextWeightSum = weightSum + scoreList[i].weight
          while (weightSum <= nextIndex && nextIndex < nextWeightSum && percentile[key].length <= 100) {
            let [energy, berry, food, skill, baseScore, pickupEnergyPerHelp, subSkillList, nature, weight] = scoreList[i];
            let tmp = { energy, berry, food, skill }
            if (i == 0 && percentile[key].length == config.selectEvaluate.supportBorder) {
              scoreForHealerEvaluateList.push(baseScore)
              scoreForSupportEvaluateList.push(pickupEnergyPerHelp)
            }
            percentile[key].push({ score: tmp[key], subSkillList, nature });
            nextIndex = Math.round((totalWeight - 1) * percentile[key].length / 100)
          }
          weightSum = nextWeightSum;
        }
      }

      result[pokemon.name][foodIndexList.join('')] = percentile
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