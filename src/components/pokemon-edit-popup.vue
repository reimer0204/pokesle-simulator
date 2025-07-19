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

let evaluateTable = EvaluateTable.load(config);

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
})

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

let selectResult = ref(null);
let selectLvList = ['max', ...Object.entries(config.selectEvaluate.levelList).flatMap(([lv, v]) => v ? [lv] : []).sort()]

watch(pokemon, async () => {
  await boxLoading;

  try {
    PokemonBox.check(pokemon)
    selectAsyncWatcher.run(async (progressCounter) => {
      await singleMultiWorker.call(
        null,
        () => ({ type: 'config', config: JSON.parse(JSON.stringify(config)) })
      )

      selectResult.value = (await singleMultiWorker.call(
        progressCounter,
        () => {
          return {
            type: 'basic',
            pokemonList: [JSON.parse(JSON.stringify(pokemon))],
            evaluateTable,
          }
        }
      )).flat(1)[0];

      if (simulatedPokemonList.value) {
        selectResult.value.box = {};
        for(let selectLv of selectLvList) {
          selectResult.value.box[selectLv] = {};
          for(let after of selectResult.value.base.afterList) {
            let targetList = simulatedPokemonList.value.filter(x => x.evaluateResult?.[selectLv]?.[after]?.score != null);
            let sameFoodTargetList = targetList.filter(x => x.box?.foodList.every((f, i) => pokemon.foodList[i] == f.name))

            let sameList = targetList.map(x => x.evaluateResult?.[selectLv]?.[after]?.score);
            let sameListSpecialty = targetList.map(x => x.evaluateSpecialty?.[selectLv]?.[after]?.score);
            let sameFoodList = sameFoodTargetList.map(x => x.evaluateResult?.[selectLv]?.[after]?.score);
            let sameFoodListSpecialty = sameFoodTargetList.map(x => x.evaluateSpecialty?.[selectLv]?.[after]?.score);

            selectResult.value.box[selectLv][after] = {
              same: sameList.length ? Math.max(...sameList) : null,
              food: sameFoodList.length ? Math.max(...sameFoodList) : null,
              sameSpecialty: sameListSpecialty.length ? Math.max(...sameListSpecialty) : null,
              foodSpecialty: sameFoodListSpecialty.length ? Math.max(...sameFoodListSpecialty) : null,
            }
          }
        }
      }

      // console.log(selectResult.value);
    })
  } catch(e) {
    selectResult.value = null;
    // console.log(e);
    // ignore
  }

}, {
  immediate: true,
})

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

let subSkillNameSort = SubSkill.list.toSorted((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0)

const foodSelectList = computed(() => {
  if (basePokemon.value == null) return [[], [], []];
  return [
    basePokemon.value.foodList.filter(x => x?.name && x.numList[0]).map(x => x?.name),
    basePokemon.value.foodList.filter(x => x?.name && x.numList[1]).map(x => x?.name),
    basePokemon.value.foodList.filter(x => x?.name && x.numList[2]).map(x => x?.name),
  ]
})

function inferName(name) {
  // ローマ字をカタカナに、ひらがなをカタカナに変換
  const regexp = new RegExp(
    convertRomaji(name)
    .replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60))
    .split('').map(x => '^$\\.*+?()[]{}|'.includes(x) ? `\\${x}` : x).join('.*')
  );

  let matchPokemonList = Pokemon.list.map(pokemon => {
    let result = regexp.exec(pokemon.name)
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
    PokemonBox.post(sanitizedPokemon)

    if (requireContinue) {
      await loadBoxInfo()
      reset();
      $emit('input', true)

    } else {
      $emit('close', true);
    }
  } else {
    PokemonBox.post(sanitizedPokemon, props.index)
    $emit('close', true);
  }
}

function deletePokemon() {
  if (confirm('このポケモンを削除します。よろしいですか？')) {
    PokemonBox.delete(props.index);
    $emit('close', true);
  }
}

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

  assist.name = '';
  assist.lv = null;
  assist.bag = null;
  assist.skillLv = null;
  assist.foodABC = '';
  assist.subSkillList = ['', '', '', '', ''];
  assist.nature = '';
  assist.shiny = false;

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

</script>

