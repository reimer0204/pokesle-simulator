<script setup>
const props = defineProps({
  dataList: { type: Array },
  columnList: { type: Array, default: () => [] },
  fixColumn: { type: Number, default: 0 },
  setting: { type: Object, default: () => ({}) },
})
const emits = defineEmits(['clickRow', 'update:setting'])

const sortInfo = ref(props.setting?.sort ?? []);
const sortColors = ref([])
const editMode = ref(false);
const hiddenColumn = reactive(new Set(props.setting?.hiddenColumn ?? []));

watch(() => props.columnList, () => {
  sortInfo.value = sortInfo.value.filter(sort => columnMap.value[sort.key] !== undefined);
})

const columnMap = computed(() => {
  let result = {};
  for(let column of props.columnList) {
    result[column.key] = column;
  }
  return result;
})

const convertedDataList = computed(() => {
  return props.dataList.map(data => {
    let newData = { ...data };

    for(let column of props.columnList) {
      if (column.convert) {
        newData[column.key] = column.convert(newData);
      }
    }

    return newData;
  })
})

// ソートしたデータ
const sortedDataList = computed(() => {
  let result;

  if (!sortInfo.value?.length) {
    sortColors.value = [];
    result = convertedDataList.value;

  } else {

    // ソート
    result = convertedDataList.value.toSorted((a, b) => {
      for(let sort of sortInfo.value) {
        if ((a[sort.key] || 0) > (b[sort.key] || 0)) return sort.direction;
        if ((a[sort.key] || 0) < (b[sort.key] || 0)) return -sort.direction;
      }
      return 0;
    });

    //
    sortColors.value = []
    let minmax = {};
    for(let data of result) {
      for(let sort of sortInfo.value) {
        if(columnMap.value[sort.key]?.type == Number || columnMap.value[sort.key].percent) {
          minmax[sort.key] ??= { min: data[sort.key] ?? 0, max: data[sort.key] ?? 0 };
          minmax[sort.key].min = Math.min(minmax[sort.key].min, data[sort.key] ?? 0)
          minmax[sort.key].max = Math.max(minmax[sort.key].max, data[sort.key] ?? 0)
        }
      }
    }

    let sringColorMap = new Map();
    for(let data of result) {
      let colors = {};
      for(let sort of sortInfo.value) {
        if (columnMap.value[sort.key] == null) continue;
        let color;
        if(columnMap.value[sort.key].type == Number || columnMap.value[sort.key].percent) {
          let rate = (data[sort.key] - minmax[sort.key].min) / (minmax[sort.key].max - minmax[sort.key].min)
          color = `hsl(${rate * 120}deg 90% 95%)`
        } else {
          let text = String(data[sort.key] ?? '');
          color = sringColorMap.get(text)
          if (color == null) {
            let code = text.split('').reduce((a, x) => a ^ x.charCodeAt(0), 0);
            color = `hsl(${code}deg 90% 95%)`
            sringColorMap.set(text, color)
          }
        }
        colors[sort.key] = color;
      }
      sortColors.value.push(colors)
    }
  }

  if (editMode.value) {
    result = result.slice(0, 10);
  }

  return result;
})

const sortInfoMap = computed(() => {
  let result = {};
  for(let sort of sortInfo.value) {
    result[sort.key] = sort.direction;
  }
  return result;
})

function setSort(event, key) {
  if (event.shiftKey) {
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
  } else {
    if (sortInfo.value[0]?.key != key) sortInfo.value = [{ key, direction: 1 }]
    else if(sortInfo.value[0].direction == 1) sortInfo.value = [{ key, direction: -1 }]
    else sortInfo.value = [];
  }

  emits('update:setting', {
    sort: sortInfo.value,
    hiddenColumn: [...hiddenColumn],
  })
}

function clearSort(key) {
  sortInfo.value = sortInfo.value.filter(x => x.key != key);

  emits('update:setting', {
    sort: sortInfo.value,
    hiddenColumn: [...hiddenColumn],
  })
}

const columnLeftList = ref([]);
const thList = ref([])
function getColumnLeft() {
  try {
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
  } catch(e) {
    // ignore
  }
}

onMounted(getColumnLeft)
onUpdated(getColumnLeft)

const enableColumnList = computed(() => {
  let columnList = props.columnList;

  if (!editMode.value) {
    columnList = columnList.filter(column => {
      return !hiddenColumn.has(column.key)
    })
  }

  return columnList;
})
const enableColumnListLength = computed(() => enableColumnList.value.length)

function toggleHiddenColumn(key) {
  if(hiddenColumn.has(key)) {
    hiddenColumn.delete(key)
  } else if (enableColumnList.value.length) {
    hiddenColumn.add(key)
  }

  emits('update:setting', {
    sort: sortInfo.value,
    hiddenColumn: [...hiddenColumn],
  })
}

</script>

<template>
  <table class="sortable-table">
    <thead>
      <tr>
        <th v-for="(column, i) in enableColumnList" ref="thList"
          :class="{'fix-column': i < props.fixColumn, hidden: editMode && hiddenColumn.has(column.key)}"
          :style="{ left: i < props.fixColumn ? columnLeftList[i] : null }"
          @contextmenu.prevent.stop="editMode = !editMode"
        >
          <slot :name="`header.${column.template ?? column.key}`" v-bind="{ column }">
            <div>
              <template v-if="column.img"><img :src="column.img"></template>
              <template v-else>{{ column.name }}</template>
            </div>
          </slot>

          <template v-if="editMode">
            <svg viewBox="0 0 100 100" width="14" @click="toggleHiddenColumn(column.key)">
              <path d="M10,50L90,50" stroke="#FFF" stroke-width="20" />
              <path d="M50,10L50,90" stroke="#FFF" stroke-width="20" v-if="hiddenColumn.has(column.key)" />
            </svg>
          </template>
          <template v-else>
            <svg viewBox="0 0 100 100" width="14" @click="setSort($event, column.key)" @contextmenu.prevent.stop="clearSort(column.key)">
              <path d="M10,40L90,40L50,0z"   :fill="sortInfoMap[column.key] ==  1 ? '#FFF' : '#FFF4'" />
              <path d="M10,60L90,60L50,100z" :fill="sortInfoMap[column.key] == -1 ? '#FFF' : '#FFF4'" />
            </svg>
          </template>
        </th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="(data, j) in sortedDataList">
        <td v-for="(column, i) in enableColumnList"
          :class="{ number: column.type == Number || column.percent, 'fix-column': i < props.fixColumn }"
          :style="{
            left: columnLeftList[i],
            backgroundColor: sortColors[j]?.[column.key],
          }"
          @click="emits('clickRow', data)"
        >
          <slot :name="column.template ?? column.key" v-bind="{ data, column, value: data[column.key] }">
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
    user-select: none;

    &.fix-column {
      z-index: 2;
    }

    &.hidden {
      opacity: 0.5;
    }

    img {
      max-width: 2em;
      max-height: 2em;
    }

    svg:hover {
      background-color: #FFF4;
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
    border-bottom: 1px #CCC solid;

    &:has(~ :hover), &:hover, &:hover ~ td {
      background-color: rgb(235, 245, 255);
    }
  }
}
</style>