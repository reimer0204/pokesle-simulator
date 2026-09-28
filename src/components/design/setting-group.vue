<script setup lang="ts">
const props = defineProps<{ title: string }>();
const slots = useSlots();
</script>

<template>
  <section class="setting-group">
    <header class="setting-group-header">
      <h3>{{ props.title }}</h3>
      <div v-if="slots.actions" class="setting-group-actions"><slot name="actions" /></div>
    </header>
    <div class="setting-group-body"><slot /></div>
  </section>
</template>

<style lang="scss" scoped>
.setting-group {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 7px;
  background: var(--color-surface);
}
.setting-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 9px;
  border-bottom: 1px solid var(--color-line);
  background: var(--color-primary-soft);

  h3 {
    margin: 0;
    color: var(--color-primary-strong);
    font-size: 1rem;
  }
}
.setting-group-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}
.setting-group-body {
  min-width: 0;
  padding: 9px;
}
</style>
