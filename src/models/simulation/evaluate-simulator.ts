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
    subSkillCombinationList: {
      s: number[],
      0?: number[],
      1?: number[],
      2?: number[],
      3?: number[],
    }[],
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
  const subSkillCombinationList = event.data.subSkillCombinationList.map(subSkillCombination => {
    const weightList = [];

    // IDからサブスキル名への変換は組み合わせごとに一度だけ行う。
    // ポケモン・食材・性格ごとの内側のループで変換すると大量の配列が生成されるため。
    const addWeight = (ids: number[] | undefined, yumebo: boolean, risabo: boolean) => {
      if (ids) weightList.push({
        yumebo,
        risabo,
        weight: ids[0],
        subSkillList: ids.slice(1).map(id => SubSkill.idMap[id].name),
      });
    };
    addWeight(subSkillCombination[0], false, false);
    addWeight(subSkillCombination[1], true,  false);
    addWeight(subSkillCombination[2], false, true);
    addWeight(subSkillCombination[3], true,  true);
    return {
      subSkillList: subSkillCombination.s.map(id => SubSkill.idMap[id].name),
      weightList,
    }
  })

  const natureList: NatureType[] = [...Nature.list.filter(x => x.good != null), null];

  const result = {};
  let count = 0;
  const countMax = pokemonList.length
    * foodCombinationList.length
    * subSkillCombinationList.length
    * natureList.length;

  const foodIndexListList = foodCombinationList.map(x => x.split('').map(Number))

  await PokemonSimulator.isReady
  const simulator = new PokemonSimulator(config, PokemonSimulator.MODE_SELECT)

  const scoreForHealerEvaluateList = [];
  const scoreForSupportEvaluateList = [];

  // let timeCounter = new TimeCounter();

  const totalWeight = subSkillCombinationList.reduce((a, x) => a + x.weightList.reduce((a, x) => a + x.weight, 0), 0) * Nature.list.length;

  for(let pokemon of pokemonList) {
    result[pokemon.name] = {};

    for(let foodIndexList of foodIndexListList) {

      // 食材を設定しておく
      const foodNameList = foodIndexList.map((f) => pokemon.foodNameList[f]);
      if (foodNameList.includes(undefined)) continue;
      
      // ゆめのかけら／リサーチEXPボーナスの有無で変わるのはエナジースコアだけ。
      // そのため、エナジーはボーナス別、その他6項目はシミュレーション結果別に保持する。
      // 全項目をボーナス別に保持すると、6項目のソート対象が最大4倍になってしまう。
      const energyScoreList = [];
      const commonScoreList = [];

      const simulatedPokemon = simulator.fromEvaluate(
        pokemon,
        lv,
        foodNameList,
      )

      for(const subSkillCombination of subSkillCombinationList) {
        const { subSkillList, weightList } = subSkillCombination

        for(const nature of natureList) {
          const natureWeight = nature == null ? 5 : 1;

          const eachResult = simulator.selectEvaluate(
            simulatedPokemon, subSkillList.map(x => SubSkill.map[x]), nature,
            scoreForHealerEvaluate, scoreForSupportEvaluate, 
            // timeCounter
          );
          const [food1, food2, food3] = pokemon.foodNameList.map((x) => eachResult[x] ?? 0);

          if (isNaN(eachResult.energyPerDay)) {
            console.error(eachResult);
            throw '計算エラーが発生しました。'
          }

          let commonWeight = 0;
          let commonSubSkillList: string[] | null = null;

          // エナジーはボーナスの組み合わせごとに値が異なるため、個別に記録する。
          for(const weight of weightList) {
            let score = simulator.selectEvaluateToScore(eachResult, weight.yumebo, weight.risabo);
            const rawScore = score;

            if (subSkillList.includes('睡眠EXPボーナス')) {
              score += config.selectEvaluate.subSkill.suiminExpBonus.add;
              score += rawScore * (config.selectEvaluate.subSkill.suiminExpBonus.rate - 1);
            }
            if (nature?.good === 'EXP獲得量') {
              score += config.selectEvaluate.nature.expUp.add;
              score += rawScore * (config.selectEvaluate.nature.expUp.rate - 1);
            }
            if (nature?.weak === 'EXP獲得量') {
              score += config.selectEvaluate.nature.expDown.add;
              score += rawScore * (config.selectEvaluate.nature.expDown.rate - 1);
            }

            energyScoreList.push([
              score,
              rawScore / eachResult.averageHelpRate, // baseScore
              eachResult.pickupEnergyPerHelp, // pickupEnergyPerHelp
              weight.subSkillList,
              eachResult.nature?.name,              // nature
              weight.weight * natureWeight,             // weight
            ]);
            commonWeight += weight.weight * natureWeight;
            commonSubSkillList ??= weight.subSkillList;
          }

          // きのみ・食材・スキル回数はボーナスの影響を受けない。
          // 同じ値を複製せず、各ボーナスの重みだけを合算して1件にまとめる。
          // 同値の要素を重み付きで統合しても、後段で得られるパーセンタイル値は変わらない。
          commonScoreList.push([
            eachResult.berryNumPerDay,
            eachResult.foodNumPerDay,
            eachResult.skillPerDay,
            food1,
            food2,
            food3,
            commonSubSkillList,
            eachResult.nature?.name,
            commonWeight,
          ]);

          if(++count % 1000 == 0) {
            // console.log(count, countMax);
            postMessage({
              status: 'progress',
              body: count / countMax,
            })
          }
        }
      }

      const percentile = {
        energy: [],
        berry: [],
        food: [],
        skill: [],
        food1: [],
        food2: [],
        food3: [],
        baseScore: null,
        pickupEnergyPerHelp: null,
      };

      // スコアを昇順に並べ、累積重みが各パーセンタイルの位置を含む要素を採用する。
      // エナジーだけはサポート系スキル評価の基準値も同時に取得する。
      energyScoreList.sort((a, b) => a[0] - b[0]);
      let weightSum = 0;
      let nextIndex = 0;
      for(const [energy, baseScore, pickupEnergyPerHelp, subSkillList, nature, weight] of energyScoreList) {
        const nextWeightSum = weightSum + weight;
        while (weightSum <= nextIndex && nextIndex < nextWeightSum && percentile.energy.length <= 100) {
          if (percentile.energy.length == config.selectEvaluate.supportBorder) {
            scoreForHealerEvaluateList.push(baseScore);
            scoreForSupportEvaluateList.push(pickupEnergyPerHelp);
            percentile.baseScore = baseScore;
            percentile.pickupEnergyPerHelp = pickupEnergyPerHelp;
          }
          percentile.energy.push({ score: energy, subSkillList, nature });
          nextIndex = Math.round((totalWeight - 1) * percentile.energy.length / 100);
        }
        weightSum = nextWeightSum;
      }

      // エナジー以外の6項目は、重みを統合した小さい配列を項目ごとにソートする。
      for(const [index, key] of ['berry', 'food', 'skill', 'food1', 'food2', 'food3'].entries()) {
        commonScoreList.sort((a, b) => a[index] - b[index])

        weightSum = 0;
        nextIndex = 0;
        for(const item of commonScoreList) {
          const subSkillList = item[6];
          const nature = item[7];
          const weight = item[8];
          const nextWeightSum = weightSum + weight
          while (weightSum <= nextIndex && nextIndex < nextWeightSum && percentile[key].length <= 100) {
            percentile[key].push({ score: item[index], subSkillList, nature });
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
      scoreForHealerEvaluateList,
      scoreForSupportEvaluateList,
      result,
    }
  })

})

export default {}
