<script setup lang="ts">
import SortableTable from '../components/sortable-table.vue';
import PokemonInfo from '@/pages/box-summary/pokemon-info.vue';
import PopupBase from './util/popup-base.vue';

const props = defineProps<{
  title: string,
  dataList: object[],
  columnList: object[],
}>();

</script>

<template>
  <PopupBase class="table-popup" @close="$emit('close')" :title="props.title">

    <template #headerText>
      {{ props.title }}
    </template>

    <SortableTable
      :dataList="props.dataList" :columnList="props.columnList"
      scroll
    >
      <template #pokemon="{ value }">
        <PokemonInfo :pokemon="value" nature />
      </template>

    </SortableTable>
  </PopupBase>
</template>

<style lang="scss" scoped>

.table-popup {
  width: 550px;

  .sortable-table {
    height: calc(100vh - 260px);
    max-height: 700px;
  }
}

</style>