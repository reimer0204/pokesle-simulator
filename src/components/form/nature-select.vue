<script setup lang="ts">
import FormButton from '@/components/form/form-button.vue';

const props = defineProps<{
  modelValue: string;
}>();
const emits = defineEmits(['update:modelValue']);

const columnList = [
  'おてスピ',
  'げんき',
  '食材確率',
  'スキル確率',
  'EXP',
];
const rowList = [
  {
    name: 'おてスピ',
    natureList: ['がんばりや', 'さみしがり', 'いじっぱり', 'やんちゃ', 'ゆうかん'],
  },
  {
    name: 'げんき',
    natureList: ['ずぶとい', 'すなお', 'わんぱく', 'のうてんき', 'のんき'],
  },
  {
    name: '食材確率',
    natureList: ['ひかえめ', 'おっとり', 'てれや', 'うっかりや', 'れいせい'],
  },
  {
    name: 'スキル確率',
    natureList: ['おだやか', 'おとなしい', 'しんちょう', 'きまぐれ', 'なまいき'],
  },
  { name: 'EXP', natureList: ['おくびょう', 'せっかち', 'ようき', 'むじゃき', 'まじめ'] },
];
</script>

<template>
  <div class="nature-select">
    <table>
      <thead>
        <tr>
          <th class="corner"><span class="up">▲▲</span><span class="down">▼▼</span></th>
          <th v-for="name in columnList" :key="name" scope="col">{{ name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rowList" :key="row.name">
          <th scope="row">{{ row.name }}</th>
          <td v-for="name in row.natureList" :key="name">
            <FormButton
              :class="{ selected: props.modelValue === name }"
              @click="emits('update:modelValue', name)"
              >{{ name }}</FormButton
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.nature-select {
  max-width: 100%;
  overflow: hidden;
}

table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 2px;
  text-align: center;
}

th {
  white-space: pre-line;
  font-size: 85%;
  line-height: 1.25;
}

thead th {
  color: var(--color-execute);
}
tbody th {
  color: var(--color-danger);
}
.corner {
  position: relative;
  background: linear-gradient(
    to top right,
    transparent calc(50% - 0.5px),
    var(--color-line) 50%,
    transparent calc(50% + 0.5px)
  );

  span {
    position: absolute;
    font-size: 75%;
  }
  .up {
    bottom: 2px;
    left: 3px;
    color: var(--color-danger);
  }
  .down {
    top: 2px;
    right: 3px;
    color: var(--color-execute);
  }
}

td {
  padding: 0;
}
button {
  width: 100%;
  min-width: 0;
  padding-right: 2px;
  padding-left: 2px;
  white-space: nowrap;
}

:deep(button.selected) {
  background: var(--color-mint);

  &:hover:not(:disabled) {
    background: var(--color-mint);
  }
}

@media (max-width: 600px) {
  table {
    border-spacing: 1px;
  }
  th {
    font-size: 75%;
  }
  button {
    padding: 3px 0;
    font-size: 90%;
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
</style>
