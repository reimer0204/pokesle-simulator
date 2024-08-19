<script setup>
import config from '../../models/config';

const props = defineProps({
  pokemon: { required: true },
})
</script>

<template>
  <div class="sub-skill-label-list">
    <SubSkillLabel 
      v-for="(subSkill, i) in props.pokemon.subSkillList"
      :subSkill="props.pokemon.enableSubSkillList[i] ?? subSkill"
      :short="config.pokemonList.subSkillShort"
      :class="{ disabled: i >= props.pokemon.enableSubSkillList.length }"
      :fix="props.pokemon.enableSubSkillList[i] != null && props.pokemon.enableSubSkillList[i] != subSkill"
      :silverSeed="subSkill != props.pokemon.nextSubSkillList[i]" />
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