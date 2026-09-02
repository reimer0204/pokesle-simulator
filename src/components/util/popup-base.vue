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

<style lang="scss" scoped>
@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .popup-base {
    width: calc(100vw - 8px) !important;
    max-width: calc(100vw - 8px) !important;
    max-height: calc(100dvh - 8px);
    overflow: auto;
    border-radius: 5px;

    .header {
      position: sticky;
      top: 0;
      z-index: 5;
      padding: 6px 8px;
      font-size: 16px;
      background-color: #FFF;
    }

    .body-wrapper {
      min-width: 0;
      padding: 8px;
    }
  }
}
</style>
