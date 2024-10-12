<script setup>
const props = defineProps({
  nature: { required: true },
})
</script>

<template>
  <div class="nature-info">
    {{ props.nature?.name }}
    <div class="info" v-if="props.nature">
      <div class="good">{{ props.nature?.goodShort }}</div>
      <div class="weak">{{ props.nature?.weakShort }}</div>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.nature-info {
  display: flex;
  align-items: center;
  gap: 2px;

  .info {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 65%;
    line-height: 1.1;
    font-weight: bold;

    .good {
      color: red;
    }
    .weak {
      color: blue;
    }
  }
}
</style>