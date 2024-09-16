<template>
  <table class="setting-table">
    <slot></slot>
  </table>
</template>

<style lang="scss">
.setting-table {
  th {
    text-align: left;
    color: #888;
  }

  th, td {
    padding: 5px 5px;
  }
}
</style>