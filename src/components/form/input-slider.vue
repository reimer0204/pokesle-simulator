<script setup>
defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Number, default: null },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
});

const emits = defineEmits(['update:modelValue']);

const value = computed(() => {
  if (props.modelValue == null) return props.min;
  return Math.min(props.max, Math.max(props.min, props.modelValue));
});

function updateValue(event) {
  const newValue = Number(event.target.value);
  if (!Number.isFinite(newValue)) return;

  emits('update:modelValue', Math.min(props.max, Math.max(props.min, newValue)));
}
</script>

<template>
  <div class="input-slider" :class="$attrs.class">
    <input
      v-bind="$attrs"
      class="input-slider-control"
      type="range"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :value="value"
      @input="updateValue"
    />
    <input
      class="input-slider-value"
      type="number"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :value="value"
      aria-label="現在値"
      @input="updateValue"
    />
  </div>
</template>

<style lang="scss" scoped>
.input-slider {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
}

.input-slider-control {
  flex: 1;
  min-width: 0;
  height: 18px;
  margin: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.input-slider-value {
  width: 3.5em;
  min-width: 0;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.input-slider-control:disabled {
  cursor: not-allowed;
}
</style>
