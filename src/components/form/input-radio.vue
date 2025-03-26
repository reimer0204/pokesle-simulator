<script setup>
const props = defineProps({
  modelValue: { default: false },
  value: { required: true },
  disabled: { type: Boolean, default: false },
})
const emits = defineEmits(['update:modelValue'])

const isChecked = computed(() => {
  return props.modelValue == props.value;
})

function onClick() {
  if (props.disabled) return;

  emits('update:modelValue', props.value)
}
</script>

<template>
  <div class="input-radio" @click="onClick" :class="{ disabled }">
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#FFF" stroke="#888" stroke-width="10" rx="20" ry="20" />
      <circle cx="50" cy="50" r="25" fill="#2C0" stroke-width="15" v-if="isChecked" />
    </svg>
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.input-radio {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 5px;

  cursor: pointer;
  user-select: none;

  svg {
    width: 1em;
  }

  &.disabled {
    opacity: 0.5;
  }
}
</style>