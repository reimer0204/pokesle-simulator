<script setup lang="ts">
import { Food } from '@/data/food_and_cooking.js';
import SortableTable from '../../components/sortable-table.vue';
import AsyncWatcherArea from '../../components/util/async-watcher-area.vue';
import config from '../../models/config.js';
import PokemonInfo from './pokemon-info.vue';
import TablePopup from '@/components/table-popup.vue';
import Popup from '@/models/popup/popup.ts';

const props = defineProps({
  foodCheckList: {
    type: Object as () => Record<string, any>,
    required: true,
  },
  promisedEvaluateTable: {
    type: Object as () => Record<string, any>,
    required: true,
  },
})

let lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))

if (config.summary.checklist.food.borderLv == null || !lvList.includes(config.summary.checklist.food.borderLv)) {
  config.summary.checklist.food.borderLv = lvList.filter(x => x >= 60)[0] ?? lvList.at(-1);
}

function openBoxList(data: any) {
  Popup.show(TablePopup, data.table);
}

</script>

<template>
  <div class="page">
    <div class="tab-list">
      <router-link to="/check-list/food">チェックリスト</router-link>
      <template v-for="food in Food.list" :key="food.name">
        <router-link :to="`/check-list/food/${food.name}`">{{ food.name }}</router-link>
      </template>
    </div>

    <router-view
      :foodCheckList="foodCheckList"
      :promisedEvaluateTable="promisedEvaluateTable"
      class="mt-10px flex-110"
    />

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
  flex-wrap: wrap;
  border-bottom: 3px #CCC solid;
  gap: 5px 0;

  & > a {
    padding: 5px 15px;
    text-decoration: none;
    color: inherit;
    border-bottom: 3px #CCC solid;
    margin-bottom: -3px;

    &.router-link-exact-active {
      font-weight: bold;
      border-bottom: 3px #08C solid;
      color: #08C;
    }
  }
}

</style>