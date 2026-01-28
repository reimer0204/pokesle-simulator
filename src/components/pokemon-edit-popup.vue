<script setup>
import { Food, Cooking } from '../data/food_and_cooking';
import Nature from '../data/nature';
import Pokemon from '../data/pokemon';
import SubSkill from '../data/sub-skill';
import { AsyncWatcher } from '../models/async-watcher';
import config from '../models/config';
import EvaluateTable from '../models/simulation/evaluate-table';
import MultiWorker from '../models/multi-worker';
import PokemonBox from '../models/pokemon-box/pokemon-box';
import convertRomaji from '../models/utils/convert-romaji';
import PokemonListSimulator from '../models/pokemon-box/pokemon-box-worker?worker';
import AsyncWatcherArea from './util/async-watcher-area.vue';
import PopupBase from './util/popup-base.vue';

import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  RadialLinearScale,
  // CategoryScale,
  // LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  // plugins
} from 'chart.js'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
)

let evaluateTable;
const evaluateTablePromise = (async () => {
  evaluateTable = await EvaluateTable.load(config);
})();

const props = defineProps({
  index: { type: Number },
})

const $emit = defineEmits(['close', 'input']);

const nameInput = ref(null);
const lvInput = ref(null);
const bagInput = ref(null);
const skillLvInput = ref(null);
const foodInput = ref(null);
const subSkillInputList = ref([]);
const natureInput = ref(null);

let pokemon = reactive({
  name: null,
  lv: null,
  bag: null,
  skillLv: null,
  foodList: [null, null, null],
  subSkillList: [null, null, null, null, null],
  nature: null,
  shiny: false,
  fix: null,
})
const insertTo = ref(null)

const basePokemon = computed(() => {
  return Pokemon.map[pokemon.name]
})
const kaihouPokemon = computed(() => {
  return basePokemon.value?.name == 'ダークライ'
})

let assist = reactive({
  name: null,
  lv: null,
  bag: null,
  skillLv: null,
  foodABC: null,
  subSkillList: [null, null, null, null, null],
  nature: null,
});

const pokemonFoodABC = computed(() => {
  return pokemon.foodList.map(f => f ? String.fromCharCode(65 + Math.max(basePokemon.value?.foodList.findIndex(x => x.name == f) ?? 0, 0)) : '').join('');
})

// 編集ならデフォルト値を設定
if (props.index != null) {
  pokemon = reactive(JSON.parse(JSON.stringify(PokemonBox.list[props.index])))

  assist.name = pokemon.name;
  assist.lv = pokemon.lv;
  assist.bag = pokemon.bag;
  assist.skillLv = pokemon.skillLv;
  assist.foodABC = pokemonFoodABC.value;
  assist.subSkillList = [...pokemon.subSkillList]
  assist.nature = pokemon.nature
}

// 厳選情報計算
let selectAsyncWatcher = AsyncWatcher.init();
let boxMultiWorker = new MultiWorker(PokemonListSimulator)
let singleMultiWorker = new MultiWorker(PokemonListSimulator, 1)
onBeforeUnmount(() => {
  boxMultiWorker.close();
  singleMultiWorker.close();
})
const simulatedPokemonList = ref([]);
let boxLoading;
async function loadBoxInfo(setConfig = false) {
  boxLoading = selectAsyncWatcher.run(async (progressCounter) => {
    await evaluateTablePromise
    simulatedPokemonList.value = await PokemonBox.simulation(
      PokemonBox.list,
      boxMultiWorker, evaluateTable, 
      config,
      progressCounter, setConfig
    )
  })
  await boxLoading;
}
loadBoxInfo(true)

let subSkillNameSort = SubSkill.list.toSorted((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0)

const foodSelectList = computed(() => {
  if (basePokemon.value == null) return [[], [], []];
  return [
    basePokemon.value.foodList.filter(x => x?.name && x.numList[0]).map(x => x?.name),
    basePokemon.value.foodList.filter(x => x?.name && x.numList[1]).map(x => x?.name),
    basePokemon.value.foodList.filter(x => x?.name && x.numList[2]).map(x => x?.name),
  ]
})

// ひらがなをカタカナに直した名前
const pokemonNames = computed(() => {
  return Pokemon.list.map(pokemon => {
    return {
      pokemon,
      normalizedName: pokemon.name.replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60))
    }
  })
})

