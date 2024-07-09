<script setup>
import SubSkill from '../../data/sub-skill';

const props = defineProps({
  subSkill: { required: true },
  short: { type: Boolean, default: false },
  silverSeed: { type: Boolean, default: false }
})

const subSkill = computed(() => SubSkill.map[props.subSkill]);

</script>

<template>
  <div class="sub-skill-label"
    :class="[
      `sub-skill-${subSkill.rarity}`,
      {
        short: props.short,
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
  border-radius: 3px;

  &.short {
    width: 5em;
    padding: 2px 0;
  }

  &.disabled {
    opacity: 0.5;
    font-weight: normal;
  }

  &.sub-skill-1 { background-color: #F8F8F8; border: 1px #AAA solid; color: #333; }
  &.sub-skill-2 { background-color: #E0F0FF; border: 1px #9BD solid; color: #333; }
  &.sub-skill-3 { background-color: #FFF4D0; border: 1px #B97 solid; color: #422; }

  img {
    position: absolute;
    width: 10px;
    top: -5px;
    right: -5px;
  }
}
</style>