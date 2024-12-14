<script setup>
import config from '../../models/config.js';
import PokemonBox from '../../models/pokemon-box.js';

const props = defineProps({
  pokemon: { required: true }
})

function toggleTraining() {
  props.pokemon.training = props.pokemon.training ? null : props.pokemon.fixLv;
  const pokemon = structuredClone(PokemonBox.list[props.pokemon.index]);
  pokemon.training = props.pokemon.training
  PokemonBox.post(pokemon, props.pokemon.index)

  if (config.pokemonBox.gs.autoExport) {
    PokemonBox.exportGoogleSpreadsheet();
  }
}

</script>

<template>
  <span>
    <template v-if="props.pokemon.fixLv != null && props.pokemon.fixLv != props.pokemon.lv">
      <small>{{ props.pokemon.lv }}→</small>{{ props.pokemon.fixLv }}
      <!-- <CandyIcon @click="toggleTraining" :style="{
        color: props.pokemon.training ? '#6C4' : '#888'
      }" /> -->
    </template>
    <template v-else>{{ props.pokemon.lv }}</template>
  </span>
</template>

<style lang="scss" scoped>
.candy-icon {
  width: 1em;
}
</style>