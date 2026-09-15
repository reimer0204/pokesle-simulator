<script setup>
defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: { default: '' },
})

const emits = defineEmits(['update:modelValue'])
const input = ref()

defineExpose({
  focus: () => input.value?.focus(),
  select: () => input.value?.select(),
})
</script>

<template>
  <input ref="input" v-bind="$attrs" class="form-input" type="password" :value="modelValue" @input="emits('update:modelValue', $event.target.value)">
</template>
