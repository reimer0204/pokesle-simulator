<script setup>
import { onBeforeUnmount } from 'vue';
import Food from '../data/food';
import Pokemon from '../data/pokemon';
import SubSkill from '../data/sub-skill';
import config from '../models/config';
import PokemonBox from '../models/pokemon-box';
import PopupBase from './popup-base.vue';
import SettingList from './setting-list.vue';
import TeamSimulator from '../worker/team-simulator?worker';
import NatureInfo from './nature-info.vue';
import AsyncWatcherArea from './async-watcher-area.vue';
import { AsyncWatcher } from '../models/async-watcher';
import MultiWorker from '../models/multi-worker';

const props = defineProps({
  pokemonList: { required: true },
})

const asyncWatcher = AsyncWatcher.init();

const $emit = defineEmits(['close']);

const simulationResultList = ref([])

let workerList = [];
async function simulation() {
  asyncWatcher.run(async (progressCounter) => {
    // 気休めかもしれないけどループの多いところにforEachとかreduceとか使うとコストかかりそうだから一部は泥臭くやる

    let [stepA, stepB] = progressCounter.split(1, 10);

    // 固定のポケモンと推論対象を選ぶ
    let fixedPokemonList = props.pokemonList.filter(x => x.fix == 1);
    let targetPokemonList = props.pokemonList.filter(x => x.fix == null);

    let rankMax = Math.min(config.teamSimulation.maxRank, targetPokemonList.length);
    const pickup = 5 - fixedPokemonList.length;

    // スコアの高い上位のみをピックアップ
    targetPokemonList = JSON.parse(JSON.stringify(targetPokemonList.sort((a, b) => b.score - a.score).slice(0, rankMax)));

    // 組み合わせを列挙
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

    const multiWorker = new MultiWorker(TeamSimulator, config.workerNum)
    let combinationList = (await multiWorker.call(
      stepA,
      (i) => ({
        type: 'combination',
        rankMax,
        pickup,
        pattern: combinationWorkerParameterList[i].sum,
        topList: combinationWorkerParameterList[i].topList,
        targetPokemonList,
      }),
    )).flat(1);

    // 概算エナジーの高い順にソート
    combinationList.sort((a, b) => b.aboutScore - a.aboutScore)
    let workerCombinationListList = new Array(config.workerNum).fill(0).map(x => []);
    for(let i = 0; i < combinationList.length; i++) {
      workerCombinationListList[i % config.workerNum].push(combinationList[i])
    }

    let bestResult = [];
    let workerResultList = new Array(config.workerNum).fill(0).map(() => []);
    await multiWorker.call(
      stepB,
      (i) => {
        return {
          type: 'simulate',
          fixedPokemonList: JSON.parse(JSON.stringify(fixedPokemonList)),
          targetPokemonList: JSON.parse(JSON.stringify(targetPokemonList)),
          config: JSON.parse(JSON.stringify(config)),
          combinationList: workerCombinationListList[i],
        }
      },
      (i, body, workerList) => {
        workerResultList[i] = body.bestResult;

        bestResult = workerResultList.flat(1).sort((a, b) => b.score - a.score).slice(0, config.teamSimulation.resultNum);
        if (bestResult.length >= config.teamSimulation.resultNum) {
          for(let worker of workerList) {
            worker.postMessage({
              type: 'border',
              border: bestResult.at(-1).score
            })
          }
        }

        return body.progress;
      }
    );

    // await Promise.all(promiseList)

    simulationResultList.value = bestResult;
  })

}

onBeforeUnmount(() => {
  workerList.forEach(w => w.terminal())
})

</script>

