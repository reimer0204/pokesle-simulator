<script setup>
import { onBeforeUnmount } from 'vue';
import Food from '../data/food';
import { AsyncWatcher } from '../models/async-watcher';
import config from '../models/config';
import EvaluateTable from '../models/evaluate-table';
import MultiWorker from '../models/multi-worker';
import PokemonBox from '../models/pokemon-box';
import PokemonFilter from '../models/pokemon-filter';
import PokemonListSimulator from '../worker/pokemon-list-simulator?worker';
import TeamSimulator from '../worker/team-simulator?worker';
import PokemonFilterEditor from './filter/pokemon-filter-editor.vue';
import NatureInfo from './status/nature-info.vue';
import AsyncWatcherArea from './util/async-watcher-area.vue';
import PopupBase from './util/popup-base.vue';
import SettingList from './util/setting-list.vue';

const props = defineProps({
  defaultTargetDay: { type: Number },
})

let evaluateTable = EvaluateTable.load(config);
const asyncWatcher = AsyncWatcher.init();
const $emit = defineEmits(['close']);

// シミュレーション設定
const cookingType = ref(config.simulation.cookingType)
const targetDay = ref(props.defaultTargetDay ?? (new Date().getHours() < 12 ? (new Date().getDay() + 6) % 7 : new Date().getDay()))
const beforeEnergy = ref(0);

const filterResult = computed(() => PokemonFilter.filter(PokemonBox.list, config.simulation.filter));

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

  let pokemonList = filterResult.value.pokemonList;

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

async function simulation() {
  asyncWatcher.run(async (progressCounter) => {
    let [stepA, stepC] = progressCounter.split(1, 8);

    let customConfig = JSON.parse(JSON.stringify({
      ...config,
      simulation: {
        ...config.simulation,
        cookingType: cookingType.value,
      },
      teamSimulation: {
        ...config.teamSimulation,
        beforeEnergy: beforeEnergy.value,
      },
    }))

    if (targetDay.value != -1) {
      customConfig.simulation.shardToEnergy = customConfig.selectEvaluate.shardEnergyRate / (7 - targetDay.value);
      customConfig.teamSimulation.day = targetDay.value;
    }

    let pokemonList = await pokemonAboutScoreSimulation(customConfig, stepA)

    // 固定のポケモンと推論対象を選ぶ
    const fixedPokemonList = JSON.parse(JSON.stringify(pokemonList.filter(x => x.fix == 1)));
    let targetPokemonList = pokemonList.filter(x => x.fix == null);

    const rankMax = Math.min(customConfig.teamSimulation.maxRank, targetPokemonList.length);
    const pickup = 5 - fixedPokemonList.length;

    // スコアの高い上位のみをピックアップ
    targetPokemonList = JSON.parse(JSON.stringify(targetPokemonList.sort((a, b) => b.score - a.score).slice(0, rankMax)));

    let combinationWorkerParameterList = new Array(customConfig.workerNum).fill(0).map(x => ({
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

    let bestResult = [];
    let workerResultList = new Array(customConfig.workerNum).fill(0).map(() => []);
    await multiWorker.call(
      stepC,
      (i) => {
        return {
          type: 'simulate',
          rankMax,
          pickup,
          pattern: combinationWorkerParameterList[i].sum,
          topList: combinationWorkerParameterList[i].topList,

          fixedPokemonList,
          targetPokemonList,
          config: customConfig,
        }
      },
      (i, body, workerList) => {
        workerResultList[i] = body.bestResult;

        bestResult = workerResultList.flat(1).sort((a, b) => b.score - a.score).slice(0, customConfig.teamSimulation.resultNum);
        for(let worker of workerList) {
          worker.postMessage({
            type: 'border',
            border: bestResult.score
          })
        }

        return body.progress;
      }
    );

    simulationResult.value = {
      targetDay: customConfig.teamSimulation.day,
      teamList: bestResult
    }

    // console.log(performance.now() - startAt);
  })

}

</script>

<template>
  <PopupBase @close="$emit('close')">
    <template #headerText>チームシミュレーション</template>

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
                <option value="-1">1週間</option>
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
              <div>
                <input v-if="targetDay != -1" type="number" v-model="config.teamSimulation.cookingNum" class="w-50px">
                <input v-if="targetDay == -1" type="number" value="21" class="w-50px" disabled>
                 食分
              </div>
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

        <div class="flex-row flex-wrap gap-5px">
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
        </div>

        <button @click="simulation">シミュレーション実行</button>

        <div class="flex-row-start-center gap-10px">
          <label><input type="checkbox" v-model="config.teamSimulation.result.detail">エナジー内訳</label>
          <label><input type="checkbox" v-model="config.teamSimulation.result.food">食材情報</label>
        </div>

        <AsyncWatcherArea class="flex-column-start-start w-100 gap-20px simulation-result" :asyncWatcher="asyncWatcher">
          <template v-for="(result, i) in simulationResult.teamList">
            <ToggleArea :open="i == 0" class="w-100">
              <template #headerText>
                {{ i + 1 }}: {{ Math.round(result.score).toLocaleString() }} (最終エナジー:{{ Math.round(result.energy).toLocaleString() }})
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
                    <th class="vertical" :rowspan="config.teamSimulation.result.detail ? 13 : 10">編成</th>
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
                      <template v-if="pokemon.skill?.name">{{ pokemon.skill?.name }}(Lv{{ pokemon.fixedSkillLv }})</template>
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
                          {{ Math.round(cooking.cooking.energy).toLocaleString() }}×{{ (cooking.cooking.recipeLvBonus * 100) }}% + {{ Math.round(cooking.energy - cooking.cooking.fixEnergy).toLocaleString() }}
                          = {{ Math.round(cooking.energy).toLocaleString() }}エナジー</div>
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
          <template v-if="simulationResult.teamList.length == 0">
            シミュレーション実行ボタンを押してください
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
  max-width: 1100px;
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

  .simulation-result {
    flex: 1 1 100px;
    // overflow: auto;

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