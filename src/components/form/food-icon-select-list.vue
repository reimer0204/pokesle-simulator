<template>
  <div class="food-icon-select-list">
    <slot />
  </div>
</template>

<style lang="scss">
.food-icon-select-list {
  display: flex;
  width: fit-content;
  max-width: 100%;
  align-content: flex-start;
  align-items: flex-start;
  gap: 8px;
  justify-content: flex-start;

  > .food-icon-select + .food-icon-select {
    border-left: 1px solid var(--color-line);
    padding-left: 8px;
  }
}
</style>
