<script setup lang="ts">
import SortableTable from '@/components/sortable-table.vue';
import AsyncWatcherArea from '@/components/util/async-watcher-area.vue';
import config from '@/models/config.js';
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

const border = computed(() => {
  return props.foodCheckList.dataList.find(x => x.food.name == route.params.name)?.border
})

const best = computed(() => {
  return props.foodCheckList.dataList.find(x => x.food.name == route.params.name)?.score
})

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
      全食材構成×全サブスキル×全せいかくの組み合わせの食材取得数のグラフです。赤線は設定した厳選基準のスコア、青線はあなたのボックスにいる最良のポケモンのスコアです。どのポケモンを捕まえるかの目安にしてください。
    </BaseAlert>
    <div class="flex-110">
      <Line v-bind="graphData" />
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

</style>