<script lang="ts" setup>
import type { SimulatedPokemon } from '../../../type.ts';
import config from '@/models/config.js';
import Popup from '@/models/popup/popup.ts';
import EvaluateTableDetailPopup from '@/components/evaluate-table-detail-popup.vue';
import { computed } from 'vue';

const props = defineProps<{
  pokemon: SimulatedPokemon,
  lv: number | string,
  type?: 'evaluateSpecialty',
  field?: 'energy' | 'num',
}>()
const type = computed<'evaluateResult' | 'evaluateSpecialty'>(() => props.type ?? 'evaluateResult')

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

const afterList = computed<string[]>(() => {
  return config.pokemonList.selectDetail ? props.pokemon.base.afterList : [props.pokemon[type.value]?.[props.lv]?.best.name];
})
const resultList = computed(() => {
  return afterList.value.map(after => {
    let value: number;
    let diff;

    if (props.pokemon[type.value]?.[props.lv]?.[after]?.pureMint) {
      value = props.pokemon[type.value]?.[props.lv]?.[after]?.pureMint?.[props.field ?? 'score'];
      const original = props.pokemon[type.value]?.[props.lv]?.[after]?.[props.field ?? 'score'];
      if (value != null && original != null) {
        diff = value - original;
      }
    } else {
      value = props.pokemon[type.value]?.[props.lv]?.[after]?.[props.field ?? 'score'];
    }

    let result = null;
    if (value != null) {
      if (props.field == null)       result = `${(value * 100).toFixed(1)}%`
      else if (props.field == 'num') result = `${value.toFixed(1)}`
      else                           result = Math.round(value).toLocaleString();
    }

    return {
      after,
      isBest: (afterList.value.length > 1) && props.pokemon[type.value]?.[props.lv]?.best.name == after,
      result,
      diff,
    }
  })
})

const numWidth = computed(() => props.field == 'energy' ? 40 : 35)

</script>

<template>
  <div class="flex-column gap-5px" :style="{ width: config.pokemonList.selectDetail ? undefined : '6em', fontSize: '80%' }">
    <div
      v-for="{ after, isBest, result, diff } in resultList"
      :class="{
        'fw-b': isBest,
        'flex-row-end-center': config.pokemonList.selectDetail,
        'flex-column-start-end': !config.pokemonList.selectDetail,
      }"
    >
      <div>{{ after }}</div>
      <div class="text-align-right" :style="{ width: `${numWidth}px` }">
        <template v-if="result == null">-</template>
        <div v-else-if="props.lv != 'max'" class="link" @click="showSelectDetail(props.pokemon, after, props.lv as number)">{{ result }}</div>
        <template v-else>{{ result }}</template>
      </div>
      <div v-if="diff != null" class="diff" :class="{ plus: diff > 0, minus: diff < 0 }">
        <template v-if="props.field == null"      >{{ `${(diff > 0 ? '+' : '')}${(diff * 100).toFixed(1)}%` }}</template>
        <template v-else-if="props.field == 'num'">{{ `${(diff > 0 ? '+' : '')}${diff.toFixed(1)}` }}</template>
        <template v-else                          >{{ `${(diff > 0 ? '+' : '')}` + Math.round(diff).toLocaleString() }}</template>
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