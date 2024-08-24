import Nature from "../data/nature";
import Pokemon from "../data/pokemon";
import Skill from "../data/skill";
import SubSkill from "../data/sub-skill";
import EvaluateTableWorker from "../worker/evaluate-table-worker?worker";
import config from "./config";
import MultiWorker from "./multi-worker";

export default class EvaluateTable {

  static VERSION = 20240819;

  static load(config) {
    if (config.version.evaluateTable != this.VERSION) {
      return null
    }
    try {
      return JSON.parse(localStorage.getItem('evaluateTable'))
    } catch(e) {
      return null
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
    const fixedConfig = JSON.parse(JSON.stringify(newConfig ?? config));

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

    const multiWorker = new MultiWorker(EvaluateTableWorker, fixedConfig.workerNum)

    let lvList = Object.entries(fixedConfig.selectEvaluate.levelList).flatMap(([lv, enable]) => enable ? [Number(lv)] : [])

    // Lvごとに画面表示用の進捗カウンターを用意しておく
    let subProgressCounterList = progressCounter.split(...lvList.flatMap(lv => {
      let patternNum = this.getPatternNum(lv);
      return [patternNum, patternNum]
    }));

    // 最終進化のポケモンだけチェック
    let pokemonList = Pokemon.list.filter(pokemon => pokemon.afterList.length == 1 && pokemon.afterList[0] == pokemon.name)

    // スキルが計算しやすいポケモンと、そうでないポケモンの2つに分ける
    let normalPokemonList = pokemonList.filter(pokemon => !Skill.map[pokemon.skill].team && !Skill.map[pokemon.skill].shard)
    let supportPokemonList = pokemonList.filter(pokemon => Skill.map[pokemon.skill].team ||  Skill.map[pokemon.skill].shard)

    const subSkillCombinationMapCache = new Map();

    let result = {
      scoreForHealerEvaluate: {},
      scoreForSupportEvaluate: {},
    };
    let progressCounterIndex = 0;
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

      // 
      subProgressCounterList[progressCounterIndex].setName(`Lv${lv}の通常ポケモンの厳選情報を作成しています…`)
      let normalPokemonResult = await multiWorker.call(
        subProgressCounterList[progressCounterIndex++],
        (i, length) => {
          let i1 = Math.floor(normalPokemonList.length * i / length);
          let i2 = Math.floor(normalPokemonList.length * (i + 1) / length);
          return {
            lv,
            config: fixedConfig,
            pokemonList: normalPokemonList.slice(i1, i2),
            foodCombinationList,
            subSkillCombinationMap,
            // scoreForHealerEvaluate,
            // scoreForSupportEvaluate,
          }
        }
      )
      
      let normalPokemonEvaluateTable = normalPokemonResult.reduce((a, x) => ({ ...a, ...x.result}), {});

      let scoreForHealerEvaluateList = normalPokemonResult.flatMap(x => x.scoreForHealerEvaluateList);
      let scoreForSupportEvaluateList = normalPokemonResult.flatMap(x => x.scoreForSupportEvaluateList);
      scoreForHealerEvaluateList = scoreForHealerEvaluateList.sort((a, b) => b - a).slice(0, Math.floor(scoreForHealerEvaluateList.length * fixedConfig.selectEvaluate.supportRankNum))
      scoreForSupportEvaluateList = scoreForSupportEvaluateList.sort((a, b) => b - a).slice(0, Math.floor(scoreForSupportEvaluateList.length * fixedConfig.selectEvaluate.supportRankNum))
      let scoreForHealerEvaluate = scoreForHealerEvaluateList.reduce((a, x) => a + x, 0) / scoreForHealerEvaluateList.length;
      let scoreForSupportEvaluate = scoreForSupportEvaluateList.reduce((a, x) => a + x, 0) / scoreForSupportEvaluateList.length;

      result.scoreForHealerEvaluate[lv] = scoreForHealerEvaluate;
      result.scoreForSupportEvaluate[lv] = scoreForSupportEvaluate;

      subProgressCounterList[progressCounterIndex].setName(`Lv${lv}のサポート系スキルポケモンの厳選情報を作成しています…`)
      
      let supportPokemonResult = await multiWorker.call(
        subProgressCounterList[progressCounterIndex++],
        (i, length) => {
          let i1 = Math.floor(supportPokemonList.length * i / length);
          let i2 = Math.floor(supportPokemonList.length * (i + 1) / length);
          return {
            lv,
            config: fixedConfig,
            pokemonList: supportPokemonList.slice(i1, i2),
            foodCombinationList,
            subSkillCombinationMap,
            scoreForHealerEvaluate,
            scoreForSupportEvaluate,
          }
        }
      )
      let supportPokemonEvaluateTable = supportPokemonResult.reduce((a, x) => ({ ...a, ...x.result}), {});

      let pokemonEvaluateTable = { ...normalPokemonEvaluateTable, ...supportPokemonEvaluateTable };

      for(let pokemonName in pokemonEvaluateTable) {
        if(result[pokemonName] == null) result[pokemonName] = {};
        result[pokemonName][lv] = {};

        for(let foodCombination in pokemonEvaluateTable[pokemonName]) {
          let pokemonResult = pokemonEvaluateTable[pokemonName][foodCombination].percentile;
          result[pokemonName][lv][foodCombination] = {
            baseScore: Number(pokemonResult[fixedConfig.selectEvaluate.supportBorder].baseScore.toFixed(3)),
            pickupEnergyPerHelp: Number(pokemonResult[fixedConfig.selectEvaluate.supportBorder].pickupEnergyPerHelp.toFixed(3)),
            percentile: pokemonResult.map(x => Number(x.score.toFixed(3))),
            specialtyNumList: pokemonEvaluateTable[pokemonName][foodCombination].specialtyNumList.map(x => Number(x.toFixed(3))),
          }
        }
      }
    }

    localStorage.setItem('evaluateTable', JSON.stringify(result))

    return result;
  }

}