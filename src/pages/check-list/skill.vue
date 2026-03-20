<script setup lang="ts">
import SortableTable from '../../components/sortable-table.vue';
import AsyncWatcherArea from '../../components/util/async-watcher-area.vue';
import config from '../../models/config.js';
import PokemonInfo from './pokemon-info.vue';
import TablePopup from '@/components/table-popup.vue';
import Popup from '@/models/popup/popup.ts';

const props = defineProps({
  skillCheckList: {
    type: Object as () => Record<string, any>,
    required: true,
  },
})

function openBoxList(data: any) {
  Popup.show(TablePopup, data.table);
}

</script>

<template>
  <div class="page">
    <div class="pokemon-list">
      <AsyncWatcherArea :asyncWatcher="asyncWatcher" class="flex-110 flex-column">
        <SortableTable
          class="flex-110"
          :dataList="skillCheckList.dataList"
          :columnList="skillCheckList.columnList"
          scroll
        >
          <template #pokemon="{ value }">
            <PokemonInfo :pokemon="value" nature />
          </template>
          <template #foodList="{ data, value }">
            <FoodList :pokemon="data" />
          </template>
          <template #food="{ data, value }">
            <img :src="data.food.img" class="w-20px h-20px" />{{ data.food.name }}
          </template>
          <template #berry="{ data, value }">
            <img :src="data.base.berry.img" class="w-20px h-20px" />{{ data.base.berry.name }}
          </template>
          <template #border="{ data, value }">
            {{ data.bestFoodScore.toFixed(1) }} ✕ {{ config.summary.checklist.food.borderValue }}% = {{ (data.bestFoodScore * (config.summary.checklist.food.borderValue / 100)).toFixed(1) }}
          </template>
          <template #skillBorder="{ data, value }">
            {{ data.bestSkillScore.toFixed(1) }} ✕ {{ config.summary.checklist.skill.borderValue }}% = {{ (data.bestSkillScore * (config.summary.checklist.skill.borderValue / 100)).toFixed(1) }}
          </template>
          <template #score="{ data, value }">
            <div class="flex-column-center-end">
              {{ data.score.toFixed(1) }}
              <div v-if="data.lv != data.borderLv">({{ data.lv }}止め)</div>
            </div>
          </template>
          <template #table="{ data, value }">
            <div @click="openBoxList(data)" class="link">ボックス確認</div>
          </template>
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