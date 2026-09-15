<script setup>
defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: { default: '' },
})

const emits = defineEmits(['update:modelValue', 'input', 'keydown'])
const input = ref()

function onInput(event) {
  emits('update:modelValue', event.target.value)
  emits('input', event)
}

defineExpose({
  focus: () => input.value?.focus(),
  select: () => input.value?.select(),
})
</script>

<template>
  <input
    ref="input"
    v-bind="$attrs"
    class="form-input"
    type="text"
    :value="modelValue"
    @input="onInput"
    @keydown="emits('keydown', $event)"
  >
</template>
