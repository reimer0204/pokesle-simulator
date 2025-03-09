<script setup>
const props = defineProps({
  open: { type: Boolean, default: false }
})

const isOpen = ref(props.open);

</script>

<template>
  <div class="toggle-area" :class="{ open: isOpen }">
    <h2 @click="isOpen ^= true">
      <slot name="headerText"></slot>
      <svg viewBox="0 0 100 100">
        <path :d="isOpen ? 'M8,72 L50,30 L92,72' : 'M8,38 L50,80 L92,38'" fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="round" />
      </svg>
    </h2>

    <div class="body" v-if="isOpen">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.toggle-area {
  border: 1px #CCC solid;
  border-radius: 5px;
  overflow: hidden;
  flex: 0 0 auto;

  h2 {
    display: flex;
    align-items: center;
    font-size: 18px;
    padding: 5px;
    background-color: #F8F8F8;

    svg {
      margin-left: auto;
      width: 1em;
    }
  }

  &.open {
    h2 {
      border-bottom: 1px #CCC solid;
    }
  }

  .body {
    padding: 10px;
  }
}
</style>