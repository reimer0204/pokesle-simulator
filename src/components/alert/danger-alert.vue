<template>
  <BaseAlert class="danger-alert">
    <slot />
  </BaseAlert>
</template>

<style lang="scss" scoped>
.danger-alert {
  border-color: #d80036;
  background-color: #ff004013;
  color: #d80036;
}
</style>