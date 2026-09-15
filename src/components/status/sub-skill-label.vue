<script setup>
import SubSkill from '../../data/sub-skill';

const props = defineProps({
  subSkill: { required: true },
  short: { type: Boolean, default: false },
  silverSeed: { type: Boolean, default: false },
  fix: { type: Boolean, default: false },
})

const subSkill = computed(() => props.subSkill);

</script>

<template>
  <div class="sub-skill-label"
    :class="[
      `sub-skill-${subSkill.rarity}`,
      {
        short: props.short,
        fix: props.fix,
      }
    ]"
  >
    {{ props.short ? subSkill.short : subSkill.name }}
    <img v-if="props.silverSeed" src="../../img/sub-skill-seed.png" />
  </div>
</template>

<style lang="scss" scoped>
.sub-skill-label {
  display: flex;
  justify-content: center;
  width: 11.5em;
  padding: 2px 0px;
  white-space: nowrap;
  position: relative;

  font-size: 80%;
  font-weight: bold;
  border-radius: 5px;

  &.short {
    width: 5em;
    padding: 2px 0;
  }

  &.disabled {
    opacity: 0.5;
    font-weight: normal;
  }

  &.sub-skill-1 { background-color: #f6f7fc; border: 1px solid #bfc8de; color: #3b4663; }
  &.sub-skill-2 { background-color: #eaf5ff; border: 1px solid #9dc9ef; color: #2c5277; }
  &.sub-skill-3 { background-color: #fff4d9; border: 1px solid #e5bd70; color: #76511f; }

  &.fix {
    color: #F00;
  }

  img {
    position: absolute;
    width: 10px;
    top: -5px;
    right: -5px;
  }
}
</style>
