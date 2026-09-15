<script setup>
const props = defineProps({
  modelValue: { default: false },
  readonly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emits = defineEmits(['update:modelValue'])

</script>

<template>
  <div
    class="input-checkbox"
    :class="{ disabled: props.disabled }"
    @click="!props.readonly && !props.disabled && emits('update:modelValue', !props.modelValue)"
  >
    <svg viewBox="0 0 100 100">
      <rect x="5" y="5" width="90" height="90" fill="#FFF" stroke="#bec6d6" stroke-width="10" rx="20" ry="20" />
      <path d="M20,43 L40,68 L80,28" fill="none" stroke="#59a98f" stroke-width="15" v-if="props.modelValue" />
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
  color: var(--color-ink);

  &:hover:not(.disabled) svg { filter: drop-shadow(0 1px 1px #66769a55); }

  svg {
    width: 1.2em;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible { outline: 3px solid #ffd166aa; border-radius: 4px; }
}
</style>
