<script setup>
defineOptions({ inheritAttrs: false });
</script>

<template>
  <button v-bind="$attrs" class="form-button"><slot /></button>
</template>

<style lang="scss" scoped>
.form-button {
  background-color: var(--color-primary);
  color: #fff;
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: 6px;
  box-shadow: var(--shadow-control);
  padding: 5px 11px;
  font-weight: bold;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover:not(:disabled) {
    background-color: var(--color-primary-strong);
    box-shadow: 0 3px 0 rgb(49 66 132 / 20%);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 3px solid #ffd166aa;
    outline-offset: 2px;
  }

  &.important {
    background-color: var(--color-danger);

    &:hover:not(:disabled) {
      background-color: var(--color-danger-strong);
    }
  }

  &.execute {
    background-color: var(--color-execute);

    &:hover:not(:disabled) {
      background-color: var(--color-execute-strong);
    }
  }

  &:disabled {
    background-color: #b7c0da;
    box-shadow: none;
    cursor: not-allowed;
  }
}

@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .form-button {
    padding: 4px 7px;
  }
}
</style>
