<template>
  <table class="design-table">
    <slot />
  </table>
</template>

<style lang="scss">

.design-table {
  border-collapse: collapse;

  th, td {
    padding: 6px 7px;
  }

  th {
    background-color: var(--color-primary-strong);
    color: #FFF;
    border: 1px solid #FFF;
  }

  tbody {
    tr > td {
      border-bottom: 1px solid var(--color-line);
    }

    tr:nth-child(odd) > td {
      background-color: var(--color-surface-subtle);
    }
  }

  .scroll {
    flex: 1 1 0;
    overflow: scroll;
    position: relative;

    & > table {
      position: absolute;
    }
  }

  table {

    & > thead  > tr > th {
      display: flex;
      gap: 5px;
      background-color: var(--color-primary-strong);
      // background-color: #b6c9f1;
      border: 1px #FFF solid;
      color: #FFF;
      justify-content: center;
      align-items: center;
      text-align: center;
      border-bottom: 1px solid var(--color-line);
    }

    & > tbody  > tr > td {
      display: flex;
      justify-content: left;
      align-items: center;
      border-bottom: 1px solid var(--color-line);

      &:has(~ :hover), &:hover, &:hover ~ td {
        background-color: var(--color-mint-soft);
      }
    }
  }

  .pager {
    display: flex;
    justify-content: center;
    gap: 5px;

    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 3;

    color: #888;
    background-color: #FFF;
    border-top: 1px #CCC solid;
    padding: 0.5em;
    user-select: none;

    .page {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 2em;
      height: 2em;
      border-radius: 50%;
      cursor: pointer;

      &:hover {
        background-color: #F8F8F8;
      }

      &.active {
        background-color: rgb(70, 91, 177);
        color: #FFF;
      }
    }

    .move {
      height: 2em;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;

      svg {
        width: 1em;
        height: 1em;

        path {
          stroke-width: 20;
          stroke: #888;
          fill: none;
        }
      }

      &.prev {
        margin-right: auto;
      }

      &.next {
        margin-left: auto;
      }
    }
  }
}
</style>
