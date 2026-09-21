<script setup>
defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: {},
  percent: { type: Boolean, default: false },
  showSpinner: { type: Boolean, default: false },
})
const emits = defineEmits(['update:modelValue', 'keydown'])
const input = ref()

const value = computed({
  get() {
    if (props.percent) {
      return props.modelValue != null ? Number((props.modelValue * 100).toFixed(6)) : null;
    }
    return props.modelValue
  },
  set(newValue) {
    if (props.percent) {
      emits('update:modelValue', newValue === '' ? null : Number((Number(newValue) / 100).toFixed(8)));
    } else {
      emits('update:modelValue', newValue === '' ? null : Number(newValue))
    }
  }
})

defineExpose({
  focus: () => input.value?.focus(),
  select: () => input.value?.select(),
})
</script>

<template>
  <input
    ref="input"
    v-bind="$attrs"
    class="form-input input-number"
    :class="{ 'hide-spinner': !props.showSpinner }"
    type="number"
    v-model="value"
    @keydown="emits('keydown', $event)"
  />
</template>

<style lang="scss" scoped>
.hide-spinner {
  appearance: textfield;
  -moz-appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    margin: 0;
    -webkit-appearance: none;
  }
}
</style>
