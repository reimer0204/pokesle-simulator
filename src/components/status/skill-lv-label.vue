<script setup>
import Pokemon from '../../data/pokemon';

const props = defineProps({
  pokemon: { required: true }
})

const inputedSkillLv = computed(() => {
  return props.pokemon.box.skillLv != null;
})

const originalSkillLv = computed(() => {
  return props.pokemon.box.skillLv ?? Pokemon.map[props.pokemon.name].evolveLv;
})

</script>

<template>
  <span class="skill-lv-label">
    <span :class="{ auto: !inputedSkillLv, original: originalSkillLv != props.pokemon.skillLv }">
      {{ originalSkillLv }}
    </span>
    <template v-if="originalSkillLv != props.pokemon.skillLv">
      <small> →</small>
      {{ props.pokemon.skillLv }}
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