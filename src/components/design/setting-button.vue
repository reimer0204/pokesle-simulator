<script setup>
import Popup from '@/models/popup/popup.ts';
import SettingButtonPopup from './setting-button-popup.vue';

const props = defineProps({
  title: { type: String },
  important: { type: Boolean },
  fitViewport: { type: Boolean, default: false },
});
defineOptions({
  inheritAttrs: false,
});
const emit = defineEmits(['close']);

let popup = ref(null);
async function showPopup() {
  const promise = Popup.show(SettingButtonPopup);
  popup.value = promise.popup;
  await promise;
  popup.value = null;
  emit('close');
}
</script>

<template>
  <FormButton
    class="setting-button"
    @click="$attrs.onClick ? $attrs.onClick() : showPopup()"
    :class="{
      important: props.important,
    }"
  >
    <slot name="label"></slot>

    <svg class="setting-button-arrow" viewBox="0 0 100 100">
      <path d="M10,25L50,65L90,25" fill="none" stroke-width="20" stroke="#FFF" />
    </svg>

    <Teleport defer v-if="popup?.uuid" :to="`#${popup?.uuid}`">
      <div class="popup" :class="{ 'fit-viewport': props.fitViewport }">
        <slot name="header">
          <div class="header flex-row-start-center gap-15px">
            <slot name="headerText">{{ title }}</slot>

            <svg viewBox="0 0 100 100" width="20" class="ml-auto" @click="popup.close()">
              <path d="M5,5L95,95 M95,5L5,95" stroke-width="20" stroke="#888" />
            </svg>
          </div>
        </slot>

        <slot name="bodyWrapper">
          <div class="body-wrapper">
            <slot></slot>
          </div>
        </slot>
      </div>
    </Teleport>
  </FormButton>
</template>

<style lang="scss" scoped>
.setting-button {
  display: inline-flex;
  align-items: center;

  background-color: var(--color-primary-strong);
  color: #fff;

  cursor: pointer;

  .setting-button-arrow {
    flex: 0 0 1em;
    width: 1em;
    height: 1em;
    margin-left: auto;
  }

  &.important {
    background-color: var(--color-accent);
  }
}

.popup {
  pointer-events: auto;
  background-color: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 28px rgb(40 49 91 / 20%);

  .header {
    padding: 10px 15px;
    font-size: 20px;
    font-weight: bold;
    border-bottom: 1px solid var(--color-line);
    background: linear-gradient(90deg, var(--color-primary-soft), #fff);
    color: var(--color-primary-strong);
    border-radius: 9px 9px 0 0;
  }

  .body-wrapper {
    padding: 20px;
  }

  &.fit-viewport {
    box-sizing: border-box;
    width: min(850px, calc(100vw - 50px));
    height: calc(100dvh - 140px);
    display: flex;
    flex-direction: column;

    .body-wrapper {
      box-sizing: border-box;
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
    }
  }
}

@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .popup.fit-viewport {
    width: calc(100vw - 8px);
    height: calc(100dvh - 8px);
  }
}
</style>
