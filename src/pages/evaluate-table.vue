<script setup>
import SelectTableDetailPopup from '../components/evaluate-table-detail-popup.vue';
import SortableTable from '../components/sortable-table.vue';
import SettingList from '../components/util/setting-list.vue';
import { Food, Cooking } from '../data/food_and_cooking';
import Pokemon from '../data/pokemon';
import config from '../models/config.ts';
import EvaluateTable from '../models/simulation/evaluate-table.ts';
import MultiWorker from '../models/multi-worker.js';
import Popup from '../models/popup/popup.ts';
import EvaluateTableWorker from '../models/simulation/evaluate-simulator?worker';
import SubSkill from '../data/sub-skill';
import Nature from '@/data/nature';
import SubSkillCombinationWorker from '@/models/sub-skill-combination-worker?worker';
import TabList from '@/components/tab-list.vue';
import Berry from '@/data/berry';
import { Scatter } from 'vue-chartjs';
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, ScatterController } from 'chart.js';

ChartJS.register(LinearScale, PointElement, Tooltip, ScatterController);

let lvList = Object.entries(config.selectEvaluate.levelList)
  .filter(([lv, enable]) => enable)
  .map(([lv]) => Number(lv));
let lv = ref(lvList.at(-1));
let step = ref(5);
let selectedTab = ref('graph');
let graphPercentile = ref(100);
let graphAxis = ref('type');

let evaluateTable = ref(null);
let evaluateTablePromise = (async () => {
  evaluateTable.value = await EvaluateTable.load(config);
})();
let evaluateTablePokemonList = computed(() => {
  if (evaluateTable.value == null) return [];

  let result = [];
  for (let pokemonName in evaluateTable.value) {
    let lvInfo = evaluateTable.value[pokemonName][lv.value];
    let pokemon = Pokemon.map[pokemonName];

    for (let food in lvInfo) {
      if (food == '') continue;
      let percentile = lvInfo[food].energy;

      result.push({
        name: pokemonName,
        foodIndexList: food,
        foodList: food.split('').map((c) => pokemon.foodList[Number(c)].name),
        ...percentile,
      });
    }
  }
  return result;
});

let columnList = computed(() => {
  return [
    { key: 'name', name: '名前', type: String },
    { key: 'type', name: 'タイプ', type: String, convert: (x) => Pokemon.map[x.name].type },
    {
      key: 'specialty',
      name: 'とくい',
      type: String,
      convert: (x) => Pokemon.map[x.name].specialty,
    },
    { key: 'skill', name: 'スキル', type: String, convert: (x) => Pokemon.map[x.name].skill.name },
    { key: 'foodList', name: '食材', type: null },
    ...new Array(100 / step.value + 1).fill(0).map((_, i) => {
      let p = i * step.value;
      return { key: `${p}`, name: `${p}%`, template: 'percentile', p, type: Number, fixed: 0 };
    }),
  ];
});

const specialtyList = ['きのみ', '食材', 'スキル', 'オール'];
const typeOrderMap = new Map(Berry.typeList.map((berry, index) => [berry.type, index]));

const normalizedGraphPercentile = computed(() => {
  const value = Math.round(Number(graphPercentile.value));
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 100;
});

const graphPointList = computed(() => {
  // 食材構成が複数あるポケモンは、指定厳選度で最も高い値を代表値とする。
  const pokemonMap = new Map();
  for (const row of evaluateTablePokemonList.value) {
    const value = row[normalizedGraphPercentile.value];
    const current = pokemonMap.get(row.name);
    if (value != null && (current == null || value > current.value)) {
      pokemonMap.set(row.name, { name: row.name, value });
    }
  }

  return [...pokemonMap.values()]
    .map((point) => ({ ...point, pokemon: Pokemon.map[point.name] }))
    .filter((point) => specialtyList.includes(point.pokemon.specialty))
    .sort((a, b) => {
      if (graphAxis.value === 'type') {
        const typeOrder =
          (typeOrderMap.get(a.pokemon.type) ?? Number.MAX_SAFE_INTEGER) -
          (typeOrderMap.get(b.pokemon.type) ?? Number.MAX_SAFE_INTEGER);
        if (typeOrder) return typeOrder;
      } else if (graphAxis.value === 'specialty') {
        const specialtyOrder =
          specialtyList.indexOf(a.pokemon.specialty) - specialtyList.indexOf(b.pokemon.specialty);
        if (specialtyOrder) return specialtyOrder;
      }
      return a.value - b.value || a.name.localeCompare(b.name);
    })
    .map((point, index) => ({
      x: index,
      y: point.value,
      name: point.name,
      type: point.pokemon.type,
      specialty: point.pokemon.specialty,
      backgroundColor: point.pokemon.berry.typeColor,
    }));
});

