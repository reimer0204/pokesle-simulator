<script setup>
const props = defineProps({
  pokemon: { required: true }
})
</script>

<template>
  <span>
    <template v-if="props.pokemon.beforeName && props.pokemon.beforeName != props.pokemon.name"><small>{{ props.pokemon.beforeName }}→</small>{{ props.pokemon.name }}</template>
    <template v-else>{{ props.pokemon.name }}</template>
  </span>
</template>