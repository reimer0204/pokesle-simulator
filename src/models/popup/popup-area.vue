<script setup>
import Popup from './popup.js'

</script>

<template>
  <div class="popup-area" v-if="Popup.list.length">
    <div v-for="(popup, i) in Popup.list" class="scroll" @mousedown.self="popup.close()">
      <div class="popup">
        <component
          :is="popup.component" v-bind="popup.bind"
          @close="popup.close($event)"
          @input="popup.input = $event"
          @click.native.stop>
        </component>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.popup-area {
  position: fixed;
  inset: 0;
  z-index: 999;
  height: 100%;

  .scroll {
    display: block;
    height: 100%;
    position: fixed;
    inset: 0;
    overflow: auto;
    padding: 70px 0;
    background-color: rgba(0, 0, 0, 0.2);
    
    .popup {
      min-height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: none;

      & > * {
        pointer-events: auto;
      }
    }
  }

}
</style>