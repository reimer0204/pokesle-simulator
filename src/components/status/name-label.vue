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
    
    <div v-if="pokemon.memo?.length" class="memo">{{ pokemon.memo }}</div>
  </span>
</template>

<style lang="scss" scoped>
.name-label {
  &.shiny {
    font-weight: bold;
    color: #E52;
  }
  .memo {
    font-size: 80%;
    white-space: pre-wrap;
  }
}
</style>