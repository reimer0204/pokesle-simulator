<script setup>
import Pokemon from '../../data/pokemon';

const props = defineProps({
  pokemon: { required: true }
})

const inputedSkillLv = computed(() => {
  return props.pokemon.box.skillLv != null;
})

const originalSkillLv = computed(() => {
  if (props.pokemon.box.skillLv) return props.pokemon.box.skillLv;

  let originalSkillLv = Pokemon.map[props.pokemon.name].evolveLv
  if (props.pokemon.enableSubSkillList.includes('スキルレベルアップM')) originalSkillLv += 2;
  if (props.pokemon.enableSubSkillList.includes('スキルレベルアップS')) originalSkillLv += 1;

  return Math.min(originalSkillLv, props.pokemon.skill.effect.length);
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