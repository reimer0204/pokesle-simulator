<script setup>
defineOptions({ inheritAttrs: false })
</script>

<template>
  <button v-bind="$attrs" class="form-button"><slot /></button>
</template>
