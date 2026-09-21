<script setup lang="ts">
import SubSkill from '@/data/sub-skill';
import FormButton from '@/components/form/form-button.vue';
import SubSkillLabel from '@/components/status/sub-skill-label.vue';

const props = defineProps<{
  modelValue: (string | null)[];
  showCandidate?: boolean;
}>();
const emits = defineEmits(['update:modelValue']);

const activeIndex = ref(0);
const subSkillList = SubSkill.list.toSorted((a, b) => b.rarity - a.rarity);

function selectSubSkill(name: string | null) {
  const value = [...props.modelValue];
  value[activeIndex.value] = name;
  emits('update:modelValue', value);

  const nextNullIndex = value.findIndex((x) => x == null);
  if (nextNullIndex >= 0) {
    activeIndex.value = nextNullIndex;
    return;
  }
}
</script>

<template>
  <div class="sub-skill-select">
    <div class="selected-list" aria-label="選択済みサブスキル">
      <div
        v-for="(name, index) in props.modelValue"
        :key="index"
        class="selected-item"
        :class="{ active: activeIndex === index }"
        @click="activeIndex = index"
      >
        <SubSkillLabel v-if="name != null" :sub-skill="SubSkill.map[name]" short />
        <span v-else>未選択</span>
      </div>
    </div>
    <div v-if="props.showCandidate !== false" class="candidate-list" aria-label="サブスキル候補">
      <SubSkillLabel
        v-for="subSkill in subSkillList"
        :key="subSkill.name"
        :sub-skill="subSkill"
        short
        @click="selectSubSkill(subSkill.name)"
      />
      <SubSkillLabel :sub-skill="null" short @click="selectSubSkill(null)" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sub-skill-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-width: 100%;
  overflow-x: auto;
  padding: 2px;
  font-size: 120%;
}

.selected-item {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 2px;
  border: 1px solid var(--color-line);
  border-radius: 6px;
  background: var(--color-surface);
  cursor: pointer;

  > span {
    width: 5em;
    color: var(--color-muted);
    font-size: 80%;
    text-align: center;
  }

  &.active {
    border-color: var(--color-mint);
    background: var(--color-mint-soft);
    box-shadow: 0 0 0 1px var(--color-mint);
  }
}

.candidate-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  font-size: 120%;

  :deep(.sub-skill-label) {
    cursor: pointer;
  }
}
</style>
