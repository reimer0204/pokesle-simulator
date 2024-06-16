import Nature from "../data/nature";
import Pokemon from "../data/pokemon";
import Skill from "../data/skill";
import SubSkill from "../data/sub-skill";
import EvaluateTableSimulator from "../worker/evaluate-table-simulator?worker";
import config from "./config";

export default class EvaluateTable {

  static load() {
    try {
      return JSON.parse(localStorage.getItem('evaluateTable'))
    } catch(e) {
      return null;
    }
  }

  static getAllPatternNum(newConfig) {
    let lvList = Object.entries(newConfig.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))
    return lvList.reduce((a, x) => a + this.getPatternNum(x), 0)
  }

  static getPatternNum(lv) {
    const foodNum = lv < 30 ? 1 : lv < 60 ? 2 : 6;
    const subSkillNum = lv < 10 ? 0 : lv < 25 ? 1 : lv < 50 ? 2 : lv < 75 ? 3 : lv < 100 ? 4 : 5;
    let subSkillCombinationNum = 1;
    for(let i = 0; i < subSkillNum; i++) subSkillCombinationNum *= SubSkill.list.length - i;
    for(let i = 0; i < subSkillNum; i++) subSkillCombinationNum /= i + 1;

    return foodNum * subSkillCombinationNum * Nature.list.length;
  }

  static async simulation(newConfig = null, progressCounter) {
    const fixedConfig = newConfig ?? config;

    function combination(r, n, s = 0) {
      if (n == 0) return [[]];
      let result = [];

      for(let i = s; i < r - n + 1; i++) {
        for(let subList of combination(r, n - 1, i + 1)) {
          result.push([i, ...subList])
        }
      }

      return result;
    }

    async function callWorker(
      progressCounter,
      lv, pokemonList, foodCombinationList, subSkillCombinationMap,
      scoreForHealerEvaluate = null, scoreForSupportEvaluate = null
    ) {
      let promiseList = [];
      let workerProgressList = []
      for (let i = 0; i < fixedConfig.workerNum; i++) {
        workerProgressList.push(0)

        promiseList.push(new Promise((resolve, reject) => {
          const worker = new EvaluateTableSimulator();

          worker.onmessage = ({ data: { status, body } }) => {
            if (status == 'error') {
              reject(body);
              worker.terminate();
            }

            if (status == 'progress') {
              workerProgressList[i] = body;
            }
            if (status == 'success') {
              workerProgressList[i] = 1;
              resolve(body)
              worker.terminate();
            }
            progressCounter.set(workerProgressList.reduce((a, x) => a + x, 0) / workerProgressList.length)
          }

          let i1 = Math.floor(pokemonList.length * i / fixedConfig.workerNum);
          let i2 = Math.floor(pokemonList.length * (i + 1) / fixedConfig.workerNum);

          worker.postMessage({
            type: 'launch',
            lv,
            config: JSON.parse(JSON.stringify(fixedConfig)),
            pokemonList: pokemonList.slice(i1, i2),
            foodCombinationList,
            subSkillCombinationMap,
            scoreForHealerEvaluate,
            scoreForSupportEvaluate,
          })
        }))
      }
      progressCounter.set(1)

      let result = {};
      let scoreForHealerEvaluateList = [];
      let scoreForSupportEvaluateList = [];
      for(let part of await Promise.all(promiseList)) {
        Object.assign(result, part.result);
        scoreForHealerEvaluateList.push(...part.scoreForHealerEvaluateList);
        scoreForSupportEvaluateList.push(...part.scoreForSupportEvaluateList);
      }
      scoreForHealerEvaluateList = scoreForHealerEvaluateList.sort((a, b) => b - a).slice(0, Math.floor(scoreForHealerEvaluateList.length / 2))
      scoreForSupportEvaluateList = scoreForSupportEvaluateList.sort((a, b) => b - a).slice(0, Math.floor(scoreForSupportEvaluateList.length / 2))

      let averageScoreForHealerEvaluate = scoreForHealerEvaluateList.reduce((a, x) => a + x, 0) / scoreForHealerEvaluateList.length;
      let averageScoreForSupportEvaluate = scoreForSupportEvaluateList.reduce((a, x) => a + x, 0) / scoreForSupportEvaluateList.length;

      return {
        result,
        scoreForHealerEvaluate: averageScoreForHealerEvaluate,
        scoreForSupportEvaluate: averageScoreForSupportEvaluate,
      }
    }

    let lvList = Object.entries(fixedConfig.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))

    let subProgressCounterList = progressCounter.split(...lvList.flatMap(lv => {
      let patternNum = this.getPatternNum(lv);
      return [patternNum, patternNum]
    }));

    // 最終進化のポケモンだけチェック
    let pokemonList = Pokemon.list.filter(pokemon => pokemon.afterList.length == 1 && pokemon.afterList[0] == pokemon.name)
    let normalPokemonList = pokemonList.filter(pokemon => !Skill.map[pokemon.skill].team)
    let supportPokemonList = pokemonList.filter(pokemon => Skill.map[pokemon.skill].team)

    const subSkillCombinationMapCache = new Map();

    let result = {
      scoreForHealerEvaluate: {},
      scoreForSupportEvaluate: {},
    };
    let counterIndex = 0;
    for(let lv of lvList) {
      const foodCombinationList = lv < 30 ? ['0'] : lv < 60 ? [ '00', '01' ] : [ '000', '001', '002', '010', '011', '012' ];

      // サブスキルの組み合わせを列挙
      const subSkillNum = lv < 10 ? 0 : lv < 25 ? 1 : lv < 50 ? 2 : lv < 75 ? 3 : lv < 100 ? 4 : 5;
      let subSkillCombinationMap = subSkillCombinationMapCache.get(subSkillNum)
      if (subSkillCombinationMap == null) {
        subSkillCombinationMap = {};
        for(const indexes of combination(SubSkill.list.length, subSkillNum)) {
          let subSkillList = indexes.map(i => SubSkill.list[i].name);
          let subSkillSet = new Set(subSkillList);

          if (config.selectEvaluate.silverSeedUse) {
            if (subSkillSet.has('最大所持数アップM') && !subSkillSet.has('最大所持数アップL')) { subSkillSet.delete('最大所持数アップM'); subSkillSet.add('最大所持数アップL') };
            if (subSkillSet.has('最大所持数アップS') && !subSkillSet.has('最大所持数アップL')) { subSkillSet.delete('最大所持数アップS'); subSkillSet.add('最大所持数アップL') };
            if (subSkillSet.has('最大所持数アップS') && !subSkillSet.has('最大所持数アップM')) { subSkillSet.delete('最大所持数アップS'); subSkillSet.add('最大所持数アップM') };
            if (subSkillSet.has('スキルレベルアップS') && !subSkillSet.has('スキルレベルアップM')) { subSkillSet.delete('スキルレベルアップS'); subSkillSet.add('スキルレベルアップM') };
            if (subSkillSet.has('スキル確率アップS') && !subSkillSet.has('スキル確率アップM')) { subSkillSet.delete('スキル確率アップS'); subSkillSet.add('スキル確率アップM') };
            if (subSkillSet.has('食材確率アップS') && !subSkillSet.has('食材確率アップM')) { subSkillSet.delete('食材確率アップS'); subSkillSet.add('食材確率アップM') };
            if (subSkillSet.has('おてつだいスピードS') && !subSkillSet.has('おてつだいスピードM')) { subSkillSet.delete('おてつだいスピードS'); subSkillSet.add('おてつだいスピードM') };
          }

          let subSkillKey = [...subSkillSet].sort().join('/');
          subSkillCombinationMap[subSkillKey] = (subSkillCombinationMap[subSkillKey] ?? 0) + 1;
        }
        subSkillCombinationMapCache.get(subSkillNum, subSkillCombinationMap);
      }

      subProgressCounterList[counterIndex].setName(`Lv${lv}の厳選情報を作成しています…`)
      let {
        result: normalPokemonEvaluateTable,
        scoreForHealerEvaluate,
        scoreForSupportEvaluate,
      } = await callWorker(
        subProgressCounterList[counterIndex++],
        lv, normalPokemonList, foodCombinationList, subSkillCombinationMap
      );

      result.scoreForHealerEvaluate[lv] = scoreForHealerEvaluate;
      result.scoreForSupportEvaluate[lv] = scoreForSupportEvaluate;

      subProgressCounterList[counterIndex].setName(`Lv${lv}の厳選情報を作成しています…`)
      let {
        result: supportPokemonEvaluateTable,
      } = await callWorker(
        subProgressCounterList[counterIndex++],
        lv, supportPokemonList, foodCombinationList, subSkillCombinationMap,
        scoreForHealerEvaluate, scoreForSupportEvaluate
      );

      let pokemonEvaluateTable = { ...normalPokemonEvaluateTable, ...supportPokemonEvaluateTable };

      for(let pokemonName in pokemonEvaluateTable) {
        if(result[pokemonName] == null) result[pokemonName] = {};
        result[pokemonName][lv] = {};

        for(let foodCombination in pokemonEvaluateTable[pokemonName]) {
          let pokemonResult = pokemonEvaluateTable[pokemonName][foodCombination];
          result[pokemonName][lv][foodCombination] = {
            baseScore: Number(pokemonResult[fixedConfig.selectEvaluate.supportBorder].baseScore.toFixed(3)),
            pickupEnergyPerHelp: Number(pokemonResult[fixedConfig.selectEvaluate.supportBorder].pickupEnergyPerHelp.toFixed(3)),
            percentile: pokemonResult.map(x => Number(x.score.toFixed(3))),
          }
        }
      }
    }

    localStorage.setItem('evaluateTable', JSON.stringify(result))

    return result;
  }

}