<template>
  <div class="tab-list">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.tab-list {
  display: flex;
  flex-wrap: wrap;
  border-bottom: 2px solid var(--color-line);
  gap: 5px 0;

  & > ::v-deep(*) {
    padding: 5px 15px;
    text-decoration: none;
    color: inherit;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    border-radius: 6px 6px 0 0;

    &.router-link-exact-active, &.active {
      font-weight: bold;
      border-bottom-color: var(--color-primary);
      background: var(--color-primary-soft);
      color: var(--color-primary-strong);
    }
  }
}
</style>

<style lang="scss" scoped>
@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .tab-list {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;

    > * {
      flex: 0 0 auto;
      padding: 5px 9px;
      white-space: nowrap;
    }
  }
}
</style>
