<script setup>
import Pokemon from '../data/pokemon';
import config from '../models/config';
import InputNumber from './form/input-number.vue';
import PopupBase from './util/popup-base.vue';

const $emit = defineEmits(['close']);

const seedPokemonList = computed(() => {
  let result = []
  for(const pokemon of Pokemon.list) {
    if (result.every(x => x.candyName != pokemon.candyName)) {
      result.push(pokemon)
    }
  }
  return result;
})

</script>

<template>
  <PopupBase @close="$emit('close')" bodyClass="flex-110">
    <template #headerText>リソース管理</template>

    <div class="flex-row-start-center gap-5px">
      <label>ゆめのかけら</label>
      <InputNumber v-model.number="config.candy.shard" placeholder="未入力の場合は無制限" />
    </div>
    <!-- <div class="flex-row-start-center gap-5px mt-10px">
      <label>ばんのうアメ</label>
      S: <input type="number" class="w-50px" v-model.number="config.candy.bag.s" placeholder="">
      M: <input type="number" class="w-50px" v-model.number="config.candy.bag.m" placeholder="">
      L: <input type="number" class="w-50px" v-model.number="config.candy.bag.l" placeholder="">
    </div> -->
    
    <SortableTable class="mt-10px" :dataList="seedPokemonList" :columnList="[
      { key: 'type', name: 'タイプ' },
      { key: 'candyName', name: 'アメ名' },
      { key: 'num', name: 'アメ数', template: 'candy', convert: data => config.candy.bag[data.candyName] },
    ]" scroll>
      <template #candy="{ data }">
        <input type="number" class="w-80px" v-model.number="config.candy.bag[data.candyName]" />
      </template>
    </SortableTable>

  </PopupBase>
</template>

<style lang="scss" scoped>
.popup-base {
  display: flex;
  flex-direction: column;
  width: 900px;
  flex: 1 1 0;
  height: 100%;

  .sortable-table {
    flex: 1 1 0;
    height: 100px;
  }

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