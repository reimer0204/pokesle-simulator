<script setup>
defineOptions({ inheritAttrs: false });

defineProps({
  modelValue: { default: '' },
});

const emits = defineEmits(['update:modelValue', 'input', 'keydown']);
const textarea = ref();

function onInput(event) {
  emits('update:modelValue', event.target.value);
  emits('input', event);
}

defineExpose({
  focus: () => textarea.value?.focus(),
  select: () => textarea.value?.select(),
});
</script>

<template>
  <textarea
    ref="textarea"
    v-bind="$attrs"
    class="form-textarea"
    :value="modelValue"
    @input="onInput"
    @keydown="emits('keydown', $event)"
  />
</template>

<style lang="scss" scoped>
.form-textarea {
  resize: vertical;
}
</style>
