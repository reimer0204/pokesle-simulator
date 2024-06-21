<template>
  <div class="base-alert">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.base-alert {
  padding: 10px;
  border-radius: 5px;

  border: 1px #0034a5 solid;
  background-color: #0034a520;
  color: #0034a5;
}
</style>