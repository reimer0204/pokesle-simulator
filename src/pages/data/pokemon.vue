<script setup>
import Pokemon from '../../data/pokemon';
import Berry from '../../data/berry';
import { Food, Cooking } from '../../data/food_and_cooking';

const pokemonListLastOnly = ref(false);
const pokemonList = computed(() => {
  if (pokemonListLastOnly.value) {
    return Pokemon.list.filter(pokemon => pokemon.afterList.length == 1 && pokemon.afterList[0] == pokemon.name)
  } else {
    return Pokemon.list;
  }
})
</script>

<template>
  <div class="page">
    <div>
      出典
      <ul>
        <li>ポケモンスリープ攻略・検証Wiki (<a href="https://wikiwiki.jp/poke_sleep/" target="_blank">https://wikiwiki.jp/poke_sleep/</a>)</li>
        <li>RP Collection (<a href="https://docs.google.com/spreadsheets/d/1kBrPl0pdAO8gjOf_NrTgAPseFtqQA27fdfEbMBBeAhs" target="_blank">https://docs.google.com/spreadsheets/d/1kBrPl0pdAO8gjOf_NrTgAPseFtqQA27fdfEbMBBeAhs</a>)</li>
      </ul>
    </div>

    <div class="flex-row-start-center gap-10px">
      <label><input type="checkbox" v-model="pokemonListLastOnly" />最終進化のみ</label>
    </div>

    <div class="scroll">
      <SortableTable class="pokemon-list" :dataList="pokemonList" :columnList="[
        { key: 'name', name: '名前' },
        { key: 'specialty', name: 'とくい' },
        { key: 'berry', name: 'きのみ' },
        { key: 'type', name: 'タイプ', convert: data => Berry.map[data.berry].type },
        { key: 'food1', name: 'A', template: 'food', convert: data => data.foodList[0]?.name },
        { key: 'food2', name: 'B', template: 'food', convert: data => data.foodList[1]?.name },
        { key: 'food3', name: 'C', template: 'food', convert: data => data.foodList[2]?.name },
        { key: 'food1num1', name: 'A1', convert: data => data.foodList[0]?.numList?.[0], type: Number },
        { key: 'food1num2', name: 'A2', convert: data => data.foodList[0]?.numList?.[1], type: Number },
        { key: 'food1num3', name: 'A3', convert: data => data.foodList[0]?.numList?.[2], type: Number },
        { key: 'food2num2', name: 'B2', convert: data => data.foodList[1]?.numList?.[1], type: Number },
        { key: 'food2num3', name: 'B3', convert: data => data.foodList[1]?.numList?.[2], type: Number },
        { key: 'food3num3', name: 'C3', convert: data => data.foodList[2]?.numList?.[2], type: Number },
        { key: 'foodRate', name: '食材確率', percent: true },
        { key: 'skill', name: 'スキル' },
        { key: 'skillRate', name: 'スキル\n確率', percent: true, fixed: 2 },
        { key: 'ceil', name: 'スキル\n天井', type: Number, convert: data => data.specialty == 'スキル' ? 144000 / data.help : 78, fixed: 0 },
        { key: 'skillRate2', name: 'スキル確率\n(天井込)', convert: data => data.skillRate / (1 - (1 - data.skillRate) ** data.ceil), percent: true, fixed: 2 },
        { key: 'bag', name: '所持数', type: Number },
        { key: 'help', name: 'おてつだい\n時間', type: Number },
        { key: 'skillNum', name: 'スキル/日\n(げんき0)', type: Number, convert: data => data.skillRate2 * 86400 / data.help, fixed: 2 },
        { key: 'afterList', name: '最終進化' },
      ]" :fixColumn="1">
        <template #food="{ data, value }">
          <img v-if="value" :src="Food.map[value].img" />
        </template>
        <template #afterList="{ data }">
          {{ data.afterList.join('/') }}
        </template>
      </SortableTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;

  min-height: 0;

  .scroll {
    flex: 1 1 0;
    min-height: 0;
    overflow: auto;
  }

  .pokemon-list {
    img {
      width: 24px;
      height: 24px;
    }
  }
}
</style>