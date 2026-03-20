<script setup lang="ts">
import Field from '@/data/field.js';
import SortableTable from '../../components/sortable-table.vue';
import AsyncWatcherArea from '../../components/util/async-watcher-area.vue';
import config from '../../models/config.js';
import Pokemon from '@/data/pokemon.ts';

const props = defineProps({
  pokemonCheckList: {
    type: Object as () => Record<string, any>,
    required: true,
  },
  foodCheckList: {
    type: Object as () => Record<string, any>,
    required: true,
  },
  skillCheckList: {
    type: Object as () => Record<string, any>,
    required: true,
  },
})

const fieldList = computed(() => {
  const targetPokemonSet = new Set([
    ...props.pokemonCheckList.targetPokemonList,
    ...props.foodCheckList.targetPokemonList,
    ...props.skillCheckList.targetPokemonList,
  ]);

  let pokemonList = Pokemon.list.filter(pokemon => {
    if (!config.summary.checklist.field.shinkago && pokemon.evolve.before != null) return false;

    for(const after of pokemon.afterList) {
      if (targetPokemonSet.has(after)) {
        return true;
      }
    }

    return false;
  }).map(pokemon => ({
    ...pokemon,
  }))

  if (config.summary.checklist.field.bakecchaMatome && pokemonList.some(x => x.name.startsWith('バケッチャ'))) {
    const bakecchaList = pokemonList.filter(x => x.name.startsWith('バケッチャ'));
    pokemonList = pokemonList.filter(x => !x.name.startsWith('バケッチャ'));
    pokemonList.push({
      ...bakecchaList[0],
      name: 'バケッチャ',
    })
  }

  return {
    dataList: [
      ...Field.list.map(x => x.name),
      ...Field.list.filter(x => x.ex).map(x => `${x.name}EX`),
    ].map(fieldName => {
      return {
        name: fieldName,
        'うとうと': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'うとうと')),
        'すやすや': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'すやすや')),
        'ぐっすり': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'ぐっすり')),
      }
    }),
    columnList: [
      { key: 'name', name: 'フィールド' },
      { key: 'type1', name: 'うとうと', type: String, convert: x => x['うとうと'].map(p => p.name).join('\n') },
      { key: 'type2', name: 'すやすや', type: String, convert: x => x['すやすや'].map(p => p.name).join('\n') },
      { key: 'type3', name: 'ぐっすり', type: String, convert: x => x['ぐっすり'].map(p => p.name).join('\n') },
      { key: 'type1_num', name: 'うとうと(匹)', type: Number, convert: x => x['うとうと'].length },
      { key: 'type2_num', name: 'すやすや(匹)', type: Number, convert: x => x['すやすや'].length },
      { key: 'type3_num', name: 'ぐっすり(匹)', type: Number, convert: x => x['ぐっすり'].length },
      { key: 'num', name: '合計(匹)', type: Number, convert: x => x['うとうと'].length + x['すやすや'].length + x['ぐっすり'].length },
      { key: 'ave', name: '相乗平均(匹)', type: Number, fixed: 1, convert: x => (x['うとうと'].length * x['すやすや'].length * x['ぐっすり'].length) ** (1/3) },
    ],
  }
})

</script>

<template>
  <div class="page">
    <div class="pokemon-list">
      <AsyncWatcherArea :asyncWatcher="asyncWatcher" class="flex-110 flex-column">
        <SortableTable
          class="flex-110"
          :dataList="fieldList.dataList"
          :columnList="fieldList.columnList"
          scroll
        >
        </SortableTable>
      </AsyncWatcherArea>
    </div>

  </div>
</template>

<style lang="scss" scoped>

.page {
  display: flex;
  flex-direction: column;
  padding-bottom: 10px;

  .scroll-x {
    overflow-x: scroll;
  }

  .pokemon-list {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
  }
}

.caution {
  color: yellow;
}

.tab-list {
  display: flex;
  border-bottom: 3px #CCC solid;

  & > div {
    padding: 5px 15px;
    text-decoration: none;
    color: inherit;

    &.active {
      font-weight: bold;
      border-bottom: 3px #08C solid;
      margin-bottom: -3px;
      color: #08C;
    }
  }
}

</style>