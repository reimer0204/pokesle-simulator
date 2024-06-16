<script setup>
import Popup from './popup.js'

</script>

<template>
  <div class="popup-area" v-if="Popup.list.length">
    <div v-for="(popup, i) in Popup.list"
      @mousedown.self="popup.close()"
      class="popup"
    >
      <component
        :is="popup.component" v-bind="popup.bind"
        @close="popup.close($event)"
        @input="popup.input = $event"
        @click.native.stop>
      </component>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.popup-area {
  position: fixed;
  inset: 0;
  z-index: 999;

  .popup {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.2);
  }
}
</style>