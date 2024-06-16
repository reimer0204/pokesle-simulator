<script setup>
let props = defineProps({
  asyncWatcher: { type: Object, required: true },
})

</script>

<template>
  <div class="async-watcher-area">
    <slot></slot>
    
    <div v-if="props.asyncWatcher.executing" class="progress">
      <div class="name" v-if="props.asyncWatcher.name">{{ props.asyncWatcher.name }}</div>
      <div class="progress-bar">
        <div class="progress-bar-white" :style="{
          width: `${props.asyncWatcher.progress * 100}%`
        }">
        </div>
      </div>
    </div>
  </div>
</template>


<style lang="scss" scoped>
.async-watcher-area {
  position: relative;

  .progress {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;

    position: absolute;
    inset: 0;
    background-color: #0003;
    z-index: 9999;

    .name {
      color: #FFF;
      font-weight: bold;
      white-space: pre-wrap;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 10px;
      border-radius: 5px;
    }

    .progress-bar {
      width: 200px;
      height: 8px;
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.5);
      overflow: hidden;

      .progress-bar-white {
        height: 100%;
        background-color: #FFF;
      }
    }
  }
}
</style>