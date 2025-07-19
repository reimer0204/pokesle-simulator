<script setup>

import Pokemon from '../../data/pokemon';
import Skill from '../../data/skill';
import config from '../../models/config';
import PokemonBox from '../../models/pokemon-box/pokemon-box';
import PokemonFilter from '../../models/pokemon-filter';

const boxPokemonList = PokemonBox.load()

const props = defineProps({
  modelValue: { required: true }
})

const lastPokemonList = Pokemon.nameSortList.filter(x => x.isLast)

const newCondition = reactive({
  type: PokemonFilter.TYPE_LIST[0].id,
  value: null,
})

watch(() => newCondition.type, () => {
  newCondition.value = null;
})

const filterResult = computed(() => PokemonFilter.filter(boxPokemonList, props.modelValue));

const enableAdd = computed(() => newCondition.type != null && newCondition.value != null && props.modelValue.enable);

function add(mode) {
  if (!enableAdd.value) return;
  props.modelValue.conditionList.push({ ...newCondition, mode })
}

const newConditionType = computed(() => PokemonFilter.TYPE_LIST.find(x => x.id == newCondition.type))

</script>

<template>
  <div class="pokemon-filter">

    <input-checkbox v-model="props.modelValue.enable">除外フィルタを有効にする</input-checkbox>

    <div class="list-wrapper mt-10px">
      <div class="item">
        <div class="condition">ボックスすべて</div>
        <div class="count">{{ boxPokemonList.length }}件</div>
        <div class="flex-row-start-center gap-5px w-80px flex-00"></div>
      </div>
      
      <div v-for="(step, i) in filterResult.stepList" class="item">
        <div class="condition" :class="{
          add: step.mode === true,
          minus: step.mode === false,
          disabled: props.modelValue.conditionList[i].disabled,
        }">
          <svg viewBox="0 0 100 50" @click="props.modelValue.conditionList[i].disabled = !props.modelValue.conditionList[i].disabled" class="w-20px">
            <mask id="mask">
              <rect x="0" y="0" width="100" height="100" fill="white" />
            </mask>
            <rect x="0" y="0" width="100" height="50" rx="25" fill="#888" mask="url(#mask)" />
            <rect   v-if=" props.modelValue.conditionList[i].disabled"  x="5"   y="5"  width="90" height="40" rx="20" fill="#FFF" mask="url(#mask)" />
            <circle v-if=" props.modelValue.conditionList[i].disabled" cx="30" cy="25" r="15" fill="#888" />
            <circle v-if="!props.modelValue.conditionList[i].disabled" cx="70" cy="25" r="15" fill="white" />
          </svg>
          {{ step.name }}
        </div>
        <div class="count"><template v-if="step.count != null">{{ step.count }}件</template></div>

        <div class="flex-row-start-center gap-5px w-80px flex-00">
          <svg viewBox="0 0 100 100" @click="props.modelValue.conditionList.splice(i, 1)">
            <path d="M10,10L90,90 M10,90L90,10" stroke="#888" stroke-width="10" fill="none" />
          </svg>
          <svg viewBox="0 0 100 100" width="14" @click="props.modelValue.conditionList.swap(i, i - 1)">
            <path d="M0,70 L50,20 L100,70z" fill="#888" />
          </svg>
          <svg viewBox="0 0 100 100" width="14" @click="props.modelValue.conditionList.swap(i, i + 1)">
            <path d="M0,30 L50,80 L100,30z" fill="#888" />
          </svg>
        </div>
      </div>
    </div>

    <div class="flex-row-start-center gap-5px mt-10px">
      <select v-model="newCondition.type">
        <option v-for="type in PokemonFilter.TYPE_LIST" :value="type.id">{{ type.name }}</option>
      </select>

      <select v-if="newConditionType?.input == 'pokemon'" v-model="newCondition.value" class="w-200px">
        <option v-for="pokemon in Pokemon.nameSortList" :value="pokemon.name">{{ pokemon.name }}</option>
      </select>
      <select v-if="newConditionType?.input == 'last_pokemon'" v-model="newCondition.value" class="w-200px">
        <option v-for="pokemon in lastPokemonList" :value="pokemon.name">{{ pokemon.name }}</option>
      </select>
      <div v-if="newConditionType?.input == 'lv'">
        <input type="number" v-model="newCondition.value" class="w-50px" />
        Lv
      </div>
      <select v-if="newConditionType?.input == 'skill'" v-model="newCondition.value" class="w-200px">
        <option v-for="skill in Skill.list" :value="skill.name">{{ skill.name }}</option>
      </select>

      <button @click="add(true)" :disabled="!enableAdd" class="ml-auto">追加</button>
      <button @click="add(false)" :disabled="!enableAdd">除外</button>

    </div>
  </div>
</template>

<style lang="scss" scoped>

.pokemon-filter {
  .list-wrapper {
    width: 500px;
    height: 300px;
    border: 1px #000 solid;

    overflow: auto;

    div.item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 10px;

      .condition {
        display: flex;
        align-items: center;
        gap: 5px;
        min-height: 20px;
        flex: 1 1 0;

        background-color: #EEE;
        border-radius: 10px;
        padding: 2px 10px;

        &.add {
          background-color: #EFD;
        }

        &.minus {
          background-color: #FEE;
        }

        &.disabled {
          text-decoration: line-through;
        }
      }

      svg {
        width: 1em;
      }

      .count {
        width: 40px;
        margin-left: auto;

        font-weight: bold;
      }

    }
  }
}

</style>