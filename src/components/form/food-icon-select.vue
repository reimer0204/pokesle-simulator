<script setup lang="ts">
import { Food } from '@/data/food_and_cooking';

const props = defineProps<{
  modelValue: string | null,
  foodList: string[],
}>();
const emits = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="food-icon-select" role="radiogroup" aria-label="食材を選択">
    <div
      v-for="food in props.foodList"
      :key="food"
      class="food-icon"
      :class="{ selected: props.modelValue === food }"
      role="radio"
      :aria-checked="props.modelValue === food"
      :title="food"
      @click="emits('update:modelValue', food)"
    >
      <img :src="Food.map[food].img" :alt="food">
    </div>
    <div
      v-if="props.foodList.length == 0"
      class="food-icon"
    >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.food-icon-select {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.food-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--color-line);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;

  &:hover { background: var(--color-mint-soft); }
  &.selected {
    border: 2px solid var(--color-mint);
    background: var(--color-mint-soft);
  }

  img { width: 29px; height: 29px; object-fit: contain; }
}
</style>
