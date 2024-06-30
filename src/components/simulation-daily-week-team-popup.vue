<script setup>
import { onBeforeUnmount } from 'vue';
import Food from '../data/food';
import SubSkill from '../data/sub-skill';
import { AsyncWatcher } from '../models/async-watcher';
import config from '../models/config';
import MultiWorker from '../models/multi-worker';
import PokemonListSimulator from '../worker/pokemon-list-simulator?worker';
import TeamSimulator from '../worker/team-simulator?worker';
import AsyncWatcherArea from './async-watcher-area.vue';
import NatureInfo from './nature-info.vue';
import PopupBase from './popup-base.vue';
import SettingList from './setting-list.vue';
import PokemonBox from '../models/pokemon-box';

const asyncWatcher = AsyncWatcher.init();
const $emit = defineEmits(['close']);

const sundayPrepare = ref(true);
const nextSundayPrepare = ref(true);

const simulationResult = ref({
  cookingTypeList: [],
})
// const cookingType = ref('')
const cookingType = ref('')

const multiWorker = new MultiWorker(TeamSimulator, config.workerNum)
const pokemonMultiWorker = new MultiWorker(PokemonListSimulator, config.workerNum)
onBeforeUnmount(() => {
  multiWorker.close();
  pokemonMultiWorker.close();
})

async function pokemonAboutScoreSimulation(customConfig, progressCounter) {
  let [setConfigProgress, calcBase, calcAssist] = progressCounter.split(1, 1, 2)

  await pokemonMultiWorker.call(
    setConfigProgress,
    () => ({ type: 'config', config: JSON.parse(JSON.stringify(customConfig)) })
  )

  let pokemonList = PokemonBox.list;

  pokemonList = (await pokemonMultiWorker.call(
    calcBase,
    (i) => {
      let startIndex = Math.floor(pokemonList.length * i / config.workerNum);
      let endIndex = Math.floor(pokemonList.length * (i + 1) / config.workerNum);
      return {
        type: 'basic',
        pokemonList: pokemonList.slice(startIndex, endIndex),
        startIndex,
      }
    }
  )).flat(1);

  /* ここからおてボとかげんき回復系の計算 */
  // おてボ用に概算日給の高い上位6匹をリストアップしておく
  let helpBonusTop6 = pokemonList.toSorted((a, b) => b.tmpScore - a.tmpScore).slice(0, 6);

  // おてサポ用に1回の手伝いが多い上位6匹をリストアップしておく
  let pickupEnergyPerHelpTop5 = pokemonList.toSorted((a, b) => b.pickupEnergyPerHelp - a.pickupEnergyPerHelp).slice(0, 6)

  // げんき回復スキルの効果を概算するため、げんき回復なしの強い上位6匹と、その6位より強い回復持ちをリストアップしておく
  let healCheckTarget = pokemonList.filter(x => x.healEffect == 0).toSorted((a, b) => b.tmpScore - a.tmpScore).slice(0, 6)
  healCheckTarget.push(...pokemonList.filter(x => x.healEffect != 0 && x.tmpScore > (healCheckTarget.at(-1)?.tmpScore ?? 0)))

  return (await pokemonMultiWorker.call(
    calcAssist,
    (i) => {
      return {
        type: 'assist',
        pokemonList: pokemonList.slice(
          Math.floor(pokemonList.length * i / config.workerNum),
          Math.floor(pokemonList.length * (i + 1) / config.workerNum),
        ),
        helpBonusTop6,
        pickupEnergyPerHelpTop5,
        healCheckTarget,
      }
    }
  )).flat(1);
}

