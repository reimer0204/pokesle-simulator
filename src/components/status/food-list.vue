<script setup>
import { Food, Cooking } from '../../data/food_and_cooking';
import Pokemon from '../../data/pokemon';
import config from '../../models/config';

const props = defineProps({
  pokemon: { required: true },
})
</script>

<template>
  <div class="food-list">
    <div v-for="(food, i) of pokemon.box?.foodList"
      class="food"
      :class="{
        disabled: i >= pokemon.foodList.length,
        error: pokemon.base?.foodNumListMap[food]?.[i] == null,
      }"
    >
      <template v-if="food">
        <img :src="Food.map[food].img" />
        <div class="num">{{ pokemon.base?.foodNumListMap[food]?.[i] }}</div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.food-list {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;

  .food {
      width: 24px;
      height: 24px;
      padding: 1px;
      position: relative;

      &.disabled {
        opacity: 0.5;
      }
      &:not(.disabled) {
        background-color: #FFF;
        border-radius: 3px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      &.error {
        background-color: red;
      }

      img {
        width: 100%;
      }

      .num {
        position: absolute;
        right: 2px;
        bottom: -2px;
        font-weight: bold;
        font-size: 80%;

        text-shadow:
          0px 0px 3px #FFF,
          0px 0px 3px #FFF,
          0px 0px 3px #FFF,
          0px 0px 3px #FFF,
          0px 0px 3px #FFF;
      }
    }
}
</style>