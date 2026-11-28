<script setup>
import { mdiFilterOutline, mdiFilterCheck } from '@mdi/js';

const props = defineProps({
  column: { type: Object, required: true },
  modelValue: { default: null },
});
const emit = defineEmits(['update:modelValue']);
const anchor = ref(null);
const panel = ref(null);
const open = ref(false);
const draft = ref(null);
const position = ref({});
const selected = computed(() => new Set(draft.value ?? []));
const validRange = computed(() => draft.value?.min <= draft.value?.max);

function updatePosition() {
  if (!open.value || !anchor.value) return;
  const rect = anchor.value.getBoundingClientRect();
  position.value = {
    left: `${Math.max(8, Math.min(rect.left, window.innerWidth - 296))}px`,
    top: `${rect.bottom + 4}px`,
    maxHeight: `${Math.max(0, window.innerHeight - rect.bottom - 12)}px`,
  };
}

async function toggle() {
  if (open.value) {
    open.value = false;
    return;
  }
  draft.value =
    props.column.filter.type === 'range'
      ? { min: props.column.filter.min, max: props.column.filter.max, ...props.modelValue }
      : [...(props.modelValue ?? [])];
  open.value = true;
  updatePosition();
  await nextTick();
  panel.value?.querySelector('input, [tabindex], button')?.focus();
}

function toggleOption(value, checked) {
  draft.value = checked ? [...draft.value, value] : draft.value.filter((x) => x !== value);
}

function apply() {
  const filter = props.column.filter;
  const value =
    filter.type === 'range'
      ? draft.value.min === filter.min && draft.value.max === filter.max
        ? null
        : { ...draft.value }
      : draft.value.length
        ? [...draft.value]
        : null;
  emit('update:modelValue', value);
  close();
}

function close() {
  open.value = false;
  anchor.value?.querySelector('button')?.focus();
}

function clear() {
  emit('update:modelValue', null);
  close();
}

function onPointerDown(event) {
  if (!anchor.value?.contains(event.target) && !panel.value?.contains(event.target)) {
    open.value = false;
  }
}

function onKeyDown(event) {
  if (open.value && event.key === 'Escape') {
    event.preventDefault();
    close();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', updatePosition);
  document.addEventListener('scroll', updatePosition, true);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown);
  document.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('resize', updatePosition);
  document.removeEventListener('scroll', updatePosition, true);
});
</script>

<template>
  <span
    ref="anchor"
    class="filter-anchor"
    :title="`${column.name}のフィルタ${modelValue != null ? '（絞り込み中）' : ''}`"
  >
    <FormButton class="filter-trigger" @click="toggle" :aria-expanded="open">
      <svg
        class="filter-icon"
        :class="{ active: modelValue != null }"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path :d="modelValue != null ? mdiFilterCheck : mdiFilterOutline" fill="currentColor" />
      </svg>
      <span class="filter-label"
        >{{ column.name }}のフィルタ{{ modelValue != null ? '（絞り込み中）' : '' }}</span
      >
    </FormButton>
  </span>
  <Teleport to="body">
    <div
      v-if="open"
      ref="panel"
      class="column-filter"
      :style="position"
      role="dialog"
      :aria-label="`${column.name}のフィルタ`"
    >
      <b>{{ column.name }}のフィルタ</b>
      <template v-if="column.filter.type === 'range'">
        <label>
          最小値
          <InputSlider
            v-model="draft.min"
            :min="column.filter.min"
            :max="column.filter.max"
            :step="column.filter.step ?? 1"
            aria-label="最小値"
          />
        </label>
        <label>
          最大値
          <InputSlider
            v-model="draft.max"
            :min="column.filter.min"
            :max="column.filter.max"
            :step="column.filter.step ?? 1"
            aria-label="最大値"
          />
        </label>
        <span v-if="!validRange" class="range-error">最小値は最大値以下にしてください。</span>
      </template>
      <div v-else class="filter-options">
        <InputCheckbox
          v-for="option in column.filter.options"
          :key="option.value"
          :model-value="selected.has(option.value)"
          role="checkbox"
          :aria-checked="selected.has(option.value)"
          tabindex="0"
          @update:model-value="toggleOption(option.value, $event)"
          @keydown.space.prevent="toggleOption(option.value, !selected.has(option.value))"
        >
          <slot name="option" :option="option" :column="column">{{
            option.label ?? option.value
          }}</slot>
        </InputCheckbox>
      </div>
      <div class="filter-actions">
        <FormButton @click="clear">クリア</FormButton>
        <FormButton
          class="execute"
          :disabled="column.filter.type === 'range' && !validRange"
          @click="apply"
          >決定</FormButton
        >
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.filter-anchor {
  display: inline-flex;
  .filter-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: inherit;
    box-shadow: none;

    &:hover:not(:disabled) {
      background: rgb(255 255 255 / 25%);
      box-shadow: none;
      transform: none;
    }
  }
  .filter-icon {
    width: 14px;
    height: 14px;
    flex: 0 0 auto;
    opacity: 0.45;
    &.active {
      color: var(--color-mint-soft);
      opacity: 1;
    }
  }
  .filter-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
.column-filter {
  position: fixed;
  z-index: 100;
  box-sizing: border-box;
  width: min(280px, calc(100vw - 16px));
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--color-surface);
  color: var(--color-ink);
  border: 1px solid var(--color-line);
  border-radius: 6px;
  box-shadow: var(--shadow-control);
  text-align: left;
  font-weight: normal;

  :deep(.input-slider-value) {
    min-width: 60px;
  }
}
.filter-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.filter-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.range-error {
  color: var(--color-danger);
}
</style>
