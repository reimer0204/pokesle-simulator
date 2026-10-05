<script setup lang="ts">
import SortableTable from '@/components/sortable-table.vue';
import AsyncWatcherArea from '@/components/util/async-watcher-area.vue';
import config from '@/models/config.ts';
import PokemonInfo from '../pokemon-info.vue';
import TablePopup from '@/components/table-popup.vue';
import Popup from '@/models/popup/popup.ts';
import { useRoute } from 'vue-router';
import Pokemon from '@/data/pokemon';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  plugins
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

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

const route = useRoute()
const graph = ref<any>(null);
const pan = ref<{ pointerId: number, startX: number, min: number, range: number } | null>(null);
let fixedYScale: { min: number, max: number, step: number } | null = null;

const border = computed(() => {
  return props.foodCheckList.dataList.find(x => x.food.name == route.params.name)?.border
})

const best = computed(() => {
  return props.foodCheckList.dataList.find(x => x.food.name == route.params.name)?.score
})

function lockVerticalScale(chart) {
  if (fixedYScale == null) {
    const yScale = chart.scales.y;
    fixedYScale = {
      min: yScale.min,
      max: yScale.max,
      step: Math.abs(yScale.ticks[1]?.value - yScale.ticks[0]?.value),
    };
  }

  chart.options.scales.y.min = fixedYScale.min;
  chart.options.scales.y.max = fixedYScale.max;
  if (fixedYScale.step > 0) {
    chart.options.scales.y.ticks ??= {};
    chart.options.scales.y.ticks.stepSize = fixedYScale.step;
  }
}

function zoomGraph(event: WheelEvent) {
  const chart = graph.value?.chart;
  if (chart == null) return;

  lockVerticalScale(chart);
  const xScale = chart.scales.x;
  const range = xScale.max - xScale.min;
  const nextRange = Math.min(100, Math.max(1, range * (event.deltaY < 0 ? 0.8 : 1.25)));
  const pointerX = event.clientX - chart.canvas.getBoundingClientRect().left;
  const position = Math.min(1, Math.max(0, (pointerX - xScale.left) / xScale.width));
  let min = xScale.getValueForPixel(xScale.left + xScale.width * position) - nextRange * position;
  min = Math.min(100 - nextRange, Math.max(0, min));

  chart.options.scales.x.min = min;
  chart.options.scales.x.max = min + nextRange;
  chart.update('none');
}

function startPan(event: PointerEvent) {
  if (event.pointerType != 'mouse' || event.button != 0) return;

  const chart = graph.value?.chart;
  if (chart == null) return;

  event.preventDefault();
  lockVerticalScale(chart);
  const xScale = chart.scales.x;
  pan.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    min: xScale.min,
    range: xScale.max - xScale.min,
  };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function panGraph(event: PointerEvent) {
  if (pan.value?.pointerId != event.pointerId) return;

  const chart = graph.value?.chart;
  if (chart == null) return;

  event.preventDefault();
  const xScale = chart.scales.x;
  const shift = (pan.value.startX - event.clientX) / xScale.width * pan.value.range;
  const min = Math.min(100 - pan.value.range, Math.max(0, pan.value.min + shift));

  chart.options.scales.x.min = min;
  chart.options.scales.x.max = min + pan.value.range;
  chart.update('none');
}

function endPan(event: PointerEvent) {
  if (pan.value?.pointerId != event.pointerId) return;

  pan.value = null;
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId);
  }
}

const graphData = computed(() => {
  let datasets = [];
  for(let [name, lvMap] of Object.entries(props.promisedEvaluateTable)) {
    const pokemon = Pokemon.map[name];
    if (pokemon == null) continue;

    let matchPokemon = false;
    let scoreList = [];
    for(let [foodCombination, { food1, food2, food3 }] of Object.entries(lvMap[config.summary.checklist.food.borderLv] ?? {})) {
      pokemon.foodList.forEach((food, index) => {
        const combinationScoreList = index == 0 ? food1 : index == 1 ? food2 : food3;
        if (combinationScoreList == null || combinationScoreList.length == 0) return;
        
        if (food.name != route.params.name) return;

        if (combinationScoreList.some(score => border.value <= score)) {
          matchPokemon = true;
        }
        scoreList.push(...combinationScoreList);
      })
    }

    if (matchPokemon) {
      scoreList.sort((a, b) => a - b);
      datasets.push({
        label: `${name}(${scoreList.at(-1).toFixed(1)})`,
        backgroundColor: 'hsl(255, 100%, 50%)',
        data: scoreList.map((score, index) => ({ x: index / (scoreList.length - 1) * 100, y: score })),
      })
    }
  }

  datasets.sort((a, b) => b.data.at(-1).y - a.data.at(-1).y);
  datasets.forEach((dataset, index) => {
    const hue = index * 360 / datasets.length;
    dataset.backgroundColor = `hsl(${hue}, 100%, 50%)`;
  })

  let horizontalLinePlugin = undefined
  if (config.simulation.selectType == 1) {
    horizontalLinePlugin = [{
      id: 'horizontalLine',
      afterDraw: (chart) => {
        const yValue = chart.scales.y.getPixelForValue(border.value);
        const ctx = chart.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(chart.chartArea.left, yValue);
        ctx.lineTo(chart.chartArea.right, yValue);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        if (best.value != null) {
          const bestYValue = chart.scales.y.getPixelForValue(best.value);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(chart.chartArea.left, bestYValue);
          ctx.lineTo(chart.chartArea.right, bestYValue);
          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }
    }]
  };

  return {
    data: {
      datasets,
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        x: {
          type: 'linear',
          ticks: {
            stepSize: 10,
          }
        },
        y: {
          type: 'linear',
          // beginAtZero: true,
        },
      },
    },
    plugins: horizontalLinePlugin,
  };
})


</script>

<template>
  <div class="page">
    <BaseAlert>
      全食材構成×全サブスキル×全せいかくの組み合わせの食材取得数のグラフです。赤線は設定した厳選基準のスコア、青線はあなたのボックスにいる最良のポケモンのスコアです。グラフ上でマウスホイールを回すと横軸を拡大・縮小でき、ドラッグで横方向へ移動できます。
    </BaseAlert>
    <div
      class="flex-110 graph-container"
      :class="{ panning: pan != null }"
      @wheel.prevent="zoomGraph"
      @pointerdown="startPan"
      @pointermove="panGraph"
      @pointerup="endPan"
      @pointercancel="endPan"
      @lostpointercapture="endPan"
    >
      <Line ref="graph" v-bind="graphData" />
    </div>
  </div>
</template>

<style lang="scss" scoped>

.page {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  flex: 1 1 0;
  overflow: hidden;
}

.graph-container {
  cursor: grab;
  touch-action: pan-y;

  &.panning {
    cursor: grabbing;
    user-select: none;
  }
}

</style>
