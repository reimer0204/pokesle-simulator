<script setup>
import CommonSetting from '../components/common-setting.vue';
import EditPokemonPopup from '../components/edit-pokemon-popup.vue';
import NatureInfo from '../components/status/nature-info.vue';
import AsyncWatcherArea from '../components/util/async-watcher-area.vue';
import SettingList from '../components/util/setting-list.vue';
import { Food, Cooking } from '../data/food_and_cooking';
import { AsyncWatcher } from '../models/async-watcher.js';
import config from '../models/config.js';
import EvaluateTable from '../models/simulation/evaluate-table.js';
import MultiWorker from '../models/multi-worker.js';
import PokemonBox from '../models/pokemon-box/pokemon-box';
import PokemonFilter from '../models/pokemon-filter.js';
import Popup from '../models/popup/popup.ts';
import PokemonListSimulator from '../models/pokemon-box/pokemon-box-worker?worker';
import TeamSimulator from '../models/simulation/team-simulator?worker';
import PokemonFilterEditor from '../components/filter/pokemon-filter-editor.vue';

const props = defineProps({
  defaultTargetDay: { type: Number },
})

const cookingNum = ref(6)
const weights = reactive({'カレー': 100, 'サラダ': 100, 'デザート': 100})
const enableCookingTypes = computed(() => {
  return ['カレー', 'サラダ', 'デザート'].filter(x => weights[x]);
})
const bagSize = ref(700);
const top = ref(4);

let evaluateTable = EvaluateTable.load(config);
const asyncWatcher = AsyncWatcher.init();
const $emit = defineEmits(['close']);

// シミュレーション設定
const loadedPokemonBoxList = ref(PokemonBox.list);

const filterResult = computed(() => PokemonFilter.filter(toRaw(loadedPokemonBoxList.value), config.simulation.filter));

const requireText = computed(() => {
  let result = [];
  if (config.teamSimulation.require.dayHelpRate > 0) result.push(` 日中手伝い効率${config.teamSimulation.require.dayHelpRate}%以上`)
  if (config.teamSimulation.require.nightHelpRate > 0) result.push(` 夜間手伝い効率${config.teamSimulation.require.nightHelpRate}%以上`)
  if (config.teamSimulation.require.suiminExp > 0) result.push(` 睡眠EXPボーナス${config.teamSimulation.require.suiminExp}匹以上`)
  if (result.length == 0) return 'なし';
  return result.join('');
});

// シミュレーション実施関連
const simulationResult = ref({
  teamList: [],
})

const pokemonMultiWorker = new MultiWorker(PokemonListSimulator, config.workerNum)
const teamMultiWorker = new MultiWorker(TeamSimulator, config.workerNum)
onBeforeUnmount(() => {
  pokemonMultiWorker.close();
  teamMultiWorker.close();
})

async function pokemonAboutScoreSimulation(customConfig, progressCounter) {
  return await PokemonBox.simulation(
    filterResult.value.pokemonList, pokemonMultiWorker, evaluateTable, 
    customConfig,
    progressCounter
  )
}

function makeCombinationList(target, num) {
  if (target == 1) return [[num]];
  else {
    let result = []
    for(let i = 0; i <= num; i++) {
      for(let subResult of makeCombinationList(target - 1, num - i)) {
        result.push([i, ...subResult]);
      }
    }
    return result;
  }
}

async function simulation() {
  asyncWatcher.run(async (progressCounter) => {
    const subProgressCounters = progressCounter.split(...new Array(enableCookingTypes.value.length).fill(1))
    let customConfig = JSON.parse(JSON.stringify({
      ...config,
      teamSimulation: {
        ...config.teamSimulation,
        beforeEnergy: 0,
      },
    }))
    const result = {
      teamList: [],
      // cookingTypeList: enableCookingTypes.value,
      config: customConfig,
    };

    for(const [index, cookingType] of enableCookingTypes.value.entries()) {
      result[cookingType] = {}

      const subProgressCounter = subProgressCounters[index];

      let [stepA, stepC] = subProgressCounter.split(1, 8);

      customConfig.simulation.foodEnergyWeight = 0;
      for(let food of Food.list) {
        customConfig.foodDefaultNum[food.name] = 9999;
      }

      customConfig.simulation.cookingType = cookingType;
      customConfig.simulation.shardToEnergy = customConfig.selectEvaluate.shardEnergyRate / 7;
      customConfig.teamSimulation.day = 0;
      customConfig.teamSimulation.resultNum = 1;
      customConfig.teamSimulation.cookingNum = 3;

      let pokemonList = await pokemonAboutScoreSimulation(customConfig, stepA)

      // 固定のポケモンと推論対象を選ぶ
      const fixedPokemonList = JSON.parse(JSON.stringify(pokemonList.filter(x => x.box?.fix == 1)));
      let filteredTargetPokemonList = pokemonList.filter(x => x.box?.fix == null);

      const pickup = 5 - fixedPokemonList.length;

      // スコアの高い上位のみをピックアップ
      let sortedPokemonList;
      let targetPokemonList = [];
      
      if (config.simulation.mode != 2) {
        sortedPokemonList = filteredTargetPokemonList.toSorted((a, b) => b.berryEnergyPerDay - a.berryEnergyPerDay)
        targetPokemonList.push(...sortedPokemonList.slice(0, customConfig.teamSimulation.maxRankBerry))
        filteredTargetPokemonList = sortedPokemonList.slice(customConfig.teamSimulation.maxRankBerry)

        sortedPokemonList = filteredTargetPokemonList.toSorted((a, b) => b.foodEnergyPerDay - a.foodEnergyPerDay)
        targetPokemonList.push(...sortedPokemonList.slice(0, customConfig.teamSimulation.maxRankFood))
        filteredTargetPokemonList = sortedPokemonList.slice(customConfig.teamSimulation.maxRankFood)

      } else {
        sortedPokemonList = filteredTargetPokemonList.toSorted((a, b) => b.foodEnergyPerDay - a.foodEnergyPerDay)
        targetPokemonList.push(...sortedPokemonList.slice(0, customConfig.teamSimulation.maxRankFood + customConfig.teamSimulation.maxRankBerry))
        filteredTargetPokemonList = sortedPokemonList.slice(customConfig.teamSimulation.maxRankFood + customConfig.teamSimulation.maxRankBerry)
      }

      sortedPokemonList = filteredTargetPokemonList.toSorted((a, b) => b.score - a.score)
      targetPokemonList.push(...sortedPokemonList.slice(0, customConfig.teamSimulation.maxRankAll))
      filteredTargetPokemonList = sortedPokemonList.slice(customConfig.teamSimulation.maxRankAll)

      sortedPokemonList = filteredTargetPokemonList.toSorted((a, b) => b.energyPerDay - a.energyPerDay)
      targetPokemonList.push(...sortedPokemonList.slice(0, customConfig.teamSimulation.maxRankNotSupport))
      filteredTargetPokemonList = sortedPokemonList.slice(customConfig.teamSimulation.maxRankNotSupport)

      let targetNum = targetPokemonList.length

      // げんき計算のキャッシュを効かせるため、ヒーラー、自身回復、その他の順にソート
      let healerTargetPokemonList = []
      let selfHealerTargetPokemonList = []
      let nonHealerTargetPokemonList = []
      for(let pokemon of targetPokemonList) {
        if (pokemon.otherHeal) {
          healerTargetPokemonList.push(pokemon)
        } else if (pokemon.selfHeal) {
          selfHealerTargetPokemonList.push(pokemon)
        } else {
          nonHealerTargetPokemonList.push(pokemon)
        }
      }
      targetPokemonList = [...healerTargetPokemonList, ...selfHealerTargetPokemonList, ...nonHealerTargetPokemonList]

      targetPokemonList = JSON.parse(JSON.stringify(targetPokemonList));

      let combinationWorkerParameterList = new Array(customConfig.workerNum).fill(0).map(x => ({
        sum: 0,
        topList: [],
      }));
      for(let i = 0; i <= targetNum - pickup; i++) {
        let combinationSize = 1;
        for(let j = 1; j <= pickup - 1; j++) {
          combinationSize *= targetNum - i - j;
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

      let bestResult = null;
      let workerResultList = new Array(customConfig.workerNum).fill(0).map(() => []);
      await teamMultiWorker.call(
        stepC,
        (i) => {
          return {
            type: 'simulate',
            targetNum,
            pickup,
            pattern: combinationWorkerParameterList[i].sum,
            topList: combinationWorkerParameterList[i].topList,

            fixedPokemonList,
            targetPokemonList,
            config: customConfig,
          }
        },
        (i, body, workerList) => {
        if (body.bestResult !== undefined) {
          workerResultList[i] = body.bestResult;

          bestResult = workerResultList.flat(1).sort((a, b) => b.score - a.score)[0]
          for(let worker of workerList) {
            worker.postMessage({
              type: 'border',
              border: bestResult.score
            })
          }
        }

          return body.progress;
        }
      );

      result.teamList.push({
        cookingType,
        result: bestResult,
      })
    }

    result.teamFoodNum = Food.list.reduce((a, x) => (a[x.name] = 9999, a), {});
    for(const team of result.teamList) {
      Food.list.forEach(x => result.teamFoodNum[x.name] = Math.min(Math.floor(team.result.addFoodNum[x.name] * cookingNum.value / 3), result.teamFoodNum[x.name]));
      const maxFoodNum = Math.max(...team.result.cookingList.map(cooking => cooking.cooking.foodNum));
      const thisTypeCookingList = Cooking.list.filter(cooking => cooking.type == team.cookingType && cooking.foodNum <= maxFoodNum).sort((a, b) => {
        return b.maxEnergy - a.maxEnergy
      }).slice(0, top.value);

      result[team.cookingType].cookingRankList = thisTypeCookingList;
    }
    for(const cookingType of ['カレー', 'サラダ', 'デザート']) {
      result[cookingType] ??= {
        cookingRankList: Cooking.list.filter(cooking => cooking.type == cookingType && cooking.foodNum == 0)
      }
    }
    console.log(result)

    const curryCombinationList = makeCombinationList(result['カレー'].cookingRankList.length, cookingNum.value);
    const saladCombinationList = makeCombinationList(result['サラダ'].cookingRankList.length, cookingNum.value);
    const dessertCombinationList = makeCombinationList(result['デザート'].cookingRankList.length, cookingNum.value);

    let bestResult = null;

    curry: for(let curryCombination of curryCombinationList) {
      const curryCookingList = curryCombination.map((num, i) => ({ cooking: result['カレー'].cookingRankList[i], num })).filter(x => x.num);
      const curryFoodNumMap = {}
      let curryResultList = []
      let curryEnergy = 0;
      for(let { num, cooking } of curryCookingList) {
        curryEnergy += cooking.maxEnergy * num;
        const foodMap = {}
        for(let food of cooking.foodList) {
          foodMap[food.name] = food.num * num;
          curryFoodNumMap[food.name] = (curryFoodNumMap[food.name] ?? 0) + foodMap[food.name]
        }
        curryResultList.push({ cooking, num, foodMap })
      }
      if (weights['カレー'] != 100) curryEnergy = curryEnergy ** (weights['カレー'] / 100);

      salad: for(let saladCombination of saladCombinationList) {
        const saladCookingList = saladCombination.map((num, i) => ({ cooking: result['サラダ'].cookingRankList[i], num })).filter(x => x.num);
        const saladFoodNumMap = {}
        let saladResultList = []
        let saladEnergy = 0;
        for(let { num, cooking } of saladCookingList) {
          saladEnergy += cooking.maxEnergy * num;
          const foodMap = {}
          for(let food of cooking.foodList) {
            foodMap[food.name] = food.num * num;
            saladFoodNumMap[food.name] = (saladFoodNumMap[food.name] ?? 0) + foodMap[food.name];
          }
          saladResultList.push({ cooking, num, foodMap })
        }
        if (weights['サラダ'] != 100) saladEnergy = saladEnergy ** (weights['サラダ'] / 100);
        let totalNum = 0;
        for(let food of Food.list) {
          totalNum += Math.max(Math.max(curryFoodNumMap[food.name] ?? 0, saladFoodNumMap[food.name] ?? 0) - result.teamFoodNum[food.name], 0)
        }
        if (totalNum > bagSize.value) continue salad;

        for(let dessertCombination of dessertCombinationList) {
          const dessertCookingList = dessertCombination.map((num, i) => ({ cooking: result['デザート'].cookingRankList[i], num })).filter(x => x.num);
          const dessertFoodNumMap = {}
          let dessertResultList = []
          let dessertEnergy = 0;
          for(let { num, cooking } of dessertCookingList) {
            dessertEnergy += cooking.maxEnergy * num;
            const foodMap = {}
            for(let food of cooking.foodList) {
              foodMap[food.name] = food.num * num;
              dessertFoodNumMap[food.name] = (dessertFoodNumMap[food.name] ?? 0) + foodMap[food.name];
            }
            dessertResultList.push({ cooking, num, foodMap })
          }
          if (weights['デザート'] != 100) dessertEnergy = dessertEnergy ** (weights['デザート'] / 100);
          let totalNum = 0;
          let foodNumMap = {}
          for(let food of Food.list) {
            foodNumMap[food.name] = Math.max(Math.max(curryFoodNumMap[food.name] ?? 0, saladFoodNumMap[food.name] ?? 0, dessertFoodNumMap[food.name] ?? 0) - result.teamFoodNum[food.name], 0)
            totalNum += foodNumMap[food.name]
          }
          if (totalNum > bagSize.value) continue;

          const score = curryEnergy * saladEnergy * dessertEnergy;

          if (bestResult == null || bestResult.score < score) {
            bestResult = {
              score,
              'カレー': { cookingList: curryResultList, foodNumMap: curryFoodNumMap },
              'サラダ': { cookingList: saladResultList, foodNumMap: saladFoodNumMap },
              'デザート': { cookingList: dessertResultList, foodNumMap: dessertFoodNumMap },
              foodNumMap,
            }
          }
        }
      }
    }
    result.bestResult = bestResult;


    simulationResult.value = result;
  })

  gtag('event', 'simulation_team');
}

async function showEditPopup(pokemon) {
  await Popup.show(EditPokemonPopup, { index: pokemon.box.index, evaluateTable, simulatedPokemonList: null })

  loadedPokemonBoxList.value = PokemonBox.list;
}

</script>

<template>
  <div class="page">

    <div class="flex-row-start-start flex-wrap gap-5px">
      <CommonSetting />
    </div>

    <div class="flex-row-start-start flex-wrap gap-5px mt-5px">
      <SettingButton title="シミュレーション設定">
        <template #label>
          <div class="inline-flex-row-center">
            シミュレーション設定
          </div>
        </template>

        <SettingTable>
          <tr>
            <th rowspan="5">対象ポケモン</th>
            <th>きのみスコア</th>
            <td>
              <div>上位 <input type="number" v-model="config.teamSimulation.maxRankBerry" class="w-50px"> 匹</div>
            </td>
          </tr>
          <tr>
            <th>食材スコア</th>
            <td>
              <div>上位 <input type="number" v-model="config.teamSimulation.maxRankFood" class="w-50px"> 匹</div>
            </td>
          </tr>
          <tr>
            <th>総合スコア</th>
            <td>
              <div>上位 <input type="number" v-model="config.teamSimulation.maxRankAll" class="w-50px"> 匹</div>
            </td>
          </tr>
          <tr>
            <th>サポート抜きスコア</th>
            <td>
              <div>上位 <input type="number" v-model="config.teamSimulation.maxRankNotSupport" class="w-50px"> 匹</div>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <div class="w-250px">
                <small>
                  上記設定は重複しては選ばれず、例えばきのみスコアで選ばれたポケモンは後の3つにはヒットしません。<br>
                  必ず上記設定の合計の数が対象になります。<br>
                  ヒーラーなどは総合スコアが高く出ますが、ヒーラーばかりを対象にしても良い結果にならないので総合スコアの件数は少なめにした方が良い結果になりやすいです。
                </small>
              </div>
            </td>
          </tr>
          <tr>
            <th colspan="2">結果表示</th>
            <td>
              <div>上位 <input type="number" v-model="config.teamSimulation.resultNum" class="w-50px"> 件</div>
            </td>
          </tr>
        </SettingTable>
      </SettingButton>

      <SettingButton title="除外フィルタ">
        <template #label>
          <div class="inline-flex-row-center">
            <template v-if="filterResult.excludeList.length == 0">除外なし</template>
            <template v-else>除外：{{ filterResult.excludeList.length }}匹</template>
          </div>
        </template>

        <div class="flex-column-start-start gap-5px">
          <PokemonFilterEditor v-model="config.simulation.filter" />
        </div>
      </SettingButton>

      <SettingButton title="条件">
        <template #label>
          <div class="inline-flex-row-center">
            条件：{{ requireText }}
          </div>
        </template>

        <SettingTable>
          <tr><th>日中手伝い効率</th><td><div><input type="number" class="w-80px" v-model="config.teamSimulation.require.dayHelpRate" max="222"> %以上(最大222%)</div></td></tr>
          <tr><th>夜間手伝い効率</th><td><div><input type="number" class="w-80px" v-model="config.teamSimulation.require.nightHelpRate" max="222"> %以上(最大222%)</div></td></tr>
          <tr><th>睡眠EXPボーナス</th><td><div><input type="number" class="w-80px" v-model="config.teamSimulation.require.suiminExp"> 匹以上</div></td></tr>
        </SettingTable>
      </SettingButton>
      
      <SettingButton title="表示設定">
        <template #label>
          <div class="inline-flex-row-center">
            表示設定
          </div>
        </template>

        <SettingTable>
          <tr><th>エナジー内訳</th><td><label><input type="checkbox" v-model="config.teamSimulation.result.detail">エナジー内訳</label></td></tr>
          <tr><th>食材情報</th><td><label><input type="checkbox" v-model="config.teamSimulation.result.food">食材情報</label></td></tr>
        </SettingTable>
      </SettingButton>
    </div>

    <div class="flex-column-start-start w-100 flex-110 mt-5px gap-5px">
      <SettingList class="align-self-stretch">
        <div>
          <label>料理回数</label>
          <div><input type="number" v-model="cookingNum"></div>
        </div>

        <div class="flex-column-start-stretch">
          <label>種類別重み設定</label>
          <div class="flex-row-start-center gap-10px">
            <div class="flex-row-start-center gap-3px">
              <label>カレー：</label>
              <input type="number" class="w-50px" :value="weights['カレー']" @input="weights['カレー'] = Number($event.target.value) || 0">
              %
            </div>
            <div class="flex-row-start-center gap-3px">
              <label>サラダ：</label>
              <input type="number" class="w-50px" :value="weights['サラダ']" @input="weights['サラダ'] = Number($event.target.value) || 0">
              %
            </div>
            <div class="flex-row-start-center gap-3px">
              <label>デザート：</label>
              <input type="number" class="w-50px" :value="weights['デザート']" @input="weights['デザート'] = Number($event.target.value) || 0">
              %
            </div>
          </div>
        </div>
        <div>
          <label>料理候補</label>
          <div>上位<input type="number" class="w-50px" v-model="top">件</div>
        </div>
        <div>
          <label>食材バッグ</label>
          <div><input type="number" class="w-50px" v-model="bagSize"></div>
        </div>
      </SettingList>

      <button @click="simulation">シミュレーション実行</button>

      <AsyncWatcherArea class="flex-column-start-stretch w-100 gap-20px simulation-result" :asyncWatcher="asyncWatcher">
        <div class="scroll-area flex-column-start-stretch w-100 gap-20px">
          <template v-if="simulationResult.teamList.length && simulationResult.bestResult == null">
            シミュレーション結果が得られませんでした。料理回数などを減らして再度お試しください。
          </template>
          <template v-else-if="simulationResult.teamList.length">
            
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th v-for="food of Food.list"><img :src="food.img" /></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th colspan="3">当日取得量</th>
                  <td v-for="food of Food.list" class="text-align-right"><template v-if="simulationResult.teamFoodNum[food.name]">{{ simulationResult.teamFoodNum[food.name].toFixed(0) }}</template></td>
                </tr>
                <template v-for="cookingType in ['カレー', 'サラダ', 'デザート']">
                  <template v-for="({ cooking, num, foodMap }, i) in simulationResult.bestResult[cookingType].cookingList">
                    <tr>
                      <th v-if="i == 0" style="writing-mode: vertical-rl" :rowspan="simulationResult.bestResult[cookingType].cookingList.length + 1">{{ cookingType }}</th>
                      <th>{{ cooking.name }}</th>
                      <th><template v-if="num">{{ num }}食</template></th>
                      <td v-for="food of Food.list" class="text-align-right">{{ foodMap[food.name]?.toFixed(0) }}</td>
                    </tr>
                  </template>
                  <tr>
                    <th class="text-align-right" colspan="2">小計</th>
                    <td v-for="food of Food.list" class="text-align-right">{{ simulationResult.bestResult[cookingType].foodNumMap[food.name]?.toFixed(0) }}</td>
                  </tr>
                </template>
                <tr>
                  <th colspan="3">必要食材量</th>
                  <td v-for="food of Food.list" class="text-align-right">
                    <template v-if="simulationResult.bestResult.foodNumMap[food.name]">
                      {{ simulationResult.bestResult.foodNumMap[food.name]?.toFixed(0) }}
                    </template>
                  </td>
                </tr>
                
              </tbody>
            </table>

            <template v-for="({ cookingType, result }, i) in simulationResult.teamList">
              <ToggleArea :open="false" class="w-100">
                <template #headerText>
                  {{ cookingType }}: {{ Math.round(result.score).toLocaleString() }} (最終エナジー:{{ Math.round(result.energy).toLocaleString() }})
                  <HelpButton class="ml-5px" title="スコア" markdown="
                    スコアは「エナジー✕(100% + 追加ゆめのかけら ÷ エナジーによるゆめのかけら ✕ ゆめのかけら評価倍率)」です。
                  " />
                </template>

                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th></th>
                      <th v-for="i in result.pokemonList.length">{{ i }}</th>
                      <th>合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th class="vertical" :rowspan="
                        (config.teamSimulation.result.detail ? 13 : 10)
                        + (simulationResult.config.simulation.fix && simulationResult.config.simulation.fixResourceMode != 0 ? 2 : 0)
                      ">編成</th>
                      <th class="white-space-nowrap">名前</th>
                      <td v-for="pokemon in result.pokemonList">
                        <div class="flex-row-start-center gap-5px">
                          <NameLabel :pokemon="pokemon" />
                          <svg v-if="pokemon.box?.index" viewBox="0 0 100 100" width="16" @click="showEditPopup(pokemon)" class="flex-00">
                            <path d="M0,100 L0,80 L60,20 L80,40 L20,100z M65,15 L80,0 L100,20 L85,35z" fill="#888" />
                          </svg>
                        </div>
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <th>Lv</th>
                      <td v-for="pokemon in result.pokemonList"><LvLabel :pokemon="pokemon" /></td>
                      <td></td>
                    </tr>
                    
                    <template v-if="simulationResult.config.simulation.fix && simulationResult.config.simulation.fixResourceMode != 0">
                      <tr>
                        <th>使用アメ</th>
                        <td v-for="pokemon in result.pokemonList" class="text-align-right">{{ pokemon.useCandy?.toLocaleString() }}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <th>使用ゆめのかけら</th>
                        <td v-for="pokemon in result.pokemonList" class="text-align-right">{{ pokemon.useShard?.toLocaleString() }}</td>
                        <td></td>
                      </tr>
                    </template>

                    <tr>
                      <th>食材</th>
                      <td v-for="pokemon in result.pokemonList">
                        <FoodList :pokemon="pokemon" />
                      </td>
                      <td></td>
                    </tr>

                    <tr>
                      <th>サブスキル</th>
                      <td v-for="pokemon in result.pokemonList">
                        <SubSkillLabelList class="sub-skill-list" :pokemon="pokemon" />
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
                        <template v-if="pokemon.speedBonus">
                          {{ Math.round(pokemon.speedBonus * 100).toLocaleString() }}%
                        </template>
                      </td>
                      <td></td>
                    </tr>
                    <!-- <tr v-if="config.teamSimulation.result.detail">
                      <th>げんき回復</th>
                      <td v-for="pokemon in result.pokemonList" class="text-align-right">
                        <template v-if="pokemon">
                          {{ Math.round(pokemon.healEffect * 100).toLocaleString() }}
                        </template>
                      </td>
                      <td></td>
                    </tr> -->
                    <tr v-if="config.teamSimulation.result.detail">
                      <th>日中手伝い倍率</th>
                      <td v-for="pokemon in result.pokemonList" class="text-align-right">
                        <template v-if="pokemon.dayHelpRate">
                          {{ Math.round(pokemon.dayHelpRate * 100).toLocaleString() }}%
                        </template>
                      </td>
                      <td></td>
                    </tr>
                    <tr v-if="config.teamSimulation.result.detail">
                      <th>夜間手伝い倍率</th>
                      <td v-for="pokemon in result.pokemonList" class="text-align-right">
                        <template v-if="pokemon.nightHelpRate">
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
                        <template v-if="pokemon.base.skill?.name">{{ pokemon.base.skill?.name }}(Lv{{ pokemon.fixedSkillLv }})</template>
                      </td>
                      <td class="text-align-right">
                      </td>
                    </tr>
                    <tr>
                      <th>スキル回数</th>
                      <td v-for="pokemon in result.pokemonList" class="text-align-right">
                        <template v-if="pokemon.skillPerDay">
                          {{ pokemon.skillPerDay.toFixed(1) }}
                        </template>
                      </td>
                      <td class="text-align-right">
                      </td>
                    </tr>
                    <tr>
                      <th>スキルエナジー</th>
                      <td v-for="pokemon in result.pokemonList" class="text-align-right">
                        <template v-if="pokemon.skillEnergyPerDay">
                          {{ Math.round(pokemon.skillEnergyPerDay).toLocaleString() }}
                        </template>
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(result.pokemonList.reduce((a, pokemon) => a + pokemon.skillEnergyPerDay, 0)).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th>ゆめのかけら</th>
                      <td v-for="pokemon in result.pokemonList" class="text-align-right">
                        <template v-if="pokemon.shardBonus">{{ Math.round(pokemon.shardBonus).toLocaleString() }}</template>
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(result.pokemonList.reduce((a, pokemon) => a + pokemon.shard, 0)).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th colspan="2">料理</th>
                      <td :colspan="result.pokemonList.length">
                        <template v-if="!config.teamSimulation.result.detail">
                          {{
                            Object.entries(result.cookingList.reduce((a, x) => (a[x.cooking.name] = (a[x.cooking.name] ?? 0) + 1, a), {}))
                            .sort(([aName, aNum], [bName, bNum]) => bNum - aNum)
                            .map(([name, num]) => `${name}x${num}`)
                            .join(' / ')
                          }}
                        </template>
                        <template v-else>
                          <div v-for="cooking in result.cookingList">
                            {{ cooking.cooking.name }}
                            鍋{{ cooking.potSize }}
                            (
                              {{ Math.round(cooking.cooking.energy).toLocaleString() }}
                              × {{ Math.round(cooking.cooking.recipeLvBonus * 100) }}%(Lv)
                              × {{ Math.round(cooking.successPower * 100) }}%(大成功)
                              <template v-if="cooking.addEnergy > 0">＋ {{ Math.round(cooking.addEnergy).toLocaleString() }}(追加)</template>
                            ) × {{ Math.round(config.simulation.cookingWeight * 100) }}%(設定)
                            ＝ {{ Math.round(cooking.energy).toLocaleString() }}エナジー</div>
                        </template>
                      </td>
                      <td class="text-align-right">
                        {{ Math.round(result.cookingList.reduce((a, x) => a + x.energy, 0)).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th rowspan="2">エナジー</th>
                      <th>エナジー</th>
                      <td :colspan="result.pokemonList.length + 1" class="text-align-right">
                        {{ Math.round(result.rawEnergy).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th>FB込み</th>
                      <td :colspan="result.pokemonList.length + 1" class="text-align-right">
                        {{ Math.round(result.rawEnergy * (1 + config.simulation.fieldBonus / 100)).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <th rowspan="3">ゆめのかけら</th>
                      <th>エナジー</th>
                      <td :colspan="result.pokemonList.length + 1" class="text-align-right">{{ Math.round(result.energyShard).toLocaleString() }}</td>
                    </tr>
                    <tr>
                      <th>ボーナス</th>
                      <td :colspan="result.pokemonList.length + 1" class="text-align-right">{{ Math.round(result.bonusShard).toLocaleString() }}</td>
                    </tr>
                    <tr>
                      <th>スキル</th>
                      <td :colspan="result.pokemonList.length + 1" class="text-align-right">{{ Math.round(result.skillShard).toLocaleString() }}</td>
                    </tr>
                    <tr>
                      <th colspan="2">スコア</th>
                      <td :colspan="result.pokemonList.length + 1" class="text-align-right">{{ Math.round(result.score).toLocaleString() }}</td>
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
          </template>
          <template v-else-if="simulationResult.teamList.length == 0">
            シミュレーション実行ボタンを押してください
          </template>
        </div>
      </AsyncWatcherArea>
    </div>

  </div>
</template>

<style lang="scss" scoped>

.page {
  display: flex;
  flex-direction: column;
  height: 100%;

  .setting-button {
    img {
      width: 1.2em;
      height: 1.2em;
      line-height: 0;
      margin: 0;
    }
  }

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

  .simulation-result {
    flex: 1 1 100px;
    border: 1px #CCC solid;
    border-radius: 5px;
    padding: 5px;
    overflow: hidden;

    .scroll-area {
      flex: 1 1 0;
      overflow: auto;
    }

    .toggle-area {
      flex: 0 0 auto;
      max-width: 1100px;
    }

    table {
      width: 100%;
      border-collapse: collapse;

      th {
        font-weight: bold;
      }
      th, td {
        border: 1px #000 solid;
        vertical-align: middle;
        padding: 2px 3px;
      }
      th {
        font-weight: bold;
        white-space: nowrap;
        background: rgb(66, 85, 158);
        color: #FFF;
        border: 1px #FFF solid;
      }

      img {
        width: 24px;
        line-height: 1;
        vertical-align: middle;
        background-color: #FFF;
        border-radius: 5px;
        margin: 0 auto;
      }

      .plus {
        color: #d40063;
      }

      .minus {
        color: #000f9b;
      }

      .number {
        text-align: right;
      }

      .sub-skill-list {
        display: flex;
      }
    }
  }
}

</style>