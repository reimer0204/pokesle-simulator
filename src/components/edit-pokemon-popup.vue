<script setup>
import PopupBase from './popup-base.vue';
import Pokemon from '../data/pokemon';
import Food from '../data/food';
import SubSkill from '../data/sub-skill';
import Nature from '../data/nature';
import convertRomaji from '../models/utils/convert-romaji';
import PokemonBox from '../models/pokemon-box';

const props = defineProps({
  index: { type: Number }
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

let assist = reactive({
  name: null,
  lv: null,
  bag: null,
  skillLv: null,
  foodABC: null,
  subSkillList: [null, null, null, null, null],
  nature: null,
});

// 編集ならデフォルト値を設定
if (props.index != null) {
  pokemon = reactive(JSON.parse(JSON.stringify(PokemonBox.list[props.index])))

  assist.name = pokemon.name;
  assist.lv = pokemon.lv;
  assist.bag = pokemon.bag;
  assist.skillLv = pokemon.skillLv;
  assist.foodABC = pokemon.foodList.map(f => String.fromCharCode(65 + Math.max(basePokemon.value.foodList.findIndex(x => x.name == f), 0))).join('')
  assist.subSkillList = [...pokemon.subSkillList]
  assist.nature = pokemon.nature
}

let subSkillNameSort = SubSkill.list.toSorted((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0)


const foodSelectList = computed(() => {
  if (basePokemon.value == null) return [[], [], []];
  return [
    basePokemon.value.foodList.map(x => x?.name).slice(0, 1).filter(x => x),
    basePokemon.value.foodList.map(x => x?.name).slice(0, 2).filter(x => x),
    basePokemon.value.foodList.map(x => x?.name).slice(0, 3).filter(x => x),
  ]
})

function inferName(name) {
  // ローマ字をカタカナに、ひらがなをカタカナに変換
  name = convertRomaji(name)
    .replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60));

  let matchPokemonList = Pokemon.list.filter(x => x.name.includes(name))
  if (matchPokemonList.length) {
    matchPokemonList.sort((a, b) => Math.abs(a.name.length - name.length) - Math.abs(b.name.length - name.length))
    pokemon.name = matchPokemonList[0].name;
  }
}
watch(() => assist.name, inferName)

function convertFoodABC() {
  if (basePokemon.value == null || assist.foodABC == null) return;

  assist.foodABC.slice(0, 3).split('').forEach((letter, i) => {
    let foodIndex = Math.min(Math.max(letter.toUpperCase().charCodeAt(0) - 65, 0), 2);
    pokemon.foodList[i] = basePokemon.value.foodList[foodIndex].name;
  })
}
watch(() => assist.foodABC, convertFoodABC)

function convertSubSkill(index) {
  if (assist.subSkillList[index] == null) return;

  let name = convertRomaji(assist.subSkillList[index])
    .toUpperCase()
    .replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60));
  let regexp = new RegExp(name.split('').join('.*'))

  let match = SubSkill.listForInput.find(x => regexp.test(x.katakana))
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
  return basePokemon.value == null || !pokemon.lv || pokemon.foodList.some(x => !x) || pokemon.subSkillList.some(x => !x) || !pokemon.nature
})

function save(requireContinue) {
  if (saveDisabled.value) {
    return;
  }

  let sanitizedPokemon = JSON.parse(JSON.stringify(pokemon));

  if (props.index == null) {
    PokemonBox.post(sanitizedPokemon)

    if (requireContinue) {
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

onMounted(() => {
  nameInput.value.focus();
})

</script>

<template>
  <PopupBase class="edit-pokemon-popup" @close="$emit('close')">
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
      <select v-model="pokemon.name">
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
          <div v-for="(abc, i) in ['A', 'B', 'C']" class="flex-row-start-center">
            <div>{{ abc }}:</div>
            <template v-if="basePokemon.foodList[i]">
              <img :src="Food.map[basePokemon.foodList[i].name].img" />
            </template>
            <template v-else>-</template>
          </div>
        </div>
        <template v-for="i in 3">
          <select v-model="pokemon.foodList[i - 1]">
            <option v-for="food in foodSelectList[i - 1]" :value="food">{{ food }}</option>
          </select>
        </template>
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
          <select v-model="pokemon.subSkillList[i]">
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
      <input type="number" v-model="pokemon.bag" placeholder="省略可"/>

      <div>スキルLv</div>
      <div></div>
      <!-- <input type="number" ref="skillLvInput" v-model="pokemon.skillLv" @keypress.enter="foodInput.focus()"/> -->
      <input type="number" v-model="pokemon.skillLv" placeholder="省略可"/>

      <div>色違い</div>
      <div></div>
      <!-- <input type="number" ref="skillLvInput" v-model="pokemon.skillLv" @keypress.enter="foodInput.focus()"/> -->
      <label><input type="checkbox" v-model="pokemon.shiny" />色違い</label>

    </div>


    <div class="flex-row-start-center gap-10px mt-10px">
      <button v-if="props.index != null" class="important" @click="deletePokemon">削除</button>
      <div class="flex-110"></div>
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
      background-color: rgb(54, 73, 150);
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

}
</style>