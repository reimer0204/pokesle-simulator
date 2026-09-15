<template>
  <div class="base-alert">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.base-alert {
  padding: 8px 10px;
  border-radius: 7px;

  border: 1px solid #c2cadc;
  border-left: 4px solid var(--color-primary);
  background-color: var(--color-primary-soft);
  color: var(--color-primary-strong);
}
</style>
