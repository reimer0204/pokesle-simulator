<script setup lang="ts">
import SubSkill from '../../data/sub-skill';
import config from '../../models/config';
import type { SimulatedPokemon } from '../../type'

const props = defineProps<{
  pokemon: SimulatedPokemon,
}>()
</script>

<template>
  <div class="sub-skill-label-list" v-if="props.pokemon.box">
    <SubSkillLabel 
      v-for="(subSkill, i) in props.pokemon.box.subSkillList"
      :subSkill="props.pokemon.subSkillList[i] ?? SubSkill.map[subSkill]"
      :short="config.pokemonList.subSkillShort"
      :class="{ disabled: i >= props.pokemon.subSkillList.length }"
      :fix="props.pokemon.subSkillNameList[i] != null && props.pokemon.subSkillNameList[i] != subSkill"
      :silverSeed="props.pokemon.nextSubSkillList?.[i]" />
  </div>
</template>

<style lang="scss" scoped>
.sub-skill-label-list {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;

  .sub-skill-label {
    &.disabled {
      opacity: 0.5;
    }
  }
}
</style>