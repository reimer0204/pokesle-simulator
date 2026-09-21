<script setup lang="ts">
import Pokemon from '@/data/pokemon';
import SortableTable from '@/components/sortable-table.vue';
import InputRadio from '@/components/form/input-radio.vue';
import PopupBase from '@/components/util/popup-base.vue';

const props = defineProps<{
  selectedName: string;
}>();
const emit = defineEmits<{
  close: [name?: string];
}>();

const pokemonList = computed(() =>
  Pokemon.list.map((pokemon) => ({
    no: pokemon.no,
    type: pokemon.type,
    berry: pokemon.berry.name,
    name: pokemon.name,
    selected: pokemon.name === props.selectedName,
  })),
);
const columnList = [
  { key: 'select', name: '' },
  { key: 'no', name: '図鑑No', type: Number },
  { key: 'type', name: 'タイプ', type: String },
  { key: 'berry', name: 'きのみ', type: String },
  { key: 'name', name: 'ポケモン名', type: String },
];
const tableSetting = { sort: [{ key: 'name', direction: 1 }] };

function selectPokemon(name: string) {
  emit('close', name);
}
</script>

<template>
  <PopupBase class="pokemon-select-popup" @close="emit('close')" body-class="pokemon-list-body">
    <template #headerText>ポケモンを選択</template>

    <SortableTable
      :data-list="pokemonList"
      :column-list="columnList"
      :setting="tableSetting"
      :fix-column="1"
      selected-field="selected"
      :sort-color="false"
      scroll
      @click-row="selectPokemon($event.name)"
    >
      <template #select="{ data }">
        <InputRadio
          :model-value="props.selectedName"
          :value="data.name"
          @click.stop
          @update:model-value="selectPokemon"
        />
      </template>
    </SortableTable>
  </PopupBase>
</template>

<style lang="scss" scoped>
.pokemon-select-popup {
  display: flex;
  flex-direction: column;
  width: 650px;
  height: min(700px, calc(100dvh - 100px));

  :deep(.pokemon-list-body) {
    flex: 1 1 0;
    min-height: 0;
    padding: 10px;
  }

  .sortable-table {
    height: 100%;

    :deep(tbody td) {
      cursor: pointer;
    }
  }
}
</style>
