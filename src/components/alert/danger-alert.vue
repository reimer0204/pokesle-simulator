<template>
  <BaseAlert class="danger-alert">
    <slot />
  </BaseAlert>
</template>

<style lang="scss" scoped>
.danger-alert {
  border-color: #e7c2c8;
  border-left-color: var(--color-danger);
  background-color: #fbf1f2;
  color: #9f5864;
}
</style>
