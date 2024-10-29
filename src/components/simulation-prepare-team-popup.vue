<script setup>
import { onBeforeUnmount } from 'vue';
import Berry from '../data/berry';
import Food from '../data/food';
import { AsyncWatcher } from '../models/async-watcher';
import config from '../models/config';
import MultiWorker from '../models/multi-worker';
import PokemonBox from '../models/pokemon-box';
import PokemonListSimulator from '../worker/pokemon-list-simulator?worker';
import TeamSimulator from '../worker/team-simulator?worker';
import NatureInfo from './status/nature-info.vue';
import AsyncWatcherArea from './util/async-watcher-area.vue';
import PopupBase from './util/popup-base.vue';
import SettingList from './util/setting-list.vue';
import EvaluateTable from '../models/evaluate-table';

let evaluateTable = EvaluateTable.load(config);
const asyncWatcher = AsyncWatcher.init();
const $emit = defineEmits(['close']);

const simulationResult = ref({
  cookingTypeList: [],
})
const cookingType = ref('')
const targetDay = ref(1)
const foodSimulationConfig = reactive({
  ...JSON.parse(JSON.stringify(config.simulation)),
  campTicket: false,
  eventBonusType: null,
})
const cookingPowerupSundayOnly = ref(true)

const WEEK_NAME = ['日', '月', '火', '水', '木', '金', '土'];

// ワーカー準備
const multiWorker = new MultiWorker(TeamSimulator, config.workerNum)
const pokemonMultiWorker = new MultiWorker(PokemonListSimulator, config.workerNum)
onBeforeUnmount(() => {
  multiWorker.close();
  pokemonMultiWorker.close();
})

