<script setup lang="ts">
const props = defineProps({
  title: { type: String, required: true },
  summary: { type: String, default: '' },
})

const slots = useSlots()
</script>

<template>
  <section class="result-summary-card">
    <header class="result-summary-header">
      <h3>{{ props.title }}</h3>
      <span v-if="props.summary">{{ props.summary }}</span>
    </header>
    <div v-if="slots.default" class="result-summary-body"><slot /></div>
  </section>
</template>

<style lang="scss" scoped>
.result-summary-card {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 5px;
  background: var(--color-surface);
}

.result-summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  background: var(--color-primary-soft);

  h3 {
    margin: 0;
    font-size: 1rem;
  }

  span {
    margin-left: auto;
    font-size: .85rem;
    white-space: nowrap;
  }
}

.result-summary-body {
  min-width: 0;
}
</style>