async function configSimulation(config, progressCounter, fixIgnore = false) {
  let [stepA, stepB, stepC] = progressCounter.split(1, 3, 8);

  config = JSON.parse(JSON.stringify(config))

  let pokemonList = await pokemonAboutScoreSimulation(config, stepA)

  // 固定のポケモンと推論対象を選ぶ
  const fixedPokemonList = fixIgnore ? [] : JSON.parse(JSON.stringify(pokemonList.filter(x => x.fix == 1)));
  let targetPokemonList = pokemonList.filter(x => x.fix == null);

  const rankMax = Math.min(config.teamSimulation.maxRank, targetPokemonList.length);
  const pickup = 5 - fixedPokemonList.length;

  // スコアの高い上位のみをピックアップ
  targetPokemonList = JSON.parse(JSON.stringify(targetPokemonList.sort((a, b) => b.score - a.score).slice(0, rankMax)));



  // 組み合わせを列挙
  let combinationList = await (async () => {
    let combinationWorkerParameterList = new Array(config.workerNum).fill(0).map(x => ({
      sum: 0,
      topList: [],
    }));
    for(let i = 0; i <= rankMax - pickup; i++) {
      let combinationSize = 1;
      for(let j = 1; j <= pickup - 1; j++) {
        combinationSize *= rankMax - i - j;
        combinationSize /= j;
      }

      let min = null;
      for(let combinationWorkerParameter of combinationWorkerParameterList) {
        if(min == null || combinationWorkerParameter.sum < min.sum) {
          min = combinationWorkerParameter;
        }
      }
      min.sum += combinationSize;
      min.topList.push(i);
    }

    return (await multiWorker.call(
      stepB,
      (i) => ({
        type: 'combination',
        rankMax,
        pickup,
        pattern: combinationWorkerParameterList[i].sum,
        topList: combinationWorkerParameterList[i].topList,
        targetPokemonList,
      }),
    )).flat(1);
  })()

  // 概算エナジーの高い順にソート
  combinationList.sort((a, b) => b.aboutScore - a.aboutScore)
  let workerCombinationListList = new Array(config.workerNum).fill(0).map(x => []);
  for(let i = 0; i < combinationList.length; i++) {
    workerCombinationListList[i % config.workerNum].push(combinationList[i])
  }

  let bestResult = null;
  let workerResultList = new Array(config.workerNum).fill(0).map(() => []);
  await multiWorker.call(
    stepC,
    (i) => {
      return {
        type: 'simulate',
        fixedPokemonList,
        targetPokemonList,
        config,
        combinationList: workerCombinationListList[i],
      }
    },
    (i, body, workerList) => {
      workerResultList[i] = body.bestResult;

      bestResult = workerResultList.flat(1).sort((a, b) => b.score - a.score)[0];
      for(let worker of workerList) {
        worker.postMessage({
          type: 'border',
          border: bestResult.score
        })
      }

      return body.progress;
    }
  );

  // console.log(bestResult);

  return bestResult;
}

async function simulation() {

  simulationResult.value = {
    cookingTypeList: [],
  }

  asyncWatcher.run(async (progressCounter) => {
    let cookingTypeList = cookingType.value ? [cookingType.value] : ['カレー', 'サラダ', 'デザート'];

    let result = {
      sundayPrepare: sundayPrepare.value,
      nextSundayPrepare: nextSundayPrepare.value,
      cookingType: cookingType.value,
      cookingTypeList,
    };
    for(let cookingType of cookingTypeList) {
      result[cookingType] = {
        score: 0,
        teamList: [],
      }
    }

    let [berryProgresssCounter, foodProgressCounter, dailyProgressCounter] = progressCounter.split(
      1,
      1,
      (cookingType.value ? 1 : 3) * (nextSundayPrepare.value ? 6 : 7)
    );

    let foodNum = { ...config.foodDefaultNum };

    if (sundayPrepare.value) {
      // まずは食材以外が優秀なメンバーでチームを計算
      let bestSundayResult = await configSimulation({
        ...config,
        simulation: {
          ...config.simulation,
          cookingWeight: 0,
          shardToEnergy: config.selectEvaluate.shardEnergyRate / 7,
        },
        teamSimulation: {
          ...config.teamSimulation,
          resultNum: 1,
          day: 0,
        },
      }, berryProgresssCounter);

      // それを補う食材タイプの計算
      let foodTeam = await configSimulation({
        ...config,
        simulation: {
          ...config.simulation,
          cookingWeight: config.simulation.cookingWeight * 7,
          sundayPrepare: true,
          cookingType: cookingType.value || null,
          shardToEnergy: config.selectEvaluate.shardEnergyRate / 7,
        },
        teamSimulation: {
          ...config.teamSimulation,
          resultNum: 1,
          sundayPrepare: bestSundayResult,
        },
      }, foodProgressCounter, true)
      foodTeam.score = foodTeam.skillShard * config.selectEvaluate.shardEnergyRate * config.simulation.shardWeight / 100 / 7

      foodNum = foodTeam.foodNum;

      for(let cookingType of cookingTypeList) {
        result[cookingType].teamList.push(foodTeam)
      }
    }


    let splittedDailyProgressCounterList = dailyProgressCounter.split(...cookingTypeList.map(() => 1))
    let dayLength = nextSundayPrepare.value ? 6 : 7;

    for(let ci = 0; ci < cookingTypeList.length; ci++) {
      let cookingType = cookingTypeList[ci];
      let progressCounterList = splittedDailyProgressCounterList[ci].split(1, 1, 1, 1, 1, 1, 1)

      let remainFoodNum = { ...foodNum };

      let energy = 0;

      for(let day = 0; day < dayLength; day++) {

        // それを補う食材タイプの計算
        let dailyTeam = await configSimulation({
          ...config,
          foodDefaultNum: remainFoodNum,
          simulation: {
            ...config.simulation,
            sundayPrepare: true,
            cookingType,
            shardToEnergy: config.selectEvaluate.shardEnergyRate / (7 - day),
          },
          teamSimulation: {
            ...config.teamSimulation,
            resultNum: 1,
            day,
            beforeEnergy: energy,
          },
        }, progressCounterList[day])
        
        result[cookingType].teamList.push(dailyTeam)
        result[cookingType].score += dailyTeam.score

        remainFoodNum = dailyTeam.foodNum;
        energy += dailyTeam.energy;
      }

      if (nextSundayPrepare.value) {
        let dailyTeam = (await multiWorker.call(
          progressCounterList[6],
          (i) => {
            return {
              type: 'simulate',
              fixedPokemonList: [],
              targetPokemonList: [],
              config: JSON.parse(JSON.stringify({
                ...config,
                foodDefaultNum: remainFoodNum,
                simulation: {
                  ...config.simulation,
                  sundayPrepare: true,
                  cookingType,
                  shardToEnergy: config.selectEvaluate.shardEnergyRate,
                },
                teamSimulation: {
                  ...config.teamSimulation,
                  resultNum: 1,
                  day: 6,
                  beforeEnergy: energy,
                },
              })),
              combinationList: [{ aboutScore: 0, combination: [] }],
            }
          },
          null,
          1
        )).flat(1)[0];
        
        remainFoodNum = dailyTeam.foodNum;
        result[cookingType].teamList.push(dailyTeam)
        result[cookingType].score += dailyTeam.score

      }

      let totalEnergy = result[cookingType].teamList.reduce((a, team) => a + (team.beforeEnergy ?? 0) + (team.energy ?? 0), 0);
      let energyShard = result[cookingType].teamList.reduce((a, team) => a + (team.energyShard ?? 0), 0);
      let addShard = result[cookingType].teamList.reduce((a, team) => a + (team.bonusShard ?? 0) + (team.skillShard ?? 0), 0);
      
      result[cookingType].score = totalEnergy
        * (((energyShard + addShard) / energyShard - 1) * config.simulation.shardWeight / 100 + 1)

      // result[cookingType].score = totalEnergy
      //   * (1 + (config.simulation.researchRankMax ? 0.5 : 0) * config.simulation.shardWeight / 100)
      //   + totalShard * config.selectEvaluate.shardEnergyRate * config.simulation.shardWeight / 100
    }

    simulationResult.value = result;
  })

}

</script>

<template>
  <PopupBase @close="$emit('close')">
    <template #headerText>日替わりチームシミュレーション</template>

    <template #bodyWrapper>
      <div class="flex-column-start-start flex-110 p-20px gap-5px">
        <SettingList class="align-self-stretch">
          <div>
            <label>対象</label>
            <div>上位 <input type="number" v-model="config.teamSimulation.maxRank"> 匹</div>
          </div>

          <div>
            <label>結果</label>
            <div>上位 <input type="number" v-model="config.teamSimulation.resultNum"> 件まで</div>
          </div>

          <div>
            <label>日曜準備</label>
            <div>
              <InputCheckbox v-model="sundayPrepare">日曜は準備に充てる</InputCheckbox>
              <InputCheckbox v-model="nextSundayPrepare">来週の日曜も準備に充てる</InputCheckbox>
            </div>
          </div>

          <div>
            <label>料理</label>
            <div>
              <select v-model="cookingType">
                <option value="">未定</option>
                <option value="カレー">カレー</option>
                <option value="サラダ">サラダ</option>
                <option value="デザート">デザート</option>
              </select>
            </div>
          </div>
        </SettingList>
        
        <SettingList class="align-self-stretch">
          <div class="flex-110 w-100 flex-column-start-stretch">
            <label>所持食材</label>
            <div>
              <div class="default-food-list gap-1px">
                <template v-for="food in Food.list">
                  <label>{{ food.name }}</label>
                  <label>：</label>
                  <div>
                    <input type="number" class="w-50px" :value="config.foodDefaultNum[food.name]"
                      @input="config.foodDefaultNum[food.name] = $event.target.value ? Number($event.target.value) : 0">
                  </div>
                </template>
              </div>
            </div>
          </div>
        </SettingList>

        <button @click="simulation">シミュレーション実行</button>

        <div class="flex-row-start-center gap-10px">
          <label><input type="checkbox" v-model="config.teamSimulation.result.detail">エナジー内訳</label>
          <label><input type="checkbox" v-model="config.teamSimulation.result.food">食材情報</label>
        </div>

        <AsyncWatcherArea class="flex-column-start-start w-100 gap-20px simulation-result" :asyncWatcher="asyncWatcher">
          
          <template v-for="(cookingType, i) in simulationResult.cookingTypeList">
            <ToggleArea open class="w-100">
              <template #headerText>{{ cookingType }}: {{ Math.round(simulationResult[cookingType].score).toLocaleString() }}</template>

              <div class="scroller">
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th></th>
                      <th v-if="simulationResult.sundayPrepare">日</th>
                      <th>月</th>
                      <th>火</th>
                      <th>水</th>
                      <th>木</th>
                      <th>金</th>
                      <th>土</th>
                      <th>日</th>
                      <th>累計</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="i in [0, 1, 2, 3, 4]">
                      <tr>
                        <th :rowspan="config.teamSimulation.result.detail ? 9 : 5">{{ i + 1 }}</th>
                        <th class="white-space-nowrap">名前</th>
                        <td v-for="team in simulationResult[cookingType].teamList">{{ team.pokemonList[i]?.name }}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <th>Lv</th>
                        <td v-for="team in simulationResult[cookingType].teamList">{{ team.pokemonList[i]?.lv }}</td>
                        <td></td>
                      </tr>
                      
                      <tr>
                        <th>食材</th>
                        <td v-for="team in simulationResult[cookingType].teamList">
                          <div class="flex-row-center-center" v-if="team.pokemonList[i]">
                            <img v-for="food in team.pokemonList[i].foodList" :src="Food.map[food].img" >
                          </div>
                        </td>
                        <td></td>
                      </tr>

                      <tr>
                        <th>サブスキル</th>
                        <td v-for="team in simulationResult[cookingType].teamList">
                          <div class="flex-row flex-wrap gap-3px" v-if="team.pokemonList[i]">
                            <SubSkillLabel v-for="subSkill in team.pokemonList[i].subSkillList" :subSkill="subSkill" short />
                          </div>
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <th>せいかく</th>
                        <td v-for="team in simulationResult[cookingType].teamList"><NatureInfo v-if="team.pokemonList[i]" :nature="team.pokemonList[i].nature" /></td>
                        <td></td>
                      </tr>
                      <tr v-if="config.teamSimulation.result.detail">
                        <th>おてスピ短縮</th>
                        <td v-for="team in simulationResult[cookingType].teamList" class="text-align-right">
                          <template v-if="team.pokemonList[i]">
                            {{ Math.round(team.pokemonList[i].speedBonus * 100).toLocaleString() }}%
                          </template>
                        </td>
                        <td></td>
                      </tr>
                      <tr v-if="config.teamSimulation.result.detail">
                        <th>げんき回復</th>
                        <td v-for="team in simulationResult[cookingType].teamList" class="text-align-right">
                          <template v-if="team.pokemonList[i]">
                            {{ Math.round(team.pokemonList[i].healEffect).toLocaleString() }}
                          </template>
                        </td>
                        <td></td>
                      </tr>
                      <tr v-if="config.teamSimulation.result.detail">
                        <th>きのみ</th>
                        <td v-for="team in simulationResult[cookingType].teamList" class="text-align-right">
                          <template v-if="team.pokemonList[i]">
                            {{ Math.round(team.pokemonList[i].berryEnergyPerDay).toLocaleString() }}
                          </template>
                        </td>
                        <td></td>
                      </tr>
                      <tr v-if="config.teamSimulation.result.detail">
                        <th>スキル</th>
                        <td v-for="team in simulationResult[cookingType].teamList" class="text-align-right">
                          <template v-if="team.pokemonList[i]">
                            {{ Math.round(team.pokemonList[i].skillEnergyPerDay).toLocaleString() }}
                          </template>
                        </td>
                        <td></td>
                      </tr>
                    </template>

                    <template v-if="config.teamSimulation.result.food">
                      <tr v-for="(food, i) in Food.list" v-if="config.teamSimulation.result.food">
                        <th class="vertical" :rowspan="Food.list.length" v-if="i == 0">食材</th>
                        <th><img :src="food.img"></th>
                        <td v-for="team in simulationResult[cookingType].teamList">
                          {{ team.defaultFoodNum?.[food.name].toFixed(1) }}
                          <span v-if="team.addFoodNum?.[food.name]" class="plus"> + {{ team.addFoodNum?.[food.name].toFixed(1) }}</span>
                          <span v-if="team.useFoodNum?.[food.name]" class="minus"> - {{ team.useFoodNum?.[food.name].toFixed(1) }}</span>
                          = {{ team.foodNum?.[food.name].toFixed(1) }}
                        </td>
                        <td>
                        </td>
                        <!-- <td v-for="pokemon in result.pokemonList" class="number">
                          <template v-if="pokemon[food.name]">{{ Math.round(pokemon[food.name] * 7).toLocaleString() }}</template>
                        </td>
                        <td class="number">{{ Math.round(result.pokemonList.reduce((a, x) => a + (x[food.name] ?? 0), 0) * 7).toLocaleString() }}</td>
                        <td class="number">{{ Math.round(result.remainFoodNum[food.name]).toLocaleString() }}</td> -->
                      </tr>
                    </template>

                    <tr v-for="(name, i) in ['朝', '昼', '晩']">
                      <th v-if="i == 0" class="vertical" rowspan="3">料理</th>
                      <th>{{ name }}</th>
                      <td v-for="team in simulationResult[cookingType].teamList">
                        <template v-if="team.cookingList?.[i]">
                          {{ team.cookingList?.[i]?.cooking?.name }}({{ Math.round(team.cookingList?.[i]?.energy).toLocaleString() }})
                        </template>
                      </td>
                      <td></td>
                    </tr>

                    <tr>
                      <th class="vertical" rowspan="6">エナジー</th>
                      <th>きのみ合計</th>
                      <td v-for="(team, i) in simulationResult[cookingType].teamList" class="text-align-right">
                        <template v-if="i > 0">
                          {{ Math.round(team.pokemonList.reduce((a, x) => a + (x.berryEnergyPerDay ?? 0), 0)).toLocaleString() }}
                        </template>
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(simulationResult[cookingType].teamList.reduce((a, team) => 
                          a + team.pokemonList.reduce((a, x) => a + (x.berryEnergyPerDay ?? 0), 0), 0
                        )).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th>スキル合計</th>
                      <td v-for="(team, i) in simulationResult[cookingType].teamList" class="text-align-right">
                        <template v-if="i > 0">
                          {{ Math.round(team.pokemonList.reduce((a, x) => a + (x.skillEnergyPerDay ?? 0), 0)).toLocaleString() }}
                        </template>
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(simulationResult[cookingType].teamList.reduce((a, team) => 
                          a + team.pokemonList.reduce((a, x) => a + (x.skillEnergyPerDay ?? 0), 0), 0
                        )).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th>料理合計</th>
                      <td v-for="team in simulationResult[cookingType].teamList" class="text-align-right">
                        <template v-if="team.cookingList">
                          {{ Math.round(team.cookingList.reduce((a, x) => a + (x.energy ?? 0), 0)).toLocaleString() }}
                        </template>
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(simulationResult[cookingType].teamList.reduce((a, team) => 
                          a + (team.cookingList?.reduce((a, x) => a + x.energy, 0) ?? 0), 0
                        )).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th>エナジー</th>
                      <td v-for="(team, i) in simulationResult[cookingType].teamList" class="text-align-right">
                        <template v-if="i > 0">{{ Math.round(team.rawEnergy).toLocaleString() }}</template>
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(simulationResult[cookingType].teamList.reduce((a, team) => 
                          a + (team.rawEnergy ?? 0), 0
                        )).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th>エナジー<small>(FB込)</small></th>
                      <td v-for="(team, i) in simulationResult[cookingType].teamList" class="text-align-right">
                        <template v-if="i > 0">{{ Math.round(team.energy).toLocaleString() }}</template>
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(simulationResult[cookingType].teamList.reduce((a, team) => 
                          a + (team.energy ?? 0), 0
                        )).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th>累計エナジー</th>
                      <td v-for="(team, i) in simulationResult[cookingType].teamList" class="text-align-right">
                        <template v-if="i > 0">{{ Math.round(team.beforeEnergy + team.energy).toLocaleString() }}</template>
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(simulationResult[cookingType].teamList.reduce((a, team) => a + (team.beforeEnergy ?? 0) + (team.energy ?? 0), 0)).toLocaleString() }}
                      </td>
                    </tr>

                    <tr>
                      <th class="vertical" rowspan="3">ゆめのかけら</th>
                      <th>エナジー</th>
                      <td v-for="(team, i) in simulationResult[cookingType].teamList" class="text-align-right">
                        {{ Math.round(team.energyShard).toLocaleString() }}
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(simulationResult[cookingType].teamList.reduce((a, team) => a + (team.energyShard ?? 0), 0)).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th>ボーナス</th>
                      <td v-for="(team, i) in simulationResult[cookingType].teamList" class="text-align-right">
                        {{ Math.round(team.bonusShard).toLocaleString() }}
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(simulationResult[cookingType].teamList.reduce((a, team) => a + (team.bonusShard ?? 0), 0)).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th>スキル</th>
                      <td v-for="(team, i) in simulationResult[cookingType].teamList" class="text-align-right">
                        {{ Math.round(team.skillShard).toLocaleString() }}
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(simulationResult[cookingType].teamList.reduce((a, team) => a + (team.skillShard ?? 0), 0)).toLocaleString() }}
                      </td>
                    </tr>
                    
                    <tr>
                      <th colspan="2">判定スコア</th>
                      <td v-for="(team, i) in simulationResult[cookingType].teamList" class="text-align-right">
                        {{ Math.round(team.score).toLocaleString() }}
                      </td>
                      <td class="text-align-right">
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ToggleArea>
          </template> 
        </AsyncWatcherArea>
      </div>
    </template>
  </PopupBase>
