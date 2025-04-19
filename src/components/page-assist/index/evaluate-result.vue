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
    const value: number = props.pokemon[type.value]?.[props.lv]?.[after]?.[props.field ?? 'score'];
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
    }
  })
})

const numWidth = computed(() => props.field == 'energy' ? 40 : 35)

</script>

<template>
  <div class="flex-column gap-5px" :style="{ width: config.pokemonList.selectDetail ? undefined : '6em', fontSize: '80%' }">
    <div
      v-for="{ after, isBest, result } in resultList"
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
</style>