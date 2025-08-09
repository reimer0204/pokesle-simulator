import Nature from "../../data/nature";
import Pokemon from "../../data/pokemon";
import Skill from "../../data/skill";
import SubSkill from "../../data/sub-skill";
import SubSkillCombination from "../../data/sub-skill-combination";
import EvaluateTableWorker from "./evaluate-simulator?worker";
import config from "../config";
import MultiWorker from "../multi-worker";
import Version from "../version";

const DB_NAME = 'evaluateTable';
const DB_VERSION = 1;

const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
  try {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest).result as IDBDatabase;
      if (!db.objectStoreNames.contains('evaluate')) {
        const evaluateStore = db.createObjectStore('evaluate', { keyPath: 'keyPath' });
        evaluateStore.createIndex("pokemonName", "name", { unique: false });
        evaluateStore.createIndex("pokemonFood", ["name", "lv", "foodCombination"], { unique: false });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBRequest).result as IDBDatabase;
      resolve(db);
    };

    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
  } catch (error) {
    reject(error);
  }
})

export default class EvaluateTable {

  static VERSION = Version.EVALUATE;

  static isEnableEvaluateTable(config) {
    return config.version.evaluateTable == this.VERSION
      && config.sleepTime == config.version.evaluateTableSleepTime
      && config.checkFreq == config.version.evaluateTableCheckFreq
  }

  static async canUseEvaluateTable() {
    try {
      await dbPromise
      return true;
    } catch(e) {
      return false;
    }
  }

  static async load(config, full = false) {
    if (!this.isEnableEvaluateTable(config)) {
      return null
    }
    try {
      const db = await dbPromise
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('evaluate')
        const store = transaction.objectStore('evaluate')
        const request = store.getAll()
        request.onerror = () => {
          reject(false)
        }
        request.onsuccess = (event) => {
          let result = {}
          for(const record of request.result) {
            if (result[record.name] === undefined) result[record.name] = {}
            if (result[record.name][record.lv] === undefined) result[record.name][record.lv] = {}
            result[record.name][record.lv][record.foodCombination] = {
              energy: record.energy,
              berry: record.berry,
              food: record.food,
              skill: record.skill,
            }
          }
          resolve(result);
        }
      })
      // return JSON.parse(localStorage.getItem('evaluateTable'))
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
    const subSkillCombinationNum = (SubSkillCombination[(config.selectEvaluate.silverSeedUse ? 's' : 'n') + subSkillNum] ?? [[]]).length;

    return foodNum * subSkillCombinationNum * Nature.list.length;
  }

  static async simulation(newConfig = null, progressCounter) {
    const fixedConfig = JSON.parse(JSON.stringify(newConfig ?? config));

    const multiWorker = new MultiWorker(EvaluateTableWorker, fixedConfig.workerNum)

    let lvList = Object.entries(fixedConfig.selectEvaluate.levelList).flatMap(([lv, enable]) => enable ? [Number(lv)] : [])

    // Lvごとに画面表示用の進捗カウンターを用意しておく
    let subProgressCounterList = progressCounter.split(...lvList.flatMap(lv => {
      let patternNum = this.getPatternNum(lv);
      return [patternNum, patternNum]
    }));

    // 最終進化のポケモンだけチェック
    let pokemonList = Pokemon.list.filter(pokemon => pokemon.afterList.length == 1 && pokemon.afterList[0] == pokemon.name)

    // 特定のポケモンは厳選生成の対象外
    pokemonList = pokemonList.filter(x => x.name != 'ダークライ')

    // スキルが計算しやすいポケモンと、そうでないポケモンの2つに分ける
    let normalPokemonList = pokemonList.filter(pokemon => !pokemon.skill.team && !pokemon.skill.shard)
    let supportPokemonList = pokemonList.filter(pokemon => pokemon.skill.team ||  pokemon.skill.shard)

    let result = [];
    let progressCounterIndex = 0;
    for(let lv of lvList) {
      const foodCombinationList = lv < 30 ? ['0'] : lv < 60 ? [ '00', '01' ] : [ '000', '001', '002', '010', '011', '012' ];

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
            // subSkillCombinationList,
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

      result.push({ name: 'scoreForHealerEvaluate',  lv, foodCombination: '', energy: scoreForHealerEvaluate });
      result.push({ name: 'scoreForSupportEvaluate', lv, foodCombination: '', energy: scoreForSupportEvaluate });

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
            scoreForHealerEvaluate,
            scoreForSupportEvaluate,
          }
        }
      )
      let supportPokemonEvaluateTable = supportPokemonResult.reduce((a, x) => ({ ...a, ...x.result}), {});

      let pokemonEvaluateTable = { ...normalPokemonEvaluateTable, ...supportPokemonEvaluateTable };

      for(let pokemonName in pokemonEvaluateTable) {

        for(let foodCombination in pokemonEvaluateTable[pokemonName]) {
          let pokemonResult = pokemonEvaluateTable[pokemonName][foodCombination];
          result.push({
            name: pokemonName, 
            lv,
            foodCombination,
            energy: pokemonResult.energy.map(x => x.score),
            berry: pokemonResult.berry.map(x => x.score),
            food: pokemonResult.food.map(x => x.score),
            skill: pokemonResult.skill.map(x => x.score),
          })
        }
      }
    }

    // localStorage.setItem('evaluateTable', JSON.stringify(result))

    await new Promise(async (resolve, reject) => {
      try {
        const db = await dbPromise;
        const transaction = db.transaction("evaluate", "readwrite");
        const store = transaction.objectStore("evaluate");

        await new Promise((resolve, reject) => {
          const clearRequest = store.clear()
          clearRequest.onsuccess = (event) => {
            resolve(true);
          }
          clearRequest.onerror = (event) => {
            reject(false)
          }
        })

        for(let item of result) {
          const add = store.add({
            keyPath: `${item.name}_${item.lv}_${item.foodCombination}`,
            ...item
          });
          add.onerror = (event) => {
            console.error(item)
            reject(event)
          }
        }
        transaction.oncomplete = (event) => {
          resolve(true);
        }
        transaction.onerror = (event) => {
          reject(true);
        }
      } catch(e) {
        reject(e)
      }
    })

    multiWorker.close()

    return result;
  }

}