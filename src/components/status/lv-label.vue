<script setup>
const props = defineProps({
  pokemon: { required: true }
})
</script>

<template>
  <span>
    <template v-if="props.pokemon.fixLv != null && props.pokemon.fixLv != props.pokemon.lv"><small>{{ props.pokemon.lv }}→</small>{{ props.pokemon.fixLv }}</template>
    <template v-else>{{ props.pokemon.lv }}</template>
  </span>
</template>