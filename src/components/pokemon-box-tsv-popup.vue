<script setup>
import Pokemon from '../data/pokemon';
import config from '../models/config';
import PokemonBox from '../models/pokemon-box/pokemon-box';
import PopupBase from './util/popup-base.vue';
import SettingList from './util/setting-list.vue';

const $emit = defineEmits(['close']);

const exportText = ref('');
const importText = ref('');

function exportList() {
  let columnNum = Math.max(...Object.values(config.pokemonBox.tsv).flat(1).filter(x => x))

  exportText.value = PokemonBox.list.map(pokemon => {
    let base = Pokemon.map[pokemon.name];
    let arr = new Array(columnNum).fill('');

    if(config.pokemonBox.tsv.name) arr[config.pokemonBox.tsv.name - 1] = pokemon.name;
    if(config.pokemonBox.tsv.lv) arr[config.pokemonBox.tsv.lv - 1] = pokemon.lv;
    if(config.pokemonBox.tsv.bag) arr[config.pokemonBox.tsv.bag - 1] = pokemon.bag;
    if(config.pokemonBox.tsv.skillLv) arr[config.pokemonBox.tsv.skillLv - 1] = pokemon.skillLv;
    if(config.pokemonBox.tsv.foodABC) {
      arr[config.pokemonBox.tsv.foodABC - 1] = pokemon.foodList
        .map(x => String.fromCharCode(Math.max(base.foodList.findIndex(y => y.name == x), 0) + 65)).join('');
    }
    for(let i = 0; i < 3; i++) {
      if(config.pokemonBox.tsv.foodList[i]) arr[config.pokemonBox.tsv.foodList[i] - 1] = pokemon.foodList[i];
    }
    for(let i = 0; i < 5; i++) {
      if(config.pokemonBox.tsv.subSkillList[i]) arr[config.pokemonBox.tsv.subSkillList[i] - 1] = pokemon.subSkillList[i];
    }
    if(config.pokemonBox.tsv.nature) arr[config.pokemonBox.tsv.nature - 1] = pokemon.nature;
    if(config.pokemonBox.tsv.shiny) arr[config.pokemonBox.tsv.shiny - 1] = pokemon.shiny ? 1 : '';
    if(config.pokemonBox.tsv.fix) arr[config.pokemonBox.tsv.fix - 1] = pokemon.fix;
    if(config.pokemonBox.tsv.sleepTime) arr[config.pokemonBox.tsv.sleepTime - 1] = pokemon.sleepTime;
    if(config.pokemonBox.tsv.training) arr[config.pokemonBox.tsv.training - 1] = pokemon.training;
    if(config.pokemonBox.tsv.nextExp) arr[config.pokemonBox.tsv.nextExp - 1] = pokemon.nextExp;
    if(config.pokemonBox.tsv.memo) arr[config.pokemonBox.tsv.memo - 1] = pokemon.memo;

    return arr.join('\t');
  }).join('\n')
  
  // PokemonBox.import(importText.value);
  // $emit('close', true)
}

function importList() {
  PokemonBox.import(importText.value);
  $emit('close', true)
}

</script>

<template>
  <PopupBase @close="$emit('close')">
    <template #headerText>TSVインポート/エクスポート</template>

    <h2>列番号設定</h2>
    列番号を空にするとインポート・エクスポートの対象外となり、特にインポート時は情報が欠損することになるので注意してください。

    <SettingList class="mt-10px">
      <div><label>名前</label><input type="number" v-model="config.pokemonBox.tsv.name" placeholder="なし"></div>
      <div><label>Lv</label><input type="number" v-model="config.pokemonBox.tsv.lv" placeholder="なし"></div>
      <div><label>所持数</label><input type="number" v-model="config.pokemonBox.tsv.bag" placeholder="なし"></div>
      <div><label>スキルLv</label><input type="number" v-model="config.pokemonBox.tsv.skillLv" placeholder="なし"></div>
      <div><label>食材ABC</label><input type="number" v-model="config.pokemonBox.tsv.foodABC" placeholder="なし"></div>
      <div><label>食材1</label><input type="number" v-model="config.pokemonBox.tsv.foodList[0]" placeholder="なし"></div>
      <div><label>食材2</label><input type="number" v-model="config.pokemonBox.tsv.foodList[1]" placeholder="なし"></div>
      <div><label>食材3</label><input type="number" v-model="config.pokemonBox.tsv.foodList[2]" placeholder="なし"></div>
      <div><label>サブスキル1</label><input type="number" v-model="config.pokemonBox.tsv.subSkillList[0]" placeholder="なし"></div>
      <div><label>サブスキル2</label><input type="number" v-model="config.pokemonBox.tsv.subSkillList[1]" placeholder="なし"></div>
      <div><label>サブスキル3</label><input type="number" v-model="config.pokemonBox.tsv.subSkillList[2]" placeholder="なし"></div>
      <div><label>サブスキル4</label><input type="number" v-model="config.pokemonBox.tsv.subSkillList[3]" placeholder="なし"></div>
      <div><label>サブスキル5</label><input type="number" v-model="config.pokemonBox.tsv.subSkillList[4]" placeholder="なし"></div>
      <div><label>せいかく</label><input type="number" v-model="config.pokemonBox.tsv.nature" placeholder="なし"></div>
      <div><label>色違い</label><input type="number" v-model="config.pokemonBox.tsv.shiny" placeholder="なし"></div>
      <div><label>固定</label><input type="number" v-model="config.pokemonBox.tsv.fix" placeholder="なし"></div>
      <div><label>睡眠時間</label><input type="number" v-model="config.pokemonBox.tsv.sleepTime" placeholder="なし"></div>
      <div><label>目標Lv</label><input type="number" v-model="config.pokemonBox.tsv.training" placeholder="なし"></div>
      <div><label>次Lv迄のExp</label><input type="number" v-model="config.pokemonBox.tsv.nextExp" placeholder="なし"></div>
      <div><label>メモ</label><input type="number" v-model="config.pokemonBox.tsv.memo" placeholder="なし"></div>
    </SettingList>

    <div class="flex-row gap-10px mt-10px">
      <div class="flex-column gap-5px flex-110">
        <button @click="exportList">エクスポート</button>
        <textarea v-model="exportText"></textarea>
      </div>
      <div class="vr"></div>
      <div class="flex-column gap-5px flex-110">
        <textarea v-model="importText"></textarea>
        <button @click="importList" :disabled="importText.length == 0">インポート</button>
      </div>
    </div>

  </PopupBase>
</template>

<style lang="scss" scoped>
.popup-base {
  width: 900px;

  .setting-list {
    input {
      width: 60px;
    }
  }

  textarea {
    height: 500px;
  }

  .vr {
    width: 1px;
    background-color: #888;
  }
}
</style>