function inferName(name) {
  // ローマ字をカタカナに、ひらがなをカタカナに変換
  const regexp = new RegExp(
    convertRomaji(name)
    .replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60))
    .split('').map(x => '^$\\.*+?()[]{}|'.includes(x) ? `\\${x}` : x).join('.*')
  );

  let matchPokemonList = pokemonNames.value.map(({ pokemon, normalizedName }) => {
    let result = regexp.exec(normalizedName)
    if (result) return { pokemon, matchLength: result[0].length }
    return null;
  }).filter(x => x)
  if (matchPokemonList.length) {
    matchPokemonList.sort((a, b) => {
      if (a.matchLength != b.matchLength) return a.matchLength - b.matchLength;
      return a.pokemon.name.length - b.pokemon.name.length;
    })
    pokemon.name = matchPokemonList[0].pokemon.name;
  }
}
watch(() => assist.name, inferName)

function convertFoodABC() {
  if (basePokemon.value == null || assist.foodABC == null) return;

  (assist.foodABC + '   ').slice(0, 3).split('').forEach((letter, i) => {
    let charCode = letter.toUpperCase().charCodeAt(0);
    if (65 <= charCode && charCode <= 90) charCode -= 65;
    else if (49 <= charCode && charCode <= 64) charCode -= 49;
    else charCode = 99;
    let foodIndex = Math.max(charCode, 0);
    pokemon.foodList[i] = basePokemon.value.foodList[foodIndex]?.name;
  })
}
watch(() => assist.foodABC, convertFoodABC)
watch(() => pokemon.name, convertFoodABC)

function convertSubSkill(index) {
  if (assist.subSkillList[index] == null || assist.subSkillList[index] == '') {
    if (kaihouPokemon.value) {
      pokemon.subSkillList[index] = null;
    }
    return;
  }

  let name = convertRomaji(assist.subSkillList[index])
    .toUpperCase()
    .replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60));
  let regexp = new RegExp(name.split('').join('.*'))

  let match = SubSkill.listForInput.find(x => regexp.test(x.katakana) || x.name == name)
  if (match) {
    pokemon.subSkillList[index] = match.name;
  }
}

function convertNature() {
  // ローマ字をカタカナに、カタカナをひらがなに変換
  let name = convertRomaji(assist.nature)
    .replace(/[\u30a1-\u30f6]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60));
  let regexp = new RegExp(name.split('').join('.*'))

  let matchNatureList = Nature.list.filter(x => regexp.test(x.name))
  if (matchNatureList.length) {
    matchNatureList.sort((a, b) => Math.abs(a.name.length - name.length) - Math.abs(b.name.length - name.length))
    pokemon.nature = matchNatureList[0].name;
  }
}
watch(() => assist.name, inferName)

// 厳選情報
let selectResult = ref(null);
let selectLvList = ['max', ...Object.entries(config.selectEvaluate.levelList).flatMap(([lv, v]) => v ? [lv] : []).sort((a, b) => a - b)];

async function calcSelectScore() {
  await boxLoading;
  await evaluateTablePromise

  try {
    PokemonBox.check(pokemon)
    selectAsyncWatcher.run(async (progressCounter) => {
      await singleMultiWorker.call(
        null,
        () => ({ type: 'config', config: JSON.parse(JSON.stringify(config)) })
      )

      const result = (await singleMultiWorker.call(
        progressCounter,
        () => {
          return {
            type: 'basic',
            pokemonList: [JSON.parse(JSON.stringify(pokemon))],
            evaluateTable,
          }
        }
      )).flat(1)[0];

      if (simulatedPokemonList.value && result) {
        result.box = {};
        for(let selectLv of selectLvList) {
          result.box[selectLv] = {};
          for(let after of result.base.afterList) {

            result.box[selectLv][after] = {}
            for(let { key } of selectResultColumns.value) {
              let targetList = simulatedPokemonList.value.filter(x => x.evaluateResult?.[selectLv]?.[after]?.[key]?.score != null);
              let sameFoodTargetList = targetList.filter(x => x.box?.foodList.every((f, i) => pokemon.foodList[i] == f))
              let sameList = targetList.map(x => x.evaluateResult?.[selectLv]?.[after]?.[key]?.score);
              let sameFoodList = sameFoodTargetList.map(x => x.evaluateResult?.[selectLv]?.[after]?.[key]?.score);

              result.box[selectLv][after][key] = {
                same: sameList.length ? Math.max(...sameList) : null,
                food: sameFoodList.length ? Math.max(...sameFoodList) : null,
              }
            }
          }
        }
      }

      selectResult.value = result
    })
  } catch(e) {
    selectResult.value = null;
    // ignore
  }
}
calcSelectScore();
watch(pokemon, calcSelectScore)

