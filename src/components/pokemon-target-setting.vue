<script setup lang="ts">
import Pokemon from '@/data/pokemon.ts';
import Skill from '@/data/skill.ts';
import {
  getPokemonTargetFriendPointList,
  matchesPokemonTarget,
  pokemonTargetSpecialtyList,
} from '@/models/pokemon-target.ts';

const props = defineProps<{ target: any }>();

const lastPokemonList = computed(() => Pokemon.nameSortList.filter((pokemon) => pokemon.isLast));
const friendPointList = getPokemonTargetFriendPointList();

function getTargetType() {
  if (props.target.type != null) return props.target.type;
  if (props.target.all) return 'all';
  if (props.target.pokemonNameList?.length) return 'pokemon';
  return 'condition';
}

function setTargetType(type: string) {
  props.target.type = type;
  props.target.all = type === 'all';
  if (type !== 'condition') {
    for (const specialty of pokemonTargetSpecialtyList) props.target.specialties[specialty] = false;
    props.target.skillNameList = [];
    props.target.friendPoint = null;
  }
  if (type !== 'pokemon') props.target.pokemonNameList = [];
}

function getTargetLabel() {
  const type = getTargetType();
  if (type === 'all') return '全員';
  if (type === 'pokemon') return `ポケモン：${props.target.pokemonNameList.join('・')}`;

  const targetList = [
    ...pokemonTargetSpecialtyList
      .filter((specialty) => props.target.specialties[specialty])
      .map((specialty) => `${specialty}とくい`),
    ...props.target.skillNameList,
    ...(props.target.friendPoint != null
      ? [`フレンドポイント${props.target.friendPoint}以上`]
      : []),
  ];
  return targetList.length ? targetList.join('・') : '条件で指定（未選択）';
}

function getConditionPokemonList() {
  return lastPokemonList.value.filter((pokemon) => matchesPokemonTarget(props.target, pokemon));
}

function setFriendPoint(value: number | string) {
  props.target.friendPoint = value === '' ? null : Number(value);
}
</script>

<template>
  <SettingButton title="対象を設定" class="pokemon-target-button" fit-viewport>
    <template #label>{{ getTargetLabel() }}</template>
    <div class="pokemon-target-popup">
      <div class="pokemon-target-type">
        <InputRadio
          :model-value="getTargetType()"
          value="all"
          @update:model-value="setTargetType($event)"
          >全員</InputRadio
        >
        <InputRadio
          :model-value="getTargetType()"
          value="condition"
          @update:model-value="setTargetType($event)"
          >条件で指定</InputRadio
        >
        <InputRadio
          :model-value="getTargetType()"
          value="pokemon"
          @update:model-value="setTargetType($event)"
          >ポケモンで指定</InputRadio
        >
      </div>
      <template v-if="getTargetType() === 'condition'">
        <div class="condition-target-list">
          <SettingGroup title="とくい" class="condition-target-group">
            <InputCheckbox
              v-for="specialty in pokemonTargetSpecialtyList"
              v-model="target.specialties[specialty]"
              >{{ specialty }}とくい</InputCheckbox
            >
          </SettingGroup>
          <strong class="condition-and">かつ</strong>
          <SettingGroup title="スキル" class="condition-target-group">
            <template v-for="category in Skill.categoryList" :key="category.id">
              <h4>{{ category.name }}</h4>
              <InputCheckbox
                v-for="skill in category.skillList"
                :key="skill.name"
                :model-value="target.skillNameList.includes(skill.name)"
                @update:model-value="
                  $event
                    ? target.skillNameList.push(skill.name)
                    : target.skillNameList.splice(target.skillNameList.indexOf(skill.name), 1)
                "
                >{{ skill.name }}</InputCheckbox
              >
            </template>
          </SettingGroup>
          <strong class="condition-and">かつ</strong>
          <SettingGroup title="種ポケフレンドポイント" class="condition-target-group">
            <InputSelect
              :model-value="target.friendPoint ?? ''"
              @update:model-value="setFriendPoint($event)"
            >
              <option value="">指定なし</option>
              <option v-for="friendPoint in friendPointList" :value="friendPoint">
                {{ friendPoint }}以上
              </option>
            </InputSelect>
          </SettingGroup>
        </div>
        <div class="matched-pokemon-list">
          <strong>対象ポケモン</strong
          ><span v-for="pokemon in getConditionPokemonList()">{{ pokemon.name }}</span
          ><span v-if="!getConditionPokemonList().length">該当なし</span>
        </div>
      </template>
      <div v-else-if="getTargetType() === 'pokemon'" class="pokemon-target-list">
        <InputCheckbox
          v-for="pokemon in lastPokemonList"
          :model-value="target.pokemonNameList.includes(pokemon.name)"
          @update:model-value="
            $event
              ? target.pokemonNameList.push(pokemon.name)
              : target.pokemonNameList.splice(target.pokemonNameList.indexOf(pokemon.name), 1)
          "
          >{{ pokemon.name }}</InputCheckbox
        >
      </div>
    </div>
  </SettingButton>
</template>

<style lang="scss" scoped>
.pokemon-target-button {
  width: 100%;
  max-width: 100%;
}
.pokemon-target-popup {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.pokemon-target-type {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-line);
}
.condition-target-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
  flex: 1 1 auto;
  min-height: 0;
  gap: 15px;
  align-items: stretch;
  margin-top: 15px;
}
.condition-target-list > :deep(.condition-target-group) {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
:deep(.condition-target-group .setting-group-body) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 5px;
  min-height: 0;
  overflow: auto;
}
.condition-and {
  display: flex;
  align-items: center;
  color: var(--color-primary-strong);
}
.matched-pokemon-list {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 20vh;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 5px 10px;
  height: 20vh;
  margin-top: 15px;
  padding-top: 10px;
  overflow: auto;
  border-top: 1px solid var(--color-line);
}
.matched-pokemon-list strong {
  width: 100%;
  color: var(--color-primary-strong);
}
.pokemon-target-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  flex: 1 1 auto;
  min-height: 0;
  gap: 5px 10px;
  margin-top: 15px;
  overflow: auto;
}
@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .condition-target-list {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .condition-and {
    justify-content: center;
  }
  .pokemon-target-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
