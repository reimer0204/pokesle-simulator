<script lang="ts" setup>
import { SimulatedPokemon } from '../../../type.ts';
import config from '@/models/config.ts';
import Popup from '@/models/popup/popup.ts';
import EvaluateTableDetailPopup from '@/components/evaluate-table-detail-popup.vue';
import Pokemon from '@/data/pokemon.ts';
import { computed } from 'vue';
import { EvaluateResult, EvaluateResultKey } from '../../../type';

const props = defineProps<{
  pokemon: SimulatedPokemon,
  lv: number | string,
  type?: EvaluateResultKey,
  field?: 'score' | 'value',
}>()
const type = computed<EvaluateResultKey>(() => props.type ?? 'energy')
const score = computed<'score' | 'value'>(() => props.field ?? 'score')
const evaluateResult = computed<EvaluateResult>(() => props.pokemon.evaluateResult)

// 厳選詳細ポップアップを表示
function showSelectDetail(pokemon: SimulatedPokemon, after: string, lv: number) {
  Popup.show(EvaluateTableDetailPopup, {
    name: after,
    lv,
    foodIndexList: pokemon.box!.foodList.map(f => Math.max(pokemon.base.foodList.findIndex(f2 => f2.name == f)), 0),
    subSkillList: pokemon.box!.subSkillList,
    nature: pokemon.nature,
  })
}

// bestは集約値なので除外し、せいかく等で絞られた実際の計算対象を参照する。
const evaluatedAfterList = computed(() => {
  return Object.keys(evaluateResult.value?.[props.lv] ?? {}).filter(after => after !== 'best');
})
const afterList = computed<string[]>(() => {
  return config.pokemonList.selectDetail
    ? (evaluatedAfterList.value.length ? evaluatedAfterList.value : props.pokemon.base.afterList)
    : [evaluateResult.value?.[props.lv]?.best?.[type.value]?.name];
})
const resultList = computed(() => {
  return afterList.value.map(after => {
    let value: number;
    let diff;

    if (evaluateResult.value?.[props.lv]?.[after]?.[type.value]?.pureMint) {
      value = evaluateResult.value?.[props.lv]?.[after]?.[type.value]?.pureMint?.[score.value];
      const original = evaluateResult.value?.[props.lv]?.[after]?.[type.value]?.[score.value];
      if (value != null && original != null) {
        diff = value - original;
      }
    } else {
      value = evaluateResult.value?.[props.lv]?.[after]?.[type.value]?.[score.value];
    }

    let result = null;
    if (value != null) {
      if (score.value == 'score')      result = `${(value * 100).toFixed(1)}%`
      else if (type.value != 'energy') result = `${value.toFixed(1)}`
      else                             result = Math.round(value).toLocaleString();
    }

    return {
      after,
      isBest: (afterList.value.length > 1) && evaluateResult.value?.[props.lv]?.best?.[type.value]?.name == after,
      result,
      diff,
    }
  })
})

const numWidth = computed(() => type.value == 'energy' && score.value == 'value' ? 50 : 50)

</script>

<template>
  <div class="flex-column gap-5px" :style="{ width: config.pokemonList.selectDetail ? '100px' : '6em' }">
    <div
      v-for="{ after, isBest, result, diff } in resultList"
      :class="{
        'fw-b': isBest,
        'flex-row-end-center': config.pokemonList.selectDetail,
        'flex-column-start-end': !config.pokemonList.selectDetail,
      }"
    >
      <!-- 実際に計算された進化先が複数ある場合だけ名前を表示する。 -->
      <div v-if="evaluatedAfterList.length > 1 && Pokemon.map[after]" style="font-size: 70%;">
        <NameLabel :pokemon="{ base: Pokemon.map[after] }" memoHidden />
      </div>
      <!-- パーセント値だけ親の80%指定を打ち消し、通常セルと同じ文字サイズにする。 -->
      <div
        class="text-align-right"
        :style="{ width: `${numWidth}px` }"
      >
        <template v-if="result == null">-</template>
        <div v-else-if="props.lv != 'max'" class="link" @click="showSelectDetail(props.pokemon, after, props.lv as number)">{{ result }}</div>
        <template v-else>{{ result }}</template>
      </div>
      <div
        v-if="diff != null"
        class="diff"
        :class="{ plus: diff > 0, minus: diff < 0 }"
      >
        <template v-if="score == 'score'"     >{{ `${(diff > 0 ? '+' : '')}${(diff * 100).toFixed(1)}%` }}</template>
        <template v-else-if="type != 'energy'">{{ `${(diff > 0 ? '+' : '')}${diff.toFixed(1)}` }}</template>
        <template v-else                      >{{ `${(diff > 0 ? '+' : '')}` + Math.round(diff).toLocaleString() }}</template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.link {
  color: #04C;
  text-decoration: underline;
  // border-bottom: 1px #04C solid;
  cursor: pointer;

  &:hover {
    background-color: #0481;
  }
}

.diff {
  &.plus {
    color: red;
  }
  &.minus {
    color: blue;
  }
}
</style>