const selectResultColumns = computed(() => {
  const result = [
    { key: 'energy', name: '総合スコア', color: 'rgb(220, 48, 50)', order: 1 },
    { key: 'berry' , name: 'きのみ'    , color: 'rgb(32, 212, 102)', order: basePokemon.value?.specialty == 'きのみ' ? 2 : 3 },
    { key: 'food'  , name: '食材'      , color: 'rgb(245, 183, 72)', order: basePokemon.value?.specialty == '食材'   ? 2 : 4 },
    { key: 'skill' , name: 'スキル'    , color: 'rgb(70, 159, 253)', order: basePokemon.value?.specialty == 'スキル' ? 2 : 5 },
  ]
  result.sort((a, b) => a.order - b.order)
  return result;
})

const saveDisabled = computed(() => {
  return basePokemon.value == null || !pokemon.lv
    || (pokemon.foodList.some(x => !x) && !kaihouPokemon.value)
    || (pokemon.subSkillList.some(x => !x) && !kaihouPokemon.value)
    || !pokemon.nature
})

async function save(requireContinue) {
  if (saveDisabled.value) {
    return;
  }

  let sanitizedPokemon = JSON.parse(JSON.stringify(pokemon));

  if (props.index == null) {
    PokemonBox.post(sanitizedPokemon, null, insertTo.value)

    if (requireContinue) {
      await loadBoxInfo()
      reset();
      $emit('input', true)

    } else {
      $emit('close', true);
    }
  } else {
    PokemonBox.post(sanitizedPokemon, props.index, insertTo.value)
    $emit('close', true);
  }
}

function deletePokemon() {
  if (confirm('このポケモンを削除します。よろしいですか？')) {
    PokemonBox.delete(props.index);
    $emit('close', true);
  }
}

const raderChart = computed(() => {
  return {
    data: {
      labels: [
        '総合',
        'スキル',
        '食材',
        'きのみ',
      ],
      datasets: [
        {
          label: '本個体',
          data: [65, 59, 90, 30],
          fill: true,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgb(255, 99, 132)',
          pointBackgroundColor: 'rgb(255, 99, 132)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(255, 99, 132)'
        },
        {
          label: '同種族',
          data: [28, 48, 40, 19],
          fill: true,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235)',
          pointBackgroundColor: 'rgb(54, 162, 235)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(54, 162, 235)'
        },
        {
          label: '同種族同食材',
          data: [18, 38, 30, 19],
          fill: true,
          backgroundColor: 'rgba(162, 235, 54, 0.2)',
          borderColor: 'rgb(162, 235, 54)',
          pointBackgroundColor: 'rgb(162, 235, 54)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(162, 235, 54)'
        }
      ]
    },
    options: {
      maintainAspectRatio: true,
      responsive: true,
      resizeDelay: 10,
      elements: {
        line: {
          borderWidth: 3
        }
      },
      scales: {
        r: {
          ticks: {
            stepSize: 20,
          }
        },
      }
    },
  }
})

// 表示時に名前入力欄にフォーカスをあわせる
onMounted(() => {
  nameInput.value.focus();
})

function reset() {
  pokemon.name = null;
  pokemon.lv = null;
  pokemon.bag = null;
  pokemon.skillLv = null;
  pokemon.foodList = ['', '', ''];
  pokemon.subSkillList = [null, null, null, null, null];
  pokemon.nature = null;
  pokemon.shiny = false;
  pokemon.memo = null;

  assist.name = '';
  assist.lv = null;
  assist.bag = null;
  assist.skillLv = null;
  assist.foodABC = '';
  assist.subSkillList = ['', '', '', '', ''];
  assist.nature = '';
  assist.shiny = false;

  insertTo.value = null;

  nameInput.value.focus();
}