const graphMedian = computed(() => {
  const valueList = graphPointList.value.map((point) => point.y).sort((a, b) => a - b);
  if (valueList.length == 0) return null;

  const middle = Math.floor(valueList.length / 2);
  return valueList.length % 2 == 0
    ? (valueList[middle - 1] + valueList[middle]) / 2
    : valueList[middle];
});

const medianLinePlugin = {
  id: 'medianLine',
  beforeDatasetsDraw(chart) {
    if (graphMedian.value == null) return;

    const { ctx, chartArea, scales } = chart;
    const y = scales.y.getPixelForValue(graphMedian.value);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(chartArea.left, y);
    ctx.lineTo(chartArea.right, y);
    ctx.strokeStyle = '#E00';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  },
  afterEvent(chart, args) {
    if (graphMedian.value == null) return;

    const { event } = args;
    const { chartArea, scales } = chart;
    const medianY = scales.y.getPixelForValue(graphMedian.value);
    const hovered =
      event.x >= chartArea.left &&
      event.x <= chartArea.right &&
      event.y >= chartArea.top &&
      event.y <= chartArea.bottom &&
      Math.abs(event.y - medianY) <= 5;

    if (
      chart.$medianLineHovered != hovered ||
      chart.$medianLineTooltipX != event.x ||
      chart.$medianLineTooltipY != medianY
    ) {
      chart.$medianLineHovered = hovered;
      chart.$medianLineTooltipX = event.x;
      chart.$medianLineTooltipY = medianY;
      args.changed = true;
    }
  },
  afterDraw(chart) {
    if (!chart.$medianLineHovered) return;

    const { ctx, chartArea } = chart;
    const text = '中央値';
    const padding = 6;
    ctx.save();
    ctx.font = '12px sans-serif';
    const width = ctx.measureText(text).width + padding * 2;
    const height = 24;
    const x = Math.min(chart.$medianLineTooltipX + 8, chartArea.right - width);
    const y = Math.max(chart.$medianLineTooltipY - height - 8, chartArea.top);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + height / 2);
    ctx.restore();
  },
};

const pokemonNamePlugin = {
  id: 'pokemonName',
  afterDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    const meta = chart.getDatasetMeta(0);
    const occupiedRectList = [];
    const labelHeight = 13;
    const labelPadding = 2;
    const offsetList = [6, 19, 32, 45, 58, 71, 84, 97];

    function getLabelRect(x, y, width, align, baseline) {
      const left = align === 'left' ? x : align === 'right' ? x - width : x - width / 2;
      const top = baseline === 'top' ? y : y - labelHeight;
      return {
        left: left - labelPadding,
        right: left + width + labelPadding,
        top: top - labelPadding,
        bottom: top + labelHeight + labelPadding,
      };
    }

    function isOverlapping(rect, other) {
      return (
        rect.left < other.right &&
        rect.right > other.left &&
        rect.top < other.bottom &&
        rect.bottom > other.top
      );
    }

    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#333';
    meta.data.forEach((element, index) => {
      const point = chart.data.datasets[0].data[index];
      if (
        element.x < chartArea.left ||
        element.x > chartArea.right ||
        element.y < chartArea.top ||
        element.y > chartArea.bottom
      )
        return;
      const width = ctx.measureText(point.name).width;
      const candidateList = offsetList.flatMap((offset) => [
        { x: element.x, y: element.y - offset, align: 'center', baseline: 'bottom' },
        { x: element.x, y: element.y + offset, align: 'center', baseline: 'top' },
      ]);
      const candidate =
        candidateList.find((position) => {
          const rect = getLabelRect(position.x, position.y, width, position.align, position.baseline);
          return (
            rect.left >= chartArea.left &&
            rect.right <= chartArea.right &&
            rect.top >= 0 &&
            rect.bottom <= chart.height &&
            !occupiedRectList.some((occupiedRect) => isOverlapping(rect, occupiedRect))
          );
        }) ?? candidateList[0];
      const rect = getLabelRect(candidate.x, candidate.y, width, candidate.align, candidate.baseline);

      ctx.textAlign = candidate.align;
      ctx.textBaseline = candidate.baseline;
      ctx.strokeText(point.name, candidate.x, candidate.y);
      ctx.fillText(point.name, candidate.x, candidate.y);
      occupiedRectList.push(rect);
    });
    ctx.restore();
  },
};

