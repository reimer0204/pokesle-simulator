<script setup lang="ts">
import { Food } from '@/data/food_and_cooking';

const props = defineProps({
  pokemon: {}
})

</script>

<template>
  <div class="pokemon-info flex-column-start-stretch gap-5px">
    <div class="flex-row-start-center gap-5px" v-if="props.pokemon">
      <div>
        {{ props.pokemon?.box?.index + 1 }}：<NameLabel :pokemon="props.pokemon" /> (Lv<LvLabel :pokemon="props.pokemon" />)
      </div>
      <div class="flex-row-center-center gap-2px ml-auto">
        <div v-for="(food, i) of props.pokemon.box.foodList"
          class="food"
          :class="{
            disabled: i >= props.pokemon.foodList.length,
            error: food && props.pokemon.base.foodNumListMap[food]?.[i] == null,
          }"
        >
          <img v-if="Food.map[food]?.img" :src="Food.map[food]?.img" />
          <div class="num">{{ props.pokemon.base.foodNumListMap[food]?.[i] }}</div>
        </div>
      </div>
    </div>
    <SubSkillLabelList class="sub-skill-list" :pokemon="props.pokemon" />
  </div>
</template>

<style lang="scss" scoped>

.pokemon-info {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 5px;

  label {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
  }

  .shiny {
    font-weight: bold;
    color: #E52;
  }

  .food {
    width: 24px;
    height: 24px;
    padding: 1px;
    position: relative;

    &.disabled {
      opacity: 0.5;
    }
    &:not(.disabled) {
      background-color: #FFF;
      border-radius: 3px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    &.error {
      background-color: red;
    }

    img {
      width: 100%;
    }

    .num {
      position: absolute;
      right: 2px;
      bottom: -2px;
      font-weight: bold;
      font-size: 80%;

      text-shadow:
        0px 0px 3px #FFF,
        0px 0px 3px #FFF,
        0px 0px 3px #FFF,
        0px 0px 3px #FFF,
        0px 0px 3px #FFF;
    }
  }

  .skill-lv {
    &.skill-lv-auto {
      color: #BBB;
    }
    &:not(.skill-lv-auto) {
      font-weight: bold;
    }
  }

  .sub-skill-list {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 3px;
  }

  .sub-skill {
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

  .evaluate-detail {
    display: grid;
    font-size: 90%;
    gap: 3px 5px;
    grid-template-columns: 6em max-content;
    align-items: center;

    .best {
      font-weight: bold;
    }
  }

  .percentile {
    color: #04C;
    text-decoration: underline;
    // border-bottom: 1px #04C solid;
    cursor: pointer;

    &:hover {
      background-color: #0481;
    }
  }

  .async-watcher-area {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex: 1 1 0;
  }
  .sortable-table {
    flex: 1 1 0;
  }
}
</style>