function onEsc() {
  if(Object.values(pokemon).flat(1).some(v => v != null && v != '')) {
    reset();
  } else {
    $emit('close')
  }
}

function shareX() {
  let maxRate = null;
  if (selectResult.value?.evaluateResult?.max) {
    maxRate = Math.max(...Object.values(selectResult.value.evaluateResult?.max).map(x => x.rate));
  }

  let text = [
    `ポケモンスリープで「${pokemon.name ?? '?'}」を捕まえました！`,
    `食材: ${pokemonFoodABC.value}`,
    `サブスキル: ${pokemon.subSkillList.map(x => SubSkill.map[x]?.short ?? '?').join('/')}`,
    `せいかく: ${pokemon.nature ?? '?'}`,
    `厳選度: ${ maxRate != null ? (maxRate * 100).toFixed(1) : '?' }%`,
    `https://reimer0204.github.io/pokesle-simulator/`,
    `#ポケスリ #ポケモンスリープ`,
  ].join('\n');
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`)
}

function changeColor() {
  pokemon.shiny = !pokemon.shiny;
}

function moveFocus(event) {

  const inputElementList = [
    nameInput.value,
    lvInput.value,
    // bagInput.value,
    foodInput.value,
    ...subSkillInputList.value,
    natureInput.value,
  ]
  // console.log(inputElementList)
  const index = inputElementList.indexOf(event.target)
  if (event.key === 'Enter' || event.key === 'ArrowDown') {
    if (index + 1 >= inputElementList.length) {
      save(true);
    } else {
      inputElementList[index + 1].focus();
    }
    event.preventDefault();
  }
  if (event.key === 'ArrowUp') {
    if (index - 1 >= 0) {
      inputElementList[index - 1].focus();
    }
    event.preventDefault();
  }
}

</script>

<template>
  <PopupBase class="edit-pokemon-popup" @close="$emit('close')" @keydown.esc.stop="onEsc" @keydown.c.alt="changeColor">
    <template #headerText>ポケモン編集</template>

    <BaseAlert>
      入力アシスト欄を使用するとキーボードだけで入力可能です。<br>
      名前: ローマ字で入力可能　/　Enter: 次の欄に移動(せいかく欄でEnterすると保存)　/　ESC: 全てクリア<br>
      ※スキルLvは入力アシストの対象外のため注意
    </BaseAlert>

    <div class="edit-area mt-10px">
      <header>&nbsp;</header>
      <header>入力アシスト</header>
      <header>選択</header>

      <div>名前</div>
      <input
        type="text" ref="nameInput" v-model="assist.name" @keydown="moveFocus"
        placeholder="ローマ字/ひらがな/カタカナ"
      />
      <select v-model="pokemon.name" class="w-200px">
        <option v-for="pokemon in Pokemon.list" :value="pokemon.name">{{ pokemon.name }}</option>
      </select>

      <div>Lv</div>
      <input type="number" ref="lvInput" v-model="pokemon.lv" @keydown="moveFocus" />
      <input type="number" v-model="pokemon.lv"/>

      <div>食材</div>
      <input
        type="text" ref="foodInput" v-model="assist.foodABC" @keydown="moveFocus"
        placeholder="AAB"
      />
      <div>
        <div v-if="basePokemon" class="food-sample flex-row-start-center gap-5px">
          <div v-for="(food, i) in basePokemon.foodList" class="flex-row-start-center">
            <div>{{ String.fromCharCode(65 + i) }}:</div>
            <template v-if="food">
              <img :src="Food.map[food.name].img" />
            </template>
            <template v-else>-</template>
          </div>
        </div>
        <div class="flex-row-start-center gap-5px">
          <select v-for="i in 3" :value="pokemon.foodList[i - 1] ?? ''" @input="pokemon.foodList[i - 1] = $event.target.value || null" class="w-140px">
            <option value="" v-if="kaihouPokemon">未開放</option>
            <option v-for="food in foodSelectList[i - 1]" :value="food">
              <img :src="Food.map[food].img">
              {{ food }}
            </option>
          </select>
        </div>
      </div>

      <template v-for="(lv, i) in [10, 25, 50, 75, 100]">
        <div>サブスキル({{ lv }})</div>
        <input
          type="text" ref="subSkillInputList" v-model="assist.subSkillList[i]"
          @input="convertSubSkill(i)"
          @keydown="moveFocus"
          placeholder="ローマ字/ひらがな/カタカナ"
        />

        <div class="flex-row-start-center">
          <div class="w-40px text-align-right">{{ lv }}：</div>
          <select :value="pokemon.subSkillList[i] || ''" @input="pokemon.subSkillList[i] = $event.target.value || null">
            <option value="" v-if="kaihouPokemon">未開放</option>
            <option v-for="subSkill in subSkillNameSort" :value="subSkill.name">{{ subSkill.name }}</option>
          </select>
        </div>
      </template>

      <div>せいかく</div>
      <input
        type="text" ref="natureInput" v-model="assist.nature" @keydown="moveFocus"
          @input="convertNature"
        placeholder="ローマ字/ひらがな/カタカナ"
      />
      <select v-model="pokemon.nature">
        <option v-for="nature in Nature.list" :value="nature.name">{{ nature.name }}</option>
      </select>

      <div>所持数</div>
      <div></div>
      <!-- <input type="number" ref="bagInput" v-model="pokemon.bag" @keypress.enter="skillLvInput.focus()"/> -->
      <input type="number" v-model="pokemon.bag" :placeholder="basePokemon ? (basePokemon.bag + (basePokemon.evolveLv - 1) * 5) : '省略可'"/>

      <div>スキルLv</div>
      <div></div>
      <!-- <input type="number" ref="skillLvInput" v-model="pokemon.skillLv" @keypress.enter="foodInput.focus()"/> -->
      <input type="number" v-model="pokemon.skillLv" :placeholder="basePokemon ? basePokemon.evolveLv : '省略可'"/>

      <div>睡眠時間</div>
      <div></div>
      <!-- <input type="number" ref="skillLvInput" v-model="pokemon.skillLv" @keypress.enter="foodInput.focus()"/> -->
      <input type="number" v-model="pokemon.sleepTime" placeholder="省略可"/>


      <div>色違い</div>
      <div>Alt+Cで切り替え</div>
      <!-- <input type="number" ref="skillLvInput" v-model="pokemon.skillLv" @keypress.enter="foodInput.focus()"/> -->
      <label><input type="checkbox" v-model="pokemon.shiny" />色違い</label>
      
      <div>メモ</div>
      <div></div>
      <label><input class="w-100" type="text" v-model="pokemon.memo" placeholder="メモ"/></label>
      
      <div>所持アメ</div>
      <div></div>
      <label>
        <input v-if="basePokemon" class="w-100" type="number" v-model.number="config.candy.bag[basePokemon.candyName]" placeholder="アメ数"/>
        <input v-else class="w-100" type="number" disabled placeholder="アメ数"/>
      </label>
      
      <div>次のレベル<br>までのEXP</div>
      <div></div>
      <label>
        <input class="w-100" type="number" v-model.number="pokemon.nextExp" placeholder="次のレベルまであと"/>
      </label>
      
      <div>チームシミュ</div>
      <div></div>
      <select v-model="pokemon.fix">
        <option :value="null">候補対象</option>
        <option :value="1">固定</option>
        <option :value="-1">除外</option>
      </select>
      
      <div>追加先No</div>
      <div></div>
      <label>
        <input class="w-100" type="number" v-model.number="insertTo" placeholder="追加先No"/>
      </label>
    </div>

    <!-- 良い表示方法を検討中
    <ToggleArea class="mt-20px" open v-if="raderChart">
      <template #headerText>厳選情報(レーダーチャート)</template>

      <div class="flex-row gap-10px">
        <InputRadio v-model="config.pokemonEdit.rader.type" :value="0">レベルごとに表示</InputRadio>
        <InputRadio v-model="config.pokemonEdit.rader.type" :value="1">分野ごとに表示</InputRadio>
      </div>
      <div class="flex-row flex-wrap gap-10px">
        <div v-for="i in 4" class="flex-column-start-center" :key="i">
          <div>Lv30</div>
          <div class="position-relative w-350px h-350px"><Radar v-bind="raderChart" /></div>
        </div>
      </div>
    </ToggleArea>
    -->

    <ToggleArea class="mt-20px" open v-if="simulatedPokemonList && !kaihouPokemon">
      <template #headerText>厳選情報</template>

      <AsyncWatcherArea :asyncWatcher="selectAsyncWatcher" class="select-area">
        <div v-if="selectResult" style="overflow-x: auto; white-space: nowrap;">
          <table>
            <thead>
              <tr>
                <th></th>
                <th></th>
                <th
                  v-for="{ name, color } in selectResultColumns"
                  :colspan="selectLvList.length"
                  :style="{ backgroundColor: color }"
                >{{ name }}</th>
              </tr>
              <tr>
                <th>最終進化</th>
                <th></th>
                <template v-for="{ color } in selectResultColumns">
                  <th v-for="lv in selectLvList" class="text-align-right" :style="{ backgroundColor: color }">
                    <template v-if="lv == 'max'">最大</template>
                    <template v-else>Lv{{ lv }}</template>
                  </th>
                </template>
              </tr>
            </thead>
            <tbody>
              <template v-for="after in selectResult.base.afterList">
                <tr>
                  <th rowspan="3">{{ after }}</th>
                  <th>本個体</th>
                  <template v-for="{ key } in selectResultColumns">
                    <td v-for="lv in selectLvList"
                      :class="{ best: selectResult.evaluateResult?.[lv]?.best[key].score == selectResult.evaluateResult?.[lv]?.[after][key].score }"
                      class="text-align-right"
                    >
                      <template v-if="isNaN(selectResult.evaluateResult?.[lv]?.[after][key].score)">-</template>
                      <template v-else>{{ (selectResult.evaluateResult?.[lv]?.[after][key].score * 100).toFixed(1) }}%</template>
                    </td>
                  </template>
                </tr>
                <tr>
                  <th>同種族</th>
                  <template v-for="{ key } in selectResultColumns">
                    <td v-for="lv in selectLvList" class="text-align-right">
                      <template v-if="isNaN(selectResult.box?.[lv]?.[after]?.[key]?.same)">-</template>
                      <template v-else>{{ (selectResult.box?.[lv]?.[after]?.[key]?.same * 100).toFixed(1) }}%</template>
                    </td>
                  </template>
                </tr>
                <tr>
                  <th>同種族<br>同食材</th>
                  <template v-for="{ key } in selectResultColumns">
                    <td v-for="lv in selectLvList" class="text-align-right">
                      <template v-if="isNaN(selectResult.box?.[lv]?.[after]?.[key]?.food)">-</template>
                      <template v-else>{{ (selectResult.box?.[lv]?.[after]?.[key]?.food * 100).toFixed(1) }}%</template>
                    </td>
                  </template>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div v-else>せいかくまで入力すると表示されます</div>
      </AsyncWatcherArea>
    </ToggleArea>

    <div class="flex-row-start-center gap-10px mt-10px">
      <button v-if="props.index != null" class="important" @click="deletePokemon">削除</button>
      <div class="flex-110"></div>
      <div class="x" @click="shareX"><img src="../img/x.svg"></div>
      <button @click="save(true)" :disabled="saveDisabled" v-if="props.index == null">保存して続けて登録</button>
      <button @click="save(false)" :disabled="saveDisabled">保存</button>
    </div>
  </PopupBase>
</template>

<style lang="scss" scoped>
.edit-pokemon-popup {
  width: 780px;

  .edit-area {
    width: 100%;
    display: grid;
    grid-template-columns: max-content max-content max-content;
    align-items: center;
    gap: 5px;

    header {
      font-weight: bold;
      background-color: rgb(66, 85, 158);
      color: #FFF;
      padding: 3px 5px;
    }

    .food-sample {
      img {
        width: 24px;
      }
    }

    & > div:nth-child(3n + 1) {
      font-weight: bold;
    }

    select {
      width: 150px;
    }
  }

  .select-area {
    table {
      border-collapse: collapse;
      width: 100%;

      thead {
        tr {
          background-color: rgb(66, 85, 158);
          color: #FFF;
        }
      }

      tbody {
        tr {
          border-bottom: 1px #CCC solid;
        }
      }

      th, td {
        padding: 3px 5px;

        &.best {
          font-weight: bold;
        }
      }
    }
  }

  .x {
    background-color: #000;
    width: 24px;
    height: 24px;
    padding: 5px;
    border-radius: 50%;
  }

}
</style>