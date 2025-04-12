<script setup>
const props = defineProps({
  modelValue: {},
})
const emits = defineEmits(['update:modelValue'])

const value = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emits('update:modelValue', newValue === '' ? null : Number(newValue))
  }
})
</script>

<template>
  <input class="input-number" type="number" v-model="value" />
</template>

<style lang="scss" scoped>
</style>