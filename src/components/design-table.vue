<template>
  <table class="design-table">
    <slot />
  </table>
</template>

<style lang="scss">
.design-table {
  border-collapse: collapse;

  > thead > tr > th,
  > thead > tr > td,
  > tbody > tr > th,
  > tbody > tr > td,
  > tr > th,
  > tr > td {
    padding: 6px 7px;
  }

  > thead > tr > th,
  > tbody > tr > th,
  > tr > th {
    background-color: var(--color-primary-strong);
    color: #fff;
    border: 1px solid #fff;
  }

  > tbody > tr > td {
    border-bottom: 1px solid var(--color-line);
  }

  > tbody > tr:nth-child(odd) > td {
    background-color: var(--color-surface-subtle);
  }
}
</style>