const graphData = computed(() => ({
  data: {
    datasets: [
      {
        label: `${normalizedGraphPercentile.value}%の値`,
        data: graphPointList.value,
        pointBackgroundColor: graphPointList.value.map((point) => point.backgroundColor),
        pointBorderColor: '#555',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  },
  options: {
    animation: false,
    maintainAspectRatio: false,
    responsive: true,
    layout: { padding: { top: 24 } },
    scales: {
      x: {
        type: 'linear',
        min: -0.5,
        max: Math.max(graphPointList.value.length - 0.5, 0.5),
        ticks: {
          stepSize: 1,
          maxRotation: 0,
          callback(value) {
            const index = Number(value);
            const point = graphPointList.value[index];
            const previous = graphPointList.value[index - 1];
            if (point == null) return '';
            if (graphAxis.value === 'type') return point.type !== previous?.type ? point.type : '';
            if (graphAxis.value === 'specialty')
              return point.specialty !== previous?.specialty ? point.specialty : '';
            return '';
          },
        },
        grid: {
          color: (context) => {
            const index = Number(context.tick.value);
            const point = graphPointList.value[index];
            const previous = graphPointList.value[index - 1];
            if (!Number.isInteger(index) || point == null) return 'transparent';
            if (graphAxis.value === 'type')
              return point.type !== previous?.type ? '#DDD' : 'transparent';
            if (graphAxis.value === 'specialty')
              return point.specialty !== previous?.specialty ? '#DDD' : 'transparent';
            return 'transparent';
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: '期待値',
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.raw?.name ?? '',
          label: (item) =>
            `${item.raw.type}・${item.raw.specialty}: ${Math.round(item.raw.y).toLocaleString()}`,
        },
      },
    },
  },
  plugins: [medianLinePlugin, pokemonNamePlugin],
}));

// サブスキルの組合せを計算する
const subSkillCombinationListPromise = (async () => {
  const subSkillCombinationWorker = new MultiWorker(SubSkillCombinationWorker, 1);
  const [subSkillCombinationList] = await subSkillCombinationWorker.call(null, () => ({
    config: JSON.parse(JSON.stringify(config)),
  }));
  subSkillCombinationWorker.close();

  return subSkillCombinationList;
})();

async function showDetail(pokemon, p) {
  asyncWatcher.run(async (progressCounter) => {
    await evaluateTablePromise;
    const subSkillCombinationList = await subSkillCombinationListPromise;

    const subSkillNum =
      lv.value < 10
        ? 0
        : lv.value < 25
          ? 1
          : lv.value < 50
            ? 2
            : lv.value < 70
              ? 3
              : lv.value < 80
                ? 4
                : 5;

    const multiWorker = new MultiWorker(EvaluateTableWorker, 1);

    let result = (
      await multiWorker.call(progressCounter, () => {
        return {
          lv: lv.value,
          config: JSON.parse(JSON.stringify(config)),
          pokemonList: [Pokemon.map[pokemon.name]],
          foodCombinationList: [pokemon.foodIndexList],
          subSkillCombinationList: subSkillCombinationList[subSkillNum] ?? [[1]],
          scoreForHealerEvaluate: evaluateTable.value.scoreForHealerEvaluate[lv.value][''].energy,
          scoreForSupportEvaluate: evaluateTable.value.scoreForSupportEvaluate[lv.value][''].energy,
        };
      })
    )[0].result[pokemon.name][pokemon.foodIndexList].energy[p];

    multiWorker.close();

    Popup.show(SelectTableDetailPopup, {
      name: pokemon.name,
      lv: lv.value,
      foodIndexList: pokemon.foodList.map(
        (f) => Math.max(Pokemon.map[pokemon.name].foodList.findIndex((f2) => f2.name == f)),
        0,
      ),
      subSkillList: result.subSkillList,
      nature: Nature.map[result.nature],
      percentile: false,
    });
  });
}
</script>

<template>
  <div class="page">
    <TabList>
      <div :class="{ active: selectedTab == 'graph' }" @click="selectedTab = 'graph'">グラフ</div>
      <div :class="{ active: selectedTab == 'table' }" @click="selectedTab = 'table'">一覧表</div>
    </TabList>

    <SettingList class="mt-10px">
      <div>
        <label>Lv</label>
        <InputSelect v-model="lv">
          <option v-for="lv in lvList" :value="lv">{{ lv }}</option>
        </InputSelect>
      </div>

      <div v-if="selectedTab == 'table'">
        <label>ステップ</label>
        <InputSelect v-model.number="step">
          <option :value="1">1</option>
          <option :value="2">2</option>
          <option :value="5">5</option>
          <option :value="10">10</option>
        </InputSelect>
      </div>

      <div v-else>
        <label>横軸</label>
        <div>
          <InputSelect v-model="graphAxis">
            <option value="type">タイプ別</option>
            <option value="specialty">とくい別</option>
            <option value="all">全体</option>
          </InputSelect>
        </div>
      </div>
      <div v-if="selectedTab == 'graph'">
        <label>表示する厳選度</label>
        <div>
          <InputNumber
            class="w-50px"
            type="number"
            min="0"
            max="100"
            step="1"
            v-model.number="graphPercentile"
          />
          %
        </div>
      </div>
    </SettingList>

    <template v-if="selectedTab == 'graph'">
      <small class="mobile-graph-scroll-hint">グラフは横にスクロールできます</small>
      <div class="graph-scroll">
        <div class="graph">
          <Scatter v-bind="graphData" />
        </div>
      </div>
    </template>

    <div v-else class="scroll" style="height: 600px">
      <SortableTable :dataList="evaluateTablePokemonList" :columnList="columnList" :fixColumn="2">
        <template #foodList="{ data }">
          <div class="flex-row-center-center gap-2px">
            <div v-for="(food, i) of data.foodList" class="food">
              <img :src="Food.map[food].img" />
              <div class="num">{{ Pokemon.map[data.name].foodNumListMap[food]?.[i] }}</div>
            </div>
          </div>
        </template>

        <template #percentile="{ data, column }">
          <div class="text-align-right percentile" @click="showDetail(data, column.p)">
            {{ Math.round(data[column.p]).toLocaleString() }}
          </div>
        </template>
      </SortableTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;

  .scroll {
    flex: 1 1 0;
    overflow: auto;
    position: relative;
  }

  .graph-scroll {
    flex: 1 1 0;
    min-height: 500px;
    overflow: hidden;
    position: relative;
  }

  .graph {
    width: 100%;
    height: 100%;
    min-height: 500px;
  }

  .mobile-graph-scroll-hint {
    display: none;
  }

  .pokemon-list {
    img {
      width: 24px;
      height: 24px;
    }
  }

  .food {
    width: 24px;
    height: 24px;
    padding: 1px;
    position: relative;

    &.disabled {
      opacity: 0.5;
    }
    &:not(.disabled) {
      background-color: #fff;
      border-radius: 3px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    img {
      width: 100%;
    }

    .num {
      position: absolute;
      right: 2px;
      bottom: -2px;
      font-weight: bold;
      font-size: 80%;

      text-shadow:
        0px 0px 3px #fff,
        0px 0px 3px #fff,
        0px 0px 3px #fff,
        0px 0px 3px #fff,
        0px 0px 3px #fff;
    }
  }

  .percentile {
    color: #04c;
    border-bottom: 1px #04c solid;
    cursor: pointer;

    &:hover {
      background-color: #def;
    }
  }
}

@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .page {
    .mobile-graph-scroll-hint {
      display: block;
      margin-top: 8px;
      color: var(--color-muted);
      font-size: 12px;
    }

    .graph-scroll {
      overflow-x: auto;
      overflow-y: hidden;
    }

    .graph {
      width: 1680px;
    }
  }
}

button {
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}
</style>
