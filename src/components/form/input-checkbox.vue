<script setup>
const props = defineProps({
  modelValue: { default: false },
})

const emits = defineEmits(['update:modelValue'])

</script>

<template>
  <div class="input-checkbox" @click="emits('update:modelValue', !props.modelValue)">
    <svg viewBox="0 0 100 100">
      <rect x="5" y="5" width="90" height="90" fill="#FFF" stroke="#888" stroke-width="10" rx="20" ry="20" />
      <path d="M20,43 L40,68 L80,28" fill="none" stroke="#2C0" stroke-width="15" v-if="props.modelValue" />
    </svg>
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.input-checkbox {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 5px;

  cursor: pointer;
  user-select: none;

  svg {
    width: 1.2em;
  }
}
</style>