<template>
  <table class="design-table">
    <slot />
  </table>
</template>

<style lang="scss">

.design-table {
  border-collapse: collapse;

  th, td {
    padding: 8px 8px;
  }

  th {
    background-color: rgb(66, 85, 158);
    color: #FFF;
    border: 1px #FFF solid;
  }

  tbody {
    tr > td {
      border-bottom: 1px #CCC solid;
    }

    tr:nth-child(odd) > td {
      background-color: #F8F8F8;
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
      background-color: rgb(66, 85, 158);
      // background-color: #b6c9f1;
      border: 1px #FFF solid;
      color: #FFF;
      justify-content: center;
      align-items: center;
      text-align: center;
      border-bottom: 1px #CCC solid;
    }

    & > tbody  > tr > td {
      display: flex;
      justify-content: left;
      align-items: center;
      border-bottom: 1px #CCC solid;

      &:has(~ :hover), &:hover, &:hover ~ td {
        background-color: rgb(235, 245, 255);
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