<script setup lang="ts">
import type { SimulatedPokemon } from '../../type'

const props = defineProps<{
  pokemon: SimulatedPokemon, 
}>()

const inputedSkillLv = computed(() => {
  return props.pokemon.box.skillLv != null;
})

const originalSkillLv = computed(() => {
  if (props.pokemon.box.skillLv) return props.pokemon.box.skillLv;

  let originalSkillLv = props.pokemon.base.evolveLv ?? 1
  if (props.pokemon.subSkillNameList.includes('スキルレベルアップM')) originalSkillLv += 2;
  if (props.pokemon.subSkillNameList.includes('スキルレベルアップS')) originalSkillLv += 1;

  return Math.min(originalSkillLv, props.pokemon.base.skill.effect.length);
})

</script>

<template>
  <span class="skill-lv-label">
    <span :class="{ auto: !inputedSkillLv, original: originalSkillLv != props.pokemon.skillLv }">
      {{ originalSkillLv }}
    </span>
    <template v-if="originalSkillLv != props.pokemon.fixedSkillLv">
      <small> →</small>
      {{ props.pokemon.fixedSkillLv }}
    </template>
  </span>
</template>

<style lang="scss" scoped>
.skill-lv-label {
  font-weight: bold;

  .auto {
    color: #AAA;
  }
}
</style>