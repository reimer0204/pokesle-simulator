<script setup>
import Popup from './popup.ts'

</script>

<template>
  <div class="popup-area" v-if="Popup.list.length">
    <div v-for="(popup, i) in Popup.list" class="scroll" @mousedown.self="popup.close()">
      <div class="popup">
        <component
          :is="popup.component" v-bind="popup.bind"
          :id="popup.uuid"
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
      flex-direction: column;
      justify-content: center;
      align-items: center;
      pointer-events: none;

      & > * {
        max-width: calc(100% - 50px);
        pointer-events: auto;
      }
    }
  }

}
</style>

<style lang="scss" scoped>
@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .popup-area .scroll {
    padding: 4px 0;

    .popup {
      min-height: 100%;
      justify-content: flex-start;

      > * {
        max-width: calc(100% - 8px);
        // 余白がある時だけ中央寄せにし、画面より高いポップアップは先頭からスクロールできるようにする。
        margin: auto 0;
      }
    }
  }
}
</style>
