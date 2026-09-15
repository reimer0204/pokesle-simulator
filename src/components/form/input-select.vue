<script setup>
defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: {},
  modelModifiers: { default: () => ({}) },
})

const emits = defineEmits(['update:modelValue'])
const select = ref()

function getOptionValue(option) {
  const value = option?._value ?? option?.value
  if (!props.modelModifiers.number || typeof value != 'string') return value

  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? value : numberValue
}

function updateValue(event) {
  const target = event.target
  if (target.multiple) {
    emits('update:modelValue', Array.from(target.selectedOptions, getOptionValue))
  } else {
    emits('update:modelValue', getOptionValue(target.selectedOptions[0]))
  }
}

defineExpose({
  focus: () => select.value?.focus(),
})
</script>

<template>
  <select ref="select" v-bind="$attrs" class="form-select" :value="modelValue" @change="updateValue"><slot /></select>
</template>
