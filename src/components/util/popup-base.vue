<script setup>
const props = defineProps({
  bodyClass: { type: String }
})
const $emit = defineEmits(['close'])

</script>

<template>
  <div class="popup-base">
    <slot name="header">
      <div class="header flex-row-start-center">
        <slot name="headerText"></slot>

        <svg viewBox="0 0 100 100" width="20" class="ml-auto" @click="$emit('close')">
          <path d="M5,5L95,95 M95,5L5,95" stroke-width="20" stroke="#888"  />
        </svg>
      </div>
    </slot>

    <slot name="bodyWrapper">
      <div class="body-wrapper" :class="props.bodyClass">
        <slot></slot>
      </div>
    </slot>
  </div>
</template>

<style lang="scss" scoped>

.popup-base {
  max-width: 90%;
  background-color: #FFF;
  border-radius: 10px;

  .header {
    padding: 8px 10px;
    font-size: 24px;
    font-weight: bold;
    border-bottom: 1px #CCC solid;
  }

  .body-wrapper {
    padding: 20px;
    display: flex;
    flex-direction: column;
  }
}

</style>