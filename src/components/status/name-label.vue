<script setup>
const props = defineProps({
  pokemon: { required: true }
})
</script>

<template>
  <span class="name-label" :class="{ shiny: pokemon.shiny }">
    <template v-if="props.pokemon.beforeName && props.pokemon.beforeName != props.pokemon.name"><small>{{ props.pokemon.beforeName }}→</small>{{ props.pokemon.name }}</template>
    <template v-else>{{ props.pokemon.name }}</template>
    <template v-if="pokemon.bagOverOperation">(いつ育)</template>
  </span>
</template>

<style lang="scss" scoped>
.name-label {
  &.shiny {
    font-weight: bold;
    color: #E52;
  }
}
</style>