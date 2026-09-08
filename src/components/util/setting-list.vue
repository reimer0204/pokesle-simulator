<script setup lang="ts">
const props = defineProps({
  grid: { type: Boolean, default: false }
})
</script>

<template>
  <div class="setting-list" :class="{ grid: props.grid }">
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>

.setting-list {
  display: flex;
  flex-wrap: wrap;
  // grid-template-columns: max-content 1fr;
  gap: 5px 3px;

  &.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 180px);
  }

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
    gap: 2px;

    padding: 3px 5px;

    label {
      color: #666;
      font-size: 80%;
      font-weight: bold;

      &:has(.input-checkbox) {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
      }
    }

    & > label {
      margin-bottom: 3px;
    }

    // &:nth-child(2n+1) {
    //   font-weight: bold;
    //   background-color: #EEE;
    // }
  }

}

</style>

<style lang="scss" scoped>
@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .setting-list {
    width: 100%;
    gap: 3px;

    &.grid {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }

    > div {
      min-width: 0;
      max-width: 100%;
      padding: 3px 4px;
    }
  }
}
</style>