const isValidConfig = computed(() => {
  return targetDay.value >= 1;
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
        evaluateTable,
      }
    }
  )).flat(1);

  /* ここからおてボとかげんき回復系の計算 */
  // おてボ用に概算日給の高い上位6匹をリストアップしておく
  let helpBonusTop6 = pokemonList.toSorted((a, b) => b.tmpScore - a.tmpScore).slice(0, 6);

  // きのみバースト用に1回の手伝いが多い上位5匹をリストアップしておく
  let berryEnergyTop5 = pokemonList.toSorted((a, b) => b.berryEnergy - a.berryEnergy).slice(0, 5)

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
        berryEnergyTop5,
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

  asyncWatcher.run(async (progressCounter) => {
    let result = {
      targetDay: targetDay.value,
    };

    // 日曜準備
    let [berryProgresssCounter, ...foodProgressCounter] = progressCounter.split(1, ...new Array(targetDay.value).fill(1));

    // まずは食材以外が優秀なメンバーでチームを計算
    let bestSundayResult = await configSimulation({
      ...config,
      foodDefaultNum: {},
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

    result = {
      ...result,
      cookingTypeList: cookingType.value ? [cookingType.value] : ['カレー', 'サラダ', 'デザート'],
      foodTeamList: [],
      energyTeam: bestSundayResult,
    }

    let foodNum = { ...config.foodDefaultNum }

    // それを補う食材タイプの計算を日曜から順に計算
    for(let i = 0; i < targetDay.value; i++) {

      let bestResult = await configSimulation({
        ...config,
        foodDefaultNum: foodNum,
        simulation: {
          ...foodSimulationConfig,
          cookingWeight: config.simulation.cookingWeight * 7,
          sundayPrepare: true,
          cookingType: cookingType.value || null,
          shardToEnergy: config.selectEvaluate.shardEnergyRate / 7,
        },
        teamSimulation: {
          ...config.teamSimulation,
          campTicket: config.simulation.campTicket,
          resultNum: 1,
          sundayPrepare: bestSundayResult,
          day: 6,
          cookingPowerUp: i == 0 || !cookingPowerupSundayOnly.value,
        },
      }, foodProgressCounter[i], true)

      foodNum = bestResult.foodNum;

      // foodTeam.score = foodTeam.skillShard * config.selectEvaluate.shardEnergyRate * config.simulation.shardWeight / 100 / 7
      result.foodTeamList.push(bestResult);

      result.eachTypeResult = bestResult.eachTypeResult;
    }

    simulationResult.value = result;
  })
}

</script>

<template>
  <PopupBase @close="$emit('close')">
    <template #headerText>週末準備チームシミュレーション</template>

    <template #bodyWrapper>
      <div class="flex-column-start-start flex-110 p-20px gap-5px">

        <BaseAlert>
          ベータ版です。何となくで編成するよりは良い結果だと思いますが、理論値ではないと思います。
        </BaseAlert>

        <SettingList class="align-self-stretch">
          <div>
            <label>対象</label>
            <div>上位 <input type="number" v-model="config.teamSimulation.maxRank"> 匹</div>
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

          <div>
            <label>準備日数</label>
            <div>
              <input type="number" v-model="targetDay"> 日間
              <small class="w-120px">週末の何日間を来週の準備に充てるか指定(日曜のみなら1)</small>
            </div>
          </div>

          <div>
            <label>料理パワーアップ</label>
            <div>
              <InputCheckbox v-model="cookingPowerupSundayOnly">日曜のみ</InputCheckbox>
              <small class="w-120px">チェックを外すと土曜以前も料理をせずに鍋拡張する前提で計算します</small>
            </div>
          </div>



          <div>
            <label>キャンチケ</label>
            <div>
              <label><input type="checkbox" v-model="foodSimulationConfig.campTicket">使う</label>
            </div>
          </div>

          <div>
            <label>イベントボーナス</label>
            <div class="flex-column-start-start gap-5px">
              <select :value="foodSimulationConfig.eventBonusType" @input="foodSimulationConfig.eventBonusType = $event.target.value || null">
                <option value="">-</option>
                <option value="all">全員</option>
                <option v-for="berry in Berry.list" :value="berry.type">{{ berry.type }}</option>
              </select>
              <div style="display: grid; grid-template-columns: max-content max-content max-content; align-items: center; gap: 0 5px;">
                <label>食材ボーナス</label>
                <label>スキル倍率</label>
                <label>スキルレベル</label>
                <input type="number" class="w-60px" v-model="foodSimulationConfig.eventBonusTypeFood" >
                <input type="number" class="w-60px" v-model="foodSimulationConfig.eventBonusTypeSkillRate" step="0.1" >
                <input type="number" class="w-60px" v-model="foodSimulationConfig.eventBonusTypeSkillLv" >
              </div>
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

        <button @click="simulation" :disabled="!isValidConfig">シミュレーション実行</button>

        <div class="flex-row-start-center gap-10px">
          <label><input type="checkbox" v-model="config.teamSimulation.result.food">食材情報</label>
          <label><input type="checkbox" v-model="config.teamSimulation.result.detail">詳細</label>
        </div>

        <AsyncWatcherArea class="flex-column-start-start w-100 gap-20px simulation-result" :asyncWatcher="asyncWatcher">
          <template v-if="simulationResult.targetDay == null">
            シミュレーション実行ボタンを押してください
          </template>
          <template v-else>

            <template v-for="(team, i) in simulationResult.foodTeamList">
              <ToggleArea open class="w-100">
                <template #headerText>{{ WEEK_NAME[((7 - simulationResult.foodTeamList.length % 7) + i + 1) % 7] }}曜日食材収集チーム({{ simulationResult.foodTeamList.length - i }}日前)</template>

                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th v-for="i in 5">{{ i }}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th class="white-space-nowrap">名前</th>
                      <td v-for="pokemon in team.pokemonList"><NameLabel :pokemon="pokemon" /></td>
                      <td></td>
                    </tr>
                    <tr>
                      <th>Lv</th>
                      <td v-for="pokemon in team.pokemonList"><LvLabel :pokemon="pokemon" /></td>
                      <td></td>
                    </tr>

                    <tr>
                      <th>食材</th>
                      <td v-for="pokemon in team.pokemonList">
                        <div class="flex-row-center-center" v-if="pokemon">
                          <img v-for="food in pokemon.foodList" :src="Food.map[food].img" class="ml-0 mr-0">
                        </div>
                      </td>
                      <td></td>
                    </tr>

                    <tr>
                      <th>サブスキル</th>
                      <td v-for="pokemon in team.pokemonList">
                        <div class="flex-row flex-wrap gap-3px" v-if="pokemon">
                          <SubSkillLabel v-for="subSkill in pokemon.subSkillList" :subSkill="subSkill" short />
                        </div>
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <th>せいかく</th>
                      <td v-for="pokemon in team.pokemonList"><NatureInfo v-if="pokemon" :nature="pokemon.nature" /></td>
                      <td></td>
                    </tr>
                    <tr v-if="config.teamSimulation.result.detail">
                      <th>おてスピ短縮</th>
                      <td v-for="pokemon in team.pokemonList" class="text-align-right">
                        <template v-if="pokemon">
                          {{ Math.round(pokemon.speedBonus * 100).toLocaleString() }}%
                        </template>
                      </td>
                      <td></td>
                    </tr>
                    <tr v-if="config.teamSimulation.result.detail">
                      <th>げんき回復</th>
                      <td v-for="pokemon in team.pokemonList" class="text-align-right">
                        <template v-if="pokemon">
                          {{ Math.round(pokemon.healEffect).toLocaleString() }}
                        </template>
                      </td>
                      <td></td>
                    </tr>
                    <tr v-if="config.teamSimulation.result.detail">
                      <th>きのみ</th>
                      <td v-for="pokemon in team.pokemonList" class="text-align-right">
                        <template v-if="pokemon">
                          {{ Math.round(pokemon.berryEnergyPerDay).toLocaleString() }}
                        </template>
                      </td>
                      <td></td>
                    </tr>
                    <tr v-if="config.teamSimulation.result.detail">
                      <th>スキル</th>
                      <td v-for="pokemon in team.pokemonList" class="text-align-right">
                        <template v-if="pokemon">
                          {{ Math.round(pokemon.skillEnergyPerDay).toLocaleString() }}
                        </template>
                      </td>
                      <td></td>
                    </tr>

                    <template v-if="config.teamSimulation.result.food">
                      <tr v-for="(food, i) in Food.list" v-if="config.teamSimulation.result.food">
                        <th><img :src="food.img"></th>
                        <td v-for="pokemon in team.pokemonList" class="text-align-right">
                          <template v-if="pokemon[food.name] ?? 0">{{ (pokemon[food.name] ?? 0).toFixed(1) }}</template>
                        </td>
                        <td class="white-space-nowrap">
                          {{ team.defaultFoodNum?.[food.name].toFixed(1) }}
                          <span v-if="team.addFoodNum?.[food.name]" class="plus"> + {{ team.addFoodNum?.[food.name].toFixed(1) }}</span>
                          <!--
                          {{ simulationResult.defaultFoodNum?.[food.name].toFixed(1) }}
                          = {{ team.foodNum?.[food.name].toFixed(1) }}
                          -->
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </ToggleArea>
            </template>

            <ToggleArea class="w-100">
              <template #headerText>月曜以降チーム(料理以外の最良チーム)</template>
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th v-for="i in 5">{{ i }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th class="white-space-nowrap">名前</th>
                    <td v-for="pokemon in simulationResult.energyTeam.pokemonList">{{ pokemon.name }}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <th>Lv</th>
                    <td v-for="pokemon in simulationResult.energyTeam.pokemonList">{{ pokemon?.lv }}</td>
                    <td></td>
                  </tr>

                  <tr>
                    <th>食材</th>
                    <td v-for="pokemon in simulationResult.energyTeam.pokemonList">
                      <div class="flex-row-center-center" v-if="pokemon">
                        <img v-for="food in pokemon.foodList" :src="Food.map[food].img" class="ml-0 mr-0">
                      </div>
                    </td>
                    <td></td>
                  </tr>

                  <tr>
                    <th>サブスキル</th>
                    <td v-for="pokemon in simulationResult.energyTeam.pokemonList">
                      <div class="flex-row flex-wrap gap-3px" v-if="pokemon">
                        <SubSkillLabel v-for="subSkill in pokemon.subSkillList" :subSkill="subSkill" short />
                      </div>
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <th>せいかく</th>
                    <td v-for="pokemon in simulationResult.energyTeam.pokemonList"><NatureInfo v-if="pokemon" :nature="pokemon.nature" /></td>
                    <td></td>
                  </tr>
                  <tr v-if="config.teamSimulation.result.detail">
                    <th>おてスピ短縮</th>
                    <td v-for="pokemon in simulationResult.energyTeam.pokemonList" class="text-align-right">
                      <template v-if="pokemon">
                        {{ Math.round(pokemon.speedBonus * 100).toLocaleString() }}%
                      </template>
                    </td>
                    <td></td>
                  </tr>
                  <tr v-if="config.teamSimulation.result.detail">
                    <th>げんき回復</th>
                    <td v-for="pokemon in simulationResult.energyTeam.pokemonList" class="text-align-right">
                      <template v-if="pokemon">
                        {{ Math.round(pokemon.healEffect).toLocaleString() }}
                      </template>
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <th>きのみ</th>
                    <td v-for="pokemon in simulationResult.energyTeam.pokemonList" class="text-align-right">
                      {{ Math.round(pokemon.berryEnergyPerDay).toLocaleString() }}
                    </td>
                    <td class="text-align-right">
                      {{ Math.round(simulationResult.energyTeam.pokemonList.reduce((a, pokemon) => a + pokemon.berryEnergyPerDay, 0)).toLocaleString() }}
                    </td>
                  </tr>
                  <tr>
                    <th>スキル</th>
                    <td v-for="pokemon in simulationResult.energyTeam.pokemonList" class="text-align-right">
                      {{ Math.round(pokemon.skillEnergyPerDay).toLocaleString() }}
                    </td>
                    <td class="text-align-right">
                      {{ Math.round(simulationResult.energyTeam.pokemonList.reduce((a, pokemon) => a + pokemon.skillEnergyPerDay, 0)).toLocaleString() }}
                    </td>
                  </tr>

                  <template v-if="config.teamSimulation.result.food">
                    <tr v-for="(food, i) in Food.list" v-if="config.teamSimulation.result.food">
                      <th><img :src="food.img"></th>
                      <td v-for="pokemon in simulationResult.energyTeam.pokemonList" class="text-align-right">
                        <template v-if="pokemon[food.name] ?? 0">{{ (pokemon[food.name] ?? 0).toFixed(1) }}</template>
                      </td>
                      <td class="white-space-nowrap">
                        {{ simulationResult.energyTeam.defaultFoodNum?.[food.name].toFixed(1) }}
                        <span v-if="simulationResult.energyTeam.addFoodNum?.[food.name]" class="plus"> + {{ simulationResult.energyTeam.addFoodNum?.[food.name].toFixed(1) }}</span>
                        <!--
                        {{ simulationResult.defaultFoodNum?.[food.name].toFixed(1) }}
                        = {{ team.foodNum?.[food.name].toFixed(1) }}
                        -->
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </ToggleArea>

            <template v-for="cookingType in simulationResult.cookingTypeList">
              <ToggleArea class="w-100">
                <template #headerText>料理シミュレーション({{ cookingType }})</template>

                <table class="mt-10px">
                  <thead>
                    <tr>
                      <th></th>
                      <th v-for="i in 21">{{ i }}食目</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>料理</th>
                      <td v-for="cooking in simulationResult.eachTypeResult[cookingType].cookingList">{{ cooking.name }}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <th>料理</th>
                      <td v-for="cooking in simulationResult.eachTypeResult[cookingType].cookingList" class="number">{{ Math.round(cooking.energy).toLocaleString() }}</td>
                      <td class="number">{{ Math.round(simulationResult.eachTypeResult[cookingType].cookingList.reduce((a, cooking) => a + cooking.energy, 0)).toLocaleString() }}</td>
                    </tr>
                    <tr v-for="(food, i) in Food.list" v-if="config.teamSimulation.result.food">
                      <th><img :src="food.img"></th>

                      <td v-for="cooking in simulationResult.eachTypeResult[cookingType].cookingList">
                        {{ cooking.beforeFoodNum[food.name].toFixed(1) }}
                        <span v-if="cooking.useFoodNum?.[food.name]" class="minus"><br>- {{ cooking.useFoodNum?.[food.name].toFixed(1) }}</span>
                        <span v-if="simulationResult.energyTeam.foodNum?.[food.name]" class="plus"><br>+ {{ (simulationResult.energyTeam.foodNum?.[food.name] / 3).toFixed(1) }}</span>
                      </td>

                      <td>
                        {{ simulationResult.eachTypeResult[cookingType].remainFoodNum[food.name].toFixed(1) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ToggleArea>
            </template>
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
        background: rgb(66, 85, 158);
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
        flex: 0 0 auto;
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