<template>
  <PopupBase class="edit-pokemon-popup" @close="$emit('close')" @keydown.esc.stop="onEsc" @keydown.c.alt="changeColor">
    <template #headerText>ポケモン編集</template>

    <BaseAlert>
      キーボードだけで入力可能です。<br>
      「raru」まで入れると「ラルトス」が出てきたりするので、入れたいデータが出てきたらエンターキーで次の入力欄に移動し、続けて情報を入力してください。<br>
      せいかくまで入力した状態でエンターすると保存され、新規登録の場合は次の新規登録が始まります。<br>
      所持数とスキルLv、色違いはキーボード入力の対象外なので、進化後の直取り個体や、金種を与えた個体については別途右列の情報を直接操作してください。
    </BaseAlert>

    <div class="edit-area mt-10px">
      <header>&nbsp;</header>
      <header>入力アシスト</header>
      <header>選択</header>

      <div>名前</div>
      <input
        type="text" ref="nameInput" v-model="assist.name" @keypress.enter="lvInput.focus()"
        placeholder="ローマ字/ひらがな/カタカナ"
      />
      <select v-model="pokemon.name" class="w-200px">
        <option v-for="pokemon in Pokemon.list" :value="pokemon.name">{{ pokemon.name }}</option>
      </select>

      <div>Lv</div>
      <input type="number" ref="lvInput" v-model="pokemon.lv" @keypress.enter="foodInput.focus()"/>
      <input type="number" v-model="pokemon.lv"/>

      <div>食材</div>
      <input
        type="text" ref="foodInput" v-model="assist.foodABC" @keypress.enter="subSkillInputList[0].focus()"
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
          @keypress.enter="i < 4 ? subSkillInputList[i + 1].focus() : natureInput.focus()"
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
        type="text" ref="natureInput" v-model="assist.nature" @keypress.enter="save(true)"
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
    </div>

    <ToggleArea class="mt-20px" open v-if="simulatedPokemonList && !kaihouPokemon">
      <template #headerText>厳選情報</template>

      <AsyncWatcherArea :asyncWatcher="selectAsyncWatcher" class="select-area">
        <table v-if="selectResult">
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th :colspan="selectLvList.length + 1">総合スコア</th>
              <th :colspan="selectLvList.length + 1">得意分野</th>
            </tr>
            <tr>
              <th>最終進化</th>
              <th></th>
              <th v-for="lv in selectLvList" class="text-align-right">
                <template v-if="lv == 'max'">最大</template>
                <template v-else>Lv{{ lv }}</template>
              </th>
              <th v-for="lv in selectLvList" class="text-align-right">
                <template v-if="lv == 'max'">最大</template>
                <template v-else>Lv{{ lv }}</template>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="after in selectResult.base.afterList">
              <tr>
                <th rowspan="3">{{ after }}</th>
                <th>本個体</th>
                <td v-for="lv in selectLvList"
                  :class="{ best: selectResult.evaluateResult?.[lv]?.best.score == selectResult.evaluateResult?.[lv]?.[after].score }"
                  class="text-align-right"
                >
                  <template v-if="isNaN(selectResult.evaluateResult?.[lv]?.[after].score)">-</template>
                  <template v-else>{{ (selectResult.evaluateResult?.[lv]?.[after].score * 100).toFixed(1) }}%</template>
                </td>
                <td v-for="lv in selectLvList"
                  :class="{ best: selectResult.evaluateResult?.[lv]?.best.score == selectResult.evaluateResult?.[lv]?.[after].score }"
                  class="text-align-right"
                >
                  <template v-if="isNaN(selectResult.evaluateSpecialty?.[lv]?.[after].score)">-</template>
                  <template v-else>{{ (selectResult.evaluateSpecialty?.[lv]?.[after].score * 100).toFixed(1) }}%</template>
                </td>
              </tr>
              <tr>
                <th>同種族</th>
                <td v-for="lv in selectLvList" class="text-align-right">
                  <template v-if="isNaN(selectResult.box?.[lv]?.[after].same)">-</template>
                  <template v-else>{{ (selectResult.box?.[lv]?.[after].same * 100).toFixed(1) }}%</template>
                </td>
                <td v-for="lv in selectLvList" class="text-align-right">
                  <template v-if="isNaN(selectResult.box?.[lv]?.[after].sameSpecialty)">-</template>
                  <template v-else>{{ (selectResult.box?.[lv]?.[after].sameSpecialty * 100).toFixed(1) }}%</template>
                </td>
              </tr>
              <tr>
                <th>同種族<br>同食材</th>
                <td v-for="lv in selectLvList" class="text-align-right">
                  <template v-if="isNaN(selectResult.box?.[lv]?.[after].food)">-</template>
                  <template v-else>{{ (selectResult.box?.[lv]?.[after].food * 100).toFixed(1) }}%</template>
                </td>
                <td v-for="lv in selectLvList" class="text-align-right">
                  <template v-if="isNaN(selectResult.box?.[lv]?.[after].foodSpecialty)">-</template>
                  <template v-else>{{ (selectResult.box?.[lv]?.[after].foodSpecialty * 100).toFixed(1) }}%</template>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
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
  width: 770px;

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