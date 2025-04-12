<script setup>
import Popup from '@/models/popup/popup.js';
import SettingButtonPopup from './setting-button-popup.vue';

const props = defineProps({
  title: { type: String },
  important: { type: Boolean },
})
defineOptions({
  inheritAttrs: false
})
const emit = defineEmits(['close']);

let popup = ref(null);
async function showPopup() {
  const promise = Popup.show(SettingButtonPopup);
  popup.value = promise.popup;
  await promise;
  popup.value = null;
  emit('close')
}

</script>

<template>

  <button
    class="setting-button" @click="$attrs.onClick ? $attrs.onClick() : showPopup()"
    :class="{
      important: props.important,
    }"
  >
    <slot name="label"></slot>

    <svg viewBox="0 0 100 100">
      <path d="M10,25L50,65L90,25" fill="none" stroke-width="20" stroke="#FFF" />
    </svg>

    
    <Teleport defer v-if="popup?.uuid" :to="`#${popup?.uuid}`">
      <div class="popup">
        <slot name="header">
          <div class="header flex-row-start-center gap-15px">
            <slot name="headerText">{{ title }}</slot>

            <svg viewBox="0 0 100 100" width="20" class="ml-auto" @click="popup.close()">
              <path d="M5,5L95,95 M95,5L5,95" stroke-width="20" stroke="#888"  />
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
  </button>

</template>

<style lang="scss" scoped>
.setting-button {
  display: inline-flex;
  align-items: center;

  background-color: #495057;
  color: #FFF;

  cursor: pointer;

  svg {
    width: 1em;
    height: 1em;
    margin-left: 0.5em;
  }

  &.important {
    background-color: #E40;
  }
}

.popup {
  pointer-events: auto;
  background-color: #FFF;
  border-radius: 10px;
  
  .header {
    padding: 10px 15px;
    font-size: 20px;
    font-weight: bold;
    border-bottom: 1px #CCC solid;
  }
  
  .body-wrapper {
    padding: 20px;
  }
}
</style>