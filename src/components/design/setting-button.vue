<script setup>
const showingPopup = ref(false);
const props = defineProps({
  title: { type: String }
})
defineOptions({
  inheritAttrs: false
})

</script>

<template>

  <button class="setting-button" @click="$attrs.onClick ? $attrs.onClick() : (showingPopup = true)">
    <slot name="label"></slot>

    <svg viewBox="0 0 100 100">
      <path d="M10,25L50,65L90,25" fill="none" stroke-width="20" stroke="#FFF" />
    </svg>

    <Teleport to="body">
      <div v-if="showingPopup" class="popup-back" @mousedown.self="showingPopup = false">
        <div class="popup-wrapper">
          <div class="popup">
                    
            <slot name="header">
              <div class="header flex-row-start-center">
                <slot name="headerText">{{ title }}</slot>

                <svg viewBox="0 0 100 100" width="20" class="ml-auto" @click="showingPopup = false">
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
        </div>
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
}

.popup-back {
  display: block;
  height: 100%;
  position: fixed;
  inset: 0;
  overflow: auto;
  padding: 70px 0;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 999;
  
  .popup-wrapper {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    pointer-events: none;

    .popup {
      pointer-events: auto;
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
      }
    }
  }
}
</style>