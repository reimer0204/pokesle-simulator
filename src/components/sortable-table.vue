<script setup>
import config from '../models/config';

const props = defineProps({
  dataList: { type: Array },
  columnList: { type: Array, default: () => [] },
  config: { type: String, default: null },
  fixColumn: { type: Number, default: 0 },
})

const sortInfo = ref([]);

if(props.config) {
  if (Array.isArray(config.sortableTable?.[props.config])) {
    sortInfo.value = config.sortableTable?.[props.config];
  }
}

const sortedDataList = computed(() => {
  if (!sortInfo.value?.length) return props.dataList;

  return props.dataList.toSorted((a, b) => {
    for(let sort of sortInfo.value) {
      if ((a[sort.key] || 0) > (b[sort.key] || 0)) return sort.direction;
      if ((a[sort.key] || 0) < (b[sort.key] || 0)) return -sort.direction;
    }
    return 0;
  });
})

const sortInfoMap = computed(() => {
  let result = {};
  for(let sort of sortInfo.value) {
    result[sort.key] = sort.direction;
  }
  return result;
})

function setSort(key) {
  if (sortInfo.value.length && sortInfo.value[0].key == key) {
    if(sortInfo.value[0].direction == 1) sortInfo.value[0].direction = -1;
    else sortInfo.value.shift();

  } else {
    sortInfo.value = sortInfo.value.filter(x => x.key != key);
    sortInfo.value.unshift({
      key,
      direction: 1,
    })
  }

  if(props.config) {
    config.sortableTable[props.config] = sortInfo.value
  }
}

const columnLeftList = ref([]);
const thList = ref([])
function getColumnLeft() {
  let newColumnLeftList = [];
  let sum = 0;
  for(let e of thList.value) {
    newColumnLeftList.push(`${sum}px`);
    let { width, left, right } = e.getBoundingClientRect()
    sum += right - left;
  }

  if (newColumnLeftList.length != columnLeftList.value.length || newColumnLeftList.some((x, i) => x != columnLeftList.value[i])) {
    columnLeftList.value = newColumnLeftList;
  }
}

onMounted(getColumnLeft)
onUpdated(getColumnLeft)

const enableColumnList = computed(() => {
  return props.columnList;
})
const enableColumnListLength = computed(() => enableColumnList.value.length)
</script>

<template>
  <table class="sortable-table">
    <thead>
      <tr>
        <th v-for="(column, i) in columnList" ref="thList"
          :class="{'fix-column': i < props.fixColumn}"
          :style="{ left: i < props.fixColumn ? columnLeftList[i] : null }"
        >
          <div>
            <template v-if="column.img"><img :src="column.img"></template>
            <template v-else>{{ column.name }}</template>
          </div>
          <svg viewBox="0 0 100 100" width="14" @click="setSort(column.key)">
            <path d="M10,40L90,40L50,0z"   :fill="sortInfoMap[column.key] ==  1 ? '#FFF' : '#FFF4'" />
            <path d="M10,60L90,60L50,100z" :fill="sortInfoMap[column.key] == -1 ? '#FFF' : '#FFF4'" />
          </svg>
        </th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="data in sortedDataList">
        <td v-for="(column, i) in columnList"
          :class="{ number: column.type == Number || column.percent, 'fix-column': i < props.fixColumn }"
          :style="{ left: columnLeftList[i] }"
        >
          <slot :name="column.template ?? column.key" v-bind="{ data, column }">
            <template v-if="column.percent">
              {{ data[column.key] != null ? `${(data[column.key] * 100).toFixed(column.fixed ?? 1)}%` : null }}
            </template>
            <template v-else-if="column.fixed != null">
              {{ data[column.key]?.toFixed(column.fixed) }}
            </template>
            <template v-else>
              {{ data[column.key] }}
            </template>
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss" scoped>

.sortable-table {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(v-bind(enableColumnListLength), max-content);
  gap: 0;
  // white-space: nowrap;
  // border-collapse: collapse;

  & > thead, & > tbody {
    display: contents;

    & > tr {
      display: contents;

      & > .fix-column {
        position: sticky;
        left: 0;
        z-index: 1;
      }
    }
  }

  & > thead > tr > th {
    position: sticky;
    top: 0;
    z-index: 1;

    &.fix-column {
      z-index: 2;
    }

    img {
      max-width: 2em;
      max-height: 2em;
    }
  }

  & > thead, & > tbody {
    & > tr {
      & > th, & > td {
        padding: 3px 5px;
        background-color: #FFF;
        white-space: pre-line;
        vertical-align: middle;

        &.number {
          text-align: right;
          justify-content: end;;
        }
      }
    }
  }

  & > thead  > tr > th {
    display: flex;
    gap: 5px;
    background-color: rgb(54, 73, 150);
    border: 1px #FFF solid;
    color: #FFF;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  & > tbody  > tr > td {
    display: flex;
    justify-content: left;
    align-items: center;
    border: 1px #FFF solid;
    border-bottom-color: #CCC;
  }
}
</style>