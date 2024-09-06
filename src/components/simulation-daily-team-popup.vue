<script setup>
import { onBeforeUnmount } from 'vue';
import Food from '../data/food';
import SubSkill from '../data/sub-skill';
import { AsyncWatcher } from '../models/async-watcher';
import config from '../models/config';
import MultiWorker from '../models/multi-worker';
import PokemonListSimulator from '../worker/pokemon-list-simulator?worker';
import TeamSimulator from '../worker/team-simulator?worker';
import AsyncWatcherArea from './util/async-watcher-area.vue';
import NatureInfo from './status/nature-info.vue';
import PopupBase from './util/popup-base.vue';
import SettingList from './util/setting-list.vue';
import PokemonBox from '../models/pokemon-box';
import EvaluateTable from '../models/evaluate-table';

let evaluateTable = EvaluateTable.load(config);

const asyncWatcher = AsyncWatcher.init();
const $emit = defineEmits(['close']);

const simulationResult = ref({
  cookingTypeList: [],
})
// const cookingType = ref('')
const cookingType = ref(config.simulation.cookingType)

const targetDay = ref(new Date().getHours() < 12 ? (new Date().getDay() + 6) % 7 : new Date().getDay())
const beforeEnergy = ref(0);

// ワーカー準備
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
        evaluateTable,
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

      bestResult = workerResultList.flat(1).sort((a, b) => b.score - a.score).slice(0, config.teamSimulation.resultNum);
      for(let worker of workerList) {
        worker.postMessage({
          type: 'border',
          border: bestResult.score
        })
      }

      return body.progress;
    }
  );

  return bestResult;
}

async function simulation() {

  asyncWatcher.run(async (progressCounter) => {

    let bestResult = await configSimulation({
      ...config,
      simulation: {
        ...config.simulation,
        sundayPrepare: true,
        cookingType: cookingType.value,
        shardToEnergy: config.selectEvaluate.shardEnergyRate / (7 - targetDay.value),
      },
      teamSimulation: {
        ...config.teamSimulation,
        day: targetDay.value,
        beforeEnergy: beforeEnergy.value,
      },
    }, progressCounter)

    simulationResult.value = {
      targetDay: targetDay.value,
      resultList: bestResult,
    };
    console.log(bestResult);
  })
}

</script>

<template>
  <PopupBase @close="$emit('close')">
    <template #headerText>日別チームシミュレーション</template>

    <template #bodyWrapper>
      <div class="flex-column-start-start flex-110 p-20px gap-5px">

        <SettingList class="align-self-stretch">
          <div>
            <label>対象</label>
            <div>上位 <input type="number" v-model="config.teamSimulation.maxRank" class="w-50px"> 匹</div>
          </div>

          <div>
            <label>結果</label>
            <div>上位 <input type="number" v-model="config.teamSimulation.resultNum" class="w-50px"> 件</div>
          </div>

          <div>
            <label>現在のエナジー</label>
            <div><input type="number" v-model="beforeEnergy"></div>
          </div>

          <div>
            <label>料理</label>
            <div>
              <select v-model="cookingType">
                <option value="カレー">カレー</option>
                <option value="サラダ">サラダ</option>
                <option value="デザート">デザート</option>
              </select>
            </div>
          </div>

          <div>
            <label>対象</label>
            <div>
              <select :value="targetDay" @input="targetDay = Number($event.target.value)">
                <option value="0">月曜</option>
                <option value="1">火曜</option>
                <option value="2">水曜</option>
                <option value="3">木曜</option>
                <option value="4">金曜</option>
                <option value="5">土曜</option>
                <option value="6">日曜</option>
              </select>
            </div>
          </div>

          <div>
            <label>料理</label>
            <div>
              <div><input type="number" v-model="config.teamSimulation.cookingNum" class="w-50px"> 食分</div>
              <small>
                翌朝の料理分も集めておきたい場合は4にしてください
              </small>
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
          <label><input type="checkbox" v-model="config.teamSimulation.result.food">食材情報</label>
          <label><input type="checkbox" v-model="config.teamSimulation.result.detail">詳細</label>
        </div>

        <AsyncWatcherArea class="flex-column-start-start w-100 gap-20px simulation-result" :asyncWatcher="asyncWatcher">
          <template v-if="simulationResult.targetDay == null">
            シミュレーション実行ボタンを押してください
          </template>

          <template v-else-if="simulationResult.targetDay >= 0">

            <ToggleArea v-for="(result, i) in simulationResult.resultList" :open="i == 0" class="w-100">
              <template #headerText>
                {{ i + 1 }}: {{ Math.round(result.score).toLocaleString() }}
              </template>
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th></th>
                    <th v-for="i in 5">{{ i }}</th>
                    <th>合計</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th class="vertical" :rowspan="config.teamSimulation.result.detail ? 11 : 7">編成</th>
                    <th class="white-space-nowrap">名前</th>
                    <td v-for="pokemon in result.pokemonList"><NameLabel :pokemon="pokemon" /></td>
                    <td></td>
                  </tr>
                  <tr>
                    <th>Lv</th>
                    <td v-for="pokemon in result.pokemonList"><LvLabel :pokemon="pokemon" /></td>
                    <td></td>
                  </tr>

                  <tr>
                    <th>食材</th>
                    <td v-for="pokemon in result.pokemonList">
                      <div class="flex-row-center-center" v-if="pokemon">
                        <img v-for="food in pokemon.foodList" :src="Food.map[food].img" class="ml-0 mr-0">
                      </div>
                    </td>
                    <td></td>
                  </tr>

                  <tr>
                    <th>サブスキル</th>
                    <td v-for="pokemon in result.pokemonList">
                      <div class="flex-row flex-wrap gap-3px" v-if="pokemon">
                        <SubSkillLabel v-for="subSkill in pokemon.subSkillList" :subSkill="subSkill" short />
                      </div>
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <th>せいかく</th>
                    <td v-for="pokemon in result.pokemonList"><NatureInfo v-if="pokemon" :nature="pokemon.nature" /></td>
                    <td></td>
                  </tr>
                  <tr v-if="config.teamSimulation.result.detail">
                    <th>おてスピ短縮</th>
                    <td v-for="pokemon in result.pokemonList" class="text-align-right">
                      <template v-if="pokemon">
                        {{ Math.round(pokemon.speedBonus * 100).toLocaleString() }}%
                      </template>
                    </td>
                    <td></td>
                  </tr>
                  <tr v-if="config.teamSimulation.result.detail">
                    <th>げんき回復</th>
                    <td v-for="pokemon in result.pokemonList" class="text-align-right">
                      <template v-if="pokemon">
                        {{ Math.round(pokemon.healEffect * 100).toLocaleString() }}
                      </template>
                    </td>
                    <td></td>
                  </tr>
                  <tr v-if="config.teamSimulation.result.detail">
                    <th>日中手伝い倍率</th>
                    <td v-for="pokemon in result.pokemonList" class="text-align-right">
                      <template v-if="pokemon">
                        {{ Math.round(pokemon.dayHelpRate * 100).toLocaleString() }}%
                      </template>
                    </td>
                    <td></td>
                  </tr>
                  <tr v-if="config.teamSimulation.result.detail">
                    <th>夜間手伝い倍率</th>
                    <td v-for="pokemon in result.pokemonList" class="text-align-right">
                      <template v-if="pokemon">
                        {{ Math.round(pokemon.nightHelpRate * 100).toLocaleString() }}%
                      </template>
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <th>きのみ</th>
                    <td v-for="pokemon in result.pokemonList" class="text-align-right">
                      {{ Math.round(pokemon.berryEnergyPerDay).toLocaleString() }}
                    </td>
                    <td class="text-align-right">
                      {{ Math.round(result.pokemonList.reduce((a, pokemon) => a + pokemon.berryEnergyPerDay, 0)).toLocaleString() }}
                    </td>
                  </tr>
                  <tr>
                    <th>スキル</th>
                    <td v-for="pokemon in result.pokemonList" class="text-align-right">
                      <template v-if="pokemon">
                        {{ Math.round(pokemon.skillEnergyPerDay).toLocaleString() }}
                      </template>
                    </td>
                    <td class="text-align-right">
                      {{ Math.round(result.pokemonList.reduce((a, pokemon) => a + pokemon.skillEnergyPerDay, 0)).toLocaleString() }}
                    </td>
                  </tr>
                  <tr>
                    <th colspan="2">料理</th>
                    <td colspan="5">
                      {{ result.cookingList.map(x => x.cooking.name).join(' / ') }}
                    </td>
                    <td class="text-align-right">
                      {{ Math.round(result.cookingList.reduce((a, x) => a + x.energy, 0)).toLocaleString() }}
                    </td>
                  </tr>
                  <tr>
                    <th rowspan="2">エナジー</th>
                    <th>エナジー</th>
                    <td colspan="6" class="text-align-right">
                      {{ Math.round(result.rawEnergy).toLocaleString() }}
                    </td>
                  </tr>
                  <tr>
                    <th>FB込み</th>
                    <td colspan="6" class="text-align-right">
                      {{ Math.round(result.energy).toLocaleString() }}
                    </td>
                  </tr>
                  <tr>
                    <th rowspan="3">ゆめのかけら</th>
                    <th>エナジー</th>
                    <td colspan="6" class="text-align-right">{{ Math.round(result.energyShard).toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <th>ボーナス</th>
                    <td colspan="6" class="text-align-right">{{ Math.round(result.bonusShard).toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <th>スキル</th>
                    <td colspan="6" class="text-align-right">{{ Math.round(result.skillShard).toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <th colspan="2">スコア</th>
                    <td colspan="6" class="text-align-right">{{ Math.round(result.score).toLocaleString() }}</td>
                  </tr>

                  <template v-if="config.teamSimulation.result.food">
                    <tr v-for="(food, i) in Food.list" v-if="config.teamSimulation.result.food">
                      <th class="vertical" :rowspan="Food.list.length" v-if="i == 0">食材</th>
                      <th><img :src="food.img"></th>
                      <td v-for="pokemon in result.pokemonList" class="text-align-right">
                        <template v-if="pokemon[food.name] ?? 0">{{ (pokemon[food.name] ?? 0).toFixed(1) }}</template>
                      </td>
                      <td class="white-space-nowrap">
                        {{ result.defaultFoodNum?.[food.name].toFixed(1) }}
                        <span v-if="result.addFoodNum?.[food.name]" class="plus"> + {{ result.addFoodNum?.[food.name].toFixed(1) }}</span>
                        <span v-if="result.useFoodNum?.[food.name]" class="minus"> - {{ result.useFoodNum?.[food.name].toFixed(1) }}</span>
                        = {{ result.foodNum?.[food.name].toFixed(1) }}
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
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