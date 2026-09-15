<script setup>
defineOptions({ inheritAttrs: false })

const input = ref()

defineExpose({
  click: () => input.value?.click(),
  focus: () => input.value?.focus(),
})
</script>

<template>
  <input ref="input" v-bind="$attrs" class="form-input" type="file">
</template>