</template>

<style lang="scss" scoped>
.popup-base {
  display: flex;
  flex-direction: column;

  width: 100%;
  max-width: 1200px;
  height: calc(100% - 100px);


  .default-food-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, 100px 1em 50px);
    align-items: center;

    label {
      text-align: right;
    }

    input {
      margin-right: 10px;
    }
  }

  textarea {
    width: 100%;
    height: 500px;
  }

  .scroller {
    width: 100%;
    max-height: 500px;
    overflow-x: auto;
  }

  .simulation-result {
    flex: 1 1 100px;
    // overflow: auto;

    table {
      border-collapse: collapse;

      th, td {
        border: 1px #000 solid;
        vertical-align: middle;
        padding: 2px 3px;

        &.vertical {
          writing-mode: vertical-rl;
        }
      }
      th {
        font-weight: bold;
        white-space: nowrap;
        background: rgb(54, 73, 150);
        color: #FFF;
        border: 1px #FFF solid;
      }

      .plus {
        color: #d40063;
      }

      .minus {
        color: #000f9b;
      }

      img {
        width: 24px;
        line-height: 1;
        vertical-align: middle;
        background-color: #FFF;
        border-radius: 5px;
        margin: 0 auto;
      }

      .number {
        text-align: right;
      }

    }
  }
}
</style>