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
      const result = {
        name: fieldName,
        'うとうと': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'うとうと')),
        'すやすや': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'すやすや')),
        'ぐっすり': pokemonList.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'ぐっすり')),
        'うとうと全員': Pokemon.list.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'うとうと')),
        'すやすや全員': Pokemon.list.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'すやすや')),
        'ぐっすり全員': Pokemon.list.filter(x => x.fieldList.some(x => x.name == fieldName && x.type == 'ぐっすり')),
      }
      result['うとうと対象率'] = result['うとうと'].length / Math.max(1, result['うとうと全員'].length);
      result['すやすや対象率'] = result['すやすや'].length / Math.max(1, result['すやすや全員'].length);
      result['ぐっすり対象率'] = result['ぐっすり'].length / Math.max(1, result['ぐっすり全員'].length);
      return result;
    }),
    columnList: [
      { key: 'name', name: 'フィールド' },
      { key: 'type1', name: 'うとうと', type: String, convert: x => x['うとうと'].map(p => p.name).join('\n') },
      { key: 'type2', name: 'すやすや', type: String, convert: x => x['すやすや'].map(p => p.name).join('\n') },
      { key: 'type3', name: 'ぐっすり', type: String, convert: x => x['ぐっすり'].map(p => p.name).join('\n') },
      { key: 'type1_num', name: 'うとうと\n対象率', type: Number, percent: true, convert: x => x['うとうと対象率'] },
      { key: 'type2_num', name: 'すやすや\n対象率', type: Number, percent: true, convert: x => x['すやすや対象率'] },
      { key: 'type3_num', name: 'ぐっすり\n対象率', type: Number, percent: true, convert: x => x['ぐっすり対象率'] },
      { key: 'ave', name: '平均対象率', type: Number, percent: true, convert: x => (x['うとうと対象率'] + x['すやすや対象率'] + x['ぐっすり対象率']) / 3 },
      { key: 'mean', name: '相乗平均対象率', type: Number, percent: true, convert: x => (x['うとうと対象率'] * x['すやすや対象率'] * x['ぐっすり対象率']) ** (1/3) },
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