<template>
  <PopupBase @close="$emit('close')">
    <template #headerText>チームシミュレーション</template>

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

          <div class="flex-110 w-100 flex-column-start-stretch">
            <label>週初め所持食材</label>
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
          <template v-for="(result, i) in simulationResultList">
            <ToggleArea :open="i == 0" class="w-100">
              <template #headerText>{{ i + 1 }}: {{ Math.round(result.score).toLocaleString() }}</template>

              <table>
                <tr>
                  <th></th>
                  <td v-for="pokemon in result.pokemonList">
                    {{ pokemon.name }}<template v-if="pokemon.bagOverOperation">(いつ育)</template>
                  </td>
                  <td>合計</td>
                  <td v-if="config.teamSimulation.result.food">余り食材</td>
                </tr>

                <tr>
                  <th>Lv</th>
                  <td v-for="pokemon in result.pokemonList" class="number">{{ pokemon.lv }}</td>
                  <td>-</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr>
                  <th>食材</th>
                  <td v-for="pokemon in result.pokemonList">
                    <div class="flex-row-center-center">
                      <img v-for="food in pokemon.foodList" :src="Food.map[food].img" >
                    </div>
                  </td>
                  <td>-</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr>
                  <th>スキル</th>
                  <td v-for="pokemon in result.pokemonList" class="w-100px">
                    {{ pokemon.skillName }}
                    <small>(Lv{{ pokemon.fixedSkillLv }})</small>
                  </td>
                  <td>-</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr>
                  <th>サブスキル</th>
                  <td v-for="pokemon in result.pokemonList">
                    <div class="sub-skill-list">
                      <div v-for="(subSkill, i) in pokemon.subSkillList"
                        class="sub-skill"
                        :class="[
                          `sub-skill-${SubSkill.map[subSkill].rarity}`,
                          {
                            short: config.pokemonList.subSkillShort,
                            disabled: i >= pokemon.enableSubSkillList.length,
                          }
                        ]"
                      >{{ config.pokemonList.subSkillShort ? SubSkill.map[subSkill].short : subSkill }}</div>
                    </div>
                  </td>
                  <td>-</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr>
                  <th>せいかく</th>
                  <td v-for="pokemon in result.pokemonList"><NatureInfo :nature="pokemon.nature" /></td>
                  <td>-</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr>
                  <th>おてスピ短縮</th>
                  <td v-for="pokemon in result.pokemonList" class="number">{{ Math.round(pokemon.speedBonus * 100).toLocaleString() }}%</td>
                  <td>-</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr>
                  <th>げんき回復/日</th>
                  <td v-for="pokemon in result.pokemonList" class="number">{{ Math.round(pokemon.healEffect).toLocaleString() }}</td>
                  <td>-</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr v-if="config.teamSimulation.result.detail">
                  <th>手伝い/週</th>
                  <td v-for="pokemon in result.pokemonList" class="number">{{ Math.round((pokemon.dayHelpNum + pokemon.nightHelpNum) * 7).toLocaleString() }}</td>
                  <td>-</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr v-if="config.teamSimulation.result.detail">
                  <th>いつ育/週</th>
                  <td v-for="pokemon in result.pokemonList" class="number">{{ Math.round(pokemon.berryHelpNum * 7).toLocaleString() }}</td>
                  <td>-</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr v-if="config.teamSimulation.result.detail">
                  <th>食材確率</th>
                  <td v-for="pokemon in result.pokemonList" class="number">{{ (pokemon.foodRate * 100).toFixed(1) }}%</td>
                  <td>-</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr>
                  <th>きのみE/週</th>
                  <td v-for="pokemon in result.pokemonList" class="number">{{ Math.round(pokemon.berryEnergyPerDay * 7).toLocaleString() }}</td>
                  <td class="number">{{ Math.round(result.pokemonList.reduce((a, x) => a + x.berryEnergyPerDay, 0) * 7).toLocaleString() }}</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr>
                  <th>スキルE/週</th>
                  <td v-for="pokemon in result.pokemonList" class="number">{{ Math.round(pokemon.skillEnergyPerDay * 7).toLocaleString() }}</td>
                  <td class="number">{{ Math.round(result.pokemonList.reduce((a, x) => a + x.skillEnergyPerDay, 0) * 7).toLocaleString() }}</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr>
                  <th>ゆめのかけら/週</th>
                  <td v-for="pokemon in result.pokemonList" class="number">{{ Math.round(pokemon.shard * 7).toLocaleString() }}</td>
                  <td class="number">{{ Math.round(result.pokemonList.reduce((a, x) => a + x.shard, 0) * 7).toLocaleString() }}</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr v-if="config.teamSimulation.result.detail">
                  <th>スキル回数/週</th>
                  <td v-for="pokemon in result.pokemonList" class="number">{{ Math.round(pokemon.skillPerDay * 7).toLocaleString() }}</td>
                  <td>-</td>
                  <td v-if="config.teamSimulation.result.food">-</td>
                </tr>

                <tr v-for="food in Food.list" v-if="config.teamSimulation.result.food">
                  <th><img :src="food.img"></th>
                  <td v-for="pokemon in result.pokemonList" class="number">
                    <template v-if="pokemon[food.name]">{{ Math.round(pokemon[food.name] * 7).toLocaleString() }}</template>
                  </td>
                  <td class="number">{{ Math.round(result.pokemonList.reduce((a, x) => a + (x[food.name] ?? 0), 0) * 7).toLocaleString() }}</td>
                  <td class="number">{{ Math.round(result.remainFoodNum[food.name]).toLocaleString() }}</td>
                </tr>

                <tr>
                  <th>料理</th>
                  <td colspan="7">
                    <div v-for="day in 7">
                      {{ result.cookingList.slice(day * 3 - 3, day * 3).map(x => x.cooking.name).join(' / ') }}
                    </div>
                  </td>
                </tr>

                <tr>
                  <th>料理エナジー</th>
                  <td colspan="7" class="number">
                    {{ Math.round(result.cookingList.reduce((a, x) => a + x.energy, 0)).toLocaleString() }}
                  </td>
                </tr>

                <tr>
                  <th>総エナジー/週<br><small>(FB込)</small></th>
                  <td colspan="7" class="number">
                    {{ Math.round(result.energy).toLocaleString() }}
                  </td>
                </tr>

                <tr>
                  <th>スコア</th>
                  <td colspan="7" class="number">{{ Math.round(result.score).toLocaleString() }}</td>
                </tr>
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
  max-width: 900px;
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

  .simulation-result {
    flex: 1 1 100px;
    // overflow: auto;

    table {
      border-collapse: collapse;

      th {
        font-weight: bold;
      }
      th, td {
        border: 1px #000 solid;
        vertical-align: middle;
        padding: 2px 3px;
      }

      img {
        width: 24px;
        line-height: 1;
        vertical-align: middle;
      }

      .number {
        text-align: right;
      }

      .sub-skill-list {
        width: 105px;
        display: flex;
        flex-wrap: wrap;
        gap: 2px 5px;
      }
      .sub-skill {
        display: flex;
        justify-content: center;
        width: 11.5em;
        padding: 2px 0px;
        white-space: nowrap;
        overflow: hidden;

        font-size: 10px;
        font-weight: bold;
        border-radius: 3px;

        &.short {
          width: 50px;
          padding: 2px 0;
        }

        &.disabled {
          opacity: 0.5;
          font-weight: normal;
        }

        &.sub-skill-1 { background-color: #F8F8F8; border: 1px #AAA solid; color: #333; }
        &.sub-skill-2 { background-color: #E0F0FF; border: 1px #9BD solid; color: #333; }
        &.sub-skill-3 { background-color: #FFF4D0; border: 1px #B97 solid; color: #422; }
      }
    }
  }
}
</style>