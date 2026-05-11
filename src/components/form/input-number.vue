<script setup>
const props = defineProps({
  modelValue: {},
  percent: { type: Boolean, default: false },
})
const emits = defineEmits(['update:modelValue'])

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
</script>

<template>
  <input class="input-number" type="number" v-model="value" />
</template>

<style lang="scss" scoped>
</style>