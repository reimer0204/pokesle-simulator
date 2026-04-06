<script setup>
const props = defineProps({
  pokemon: { required: true },
  memoHidden: { type: Boolean, default: false }
})

const splitName = computed(() => {
  const match = /(\(.*\))/.exec(props.pokemon.base.name);
  if (match) {
    let bracket = match[0];
    const main = props.pokemon.base.name.slice(0, match.index);
    bracket = bracket.replace(/[なの]すがた/, '')
    if (main === 'バケッチャ' || main === 'パンプジン') bracket = bracket.replace('しゅ)', ')')
    return { main, bracket };
  }
  return { main: props.pokemon.base.name, bracket: null };
})
</script>

<template>
  <span class="name-label" :class="{ shiny: pokemon.box?.shiny }">
    <template v-if="props.pokemon.beforeName && props.pokemon.beforeName != props.pokemon.base.name">
      <small>{{ props.pokemon.beforeName }}→</small>{{ splitName.main }}<small v-if="splitName.bracket">{{ splitName.bracket }}</small>
    </template>
    <template v-else>{{ splitName.main }}<small v-if="splitName.bracket">{{ splitName.bracket }}</small></template>
    <template v-if="pokemon.box?.favorite">★</template>
    <template v-if="pokemon.bagOverOperation">(いつ育)</template>
    
    <div v-if="!props.memoHidden && pokemon.box?.memo?.length" class="memo">{{ pokemon.box.memo }}</div>
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