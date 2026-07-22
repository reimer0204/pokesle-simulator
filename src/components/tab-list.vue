<template>
  <div class="tab-list">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.tab-list {
  display: flex;
  flex-wrap: wrap;
  border-bottom: 3px #CCC solid;
  gap: 5px 0;

  & > ::v-deep(*) {
    padding: 5px 15px;
    text-decoration: none;
    color: inherit;
    border-bottom: 3px #CCC solid;
    margin-bottom: -3px;

    &.router-link-exact-active, &.active {
      font-weight: bold;
      border-bottom: 3px #08C solid;
      color: #08C;
    }
  }
}
</style>