<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'category' | 'item' | 'field',
}>(), {
  type: 'category',
});

const tag = computed(() => props.type === 'category' ? 'h3' : props.type === 'item' ? 'h4' : 'span');
</script>

<template>
  <component :is="tag" class="setting-section-title" :class="props.type"><slot /></component>
</template>

<style lang="scss" scoped>
.setting-section-title {
  box-sizing: border-box;
  margin: 0;
  font-weight: bold;
}

.category {
  width: 100%;
  padding: 6px 9px;
  border-left: 4px solid var(--color-primary);
  border-radius: 0 5px 5px 0;
  background: var(--color-surface);
  color: var(--color-primary-strong);
  font-size: 14px;
}

.item {
  display: inline-block;
  padding: 2px 0 4px;
  border-bottom: 2px solid var(--color-primary);
  color: var(--color-primary-strong);
  font-size: 13px;
}

.field {
  color: var(--color-muted);
  font-size: 12px;
}
</style>
