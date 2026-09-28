<script setup>
const props = defineProps({
  bodyClass: { type: String },
});
const $emit = defineEmits(['close']);
</script>

<template>
  <div class="popup-base">
    <slot name="header">
      <div class="header flex-row-start-center">
        <slot name="headerText"></slot>

        <svg viewBox="0 0 100 100" width="20" class="ml-auto" @click="$emit('close')">
          <path d="M5,5L95,95 M95,5L5,95" stroke-width="20" stroke="#888" />
        </svg>
      </div>
    </slot>

    <slot name="bodyWrapper">
      <div class="body-wrapper" :class="props.bodyClass">
        <slot></slot>
      </div>
    </slot>

    <slot name="footer"></slot>
  </div>
</template>

<style lang="scss" scoped>
.popup-base {
  max-width: 90%;
  background-color: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgb(40 49 91 / 22%);

  .header {
    padding: 8px 10px;
    font-size: 24px;
    font-weight: bold;
    border-bottom: 1px solid var(--color-line);
    background: linear-gradient(90deg, var(--color-primary-soft), #fff);
    color: var(--color-primary-strong);
    border-radius: 11px 11px 0 0;
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
      background-color: #fff;
      border-radius: 4px 4px 0 0;
    }

    .body-wrapper {
      min-width: 0;
      padding: 8px;
    }
  }
}
</style>
