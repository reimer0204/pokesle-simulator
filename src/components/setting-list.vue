<template>
  <div class="setting-list">
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>

.setting-list {
  display: flex;
  flex-wrap: wrap;
  // grid-template-columns: max-content 1fr;
  gap: 5px 3px;

  :deep(small) {
    display: block;
  }

  :deep(input[type="text"]), :deep(input[type="number"]) {
    width: 100px;
  }

  & > :deep(div) {
    border-left: 3px #CCC solid;

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;

    padding: 3px 5px;

    label {
      color: #666;
      font-size: 80%;
      font-weight: bold;
    }

    // &:nth-child(2n+1) {
    //   font-weight: bold;
    //   background-color: #EEE;
    // }
  }

}

</style>