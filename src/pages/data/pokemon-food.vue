<script setup>
import { Food, Cooking } from '../../data/food_and_cooking';
import Nature from '../../data/nature';
import Pokemon from '../../data/pokemon';
import config from '../../models/config';
import PokemonSimulator from '../../models/simulation/pokemon-simulator';

const lv = ref(60);
const pokemonList = ref([])
const nature = ref(null);
const subSkill = ref(null);
const speed = ref(0);

async function calc() {
  await PokemonSimulator.isReady

  let result = [];
  let targetList = Pokemon.list.filter(pokemon => pokemon.afterList.length == 1 && pokemon.afterList[0] == pokemon.name)

  const foodCombinationList =
    lv.value < 30 ? ['0'] :
    lv.value < 60 ? [ '00', '01' ] :
    [ '000', '001', '002', '010', '011', '012' ];
  let foodIndexListList = foodCombinationList.map(x => x.split('').map(Number))

  const simulator = new PokemonSimulator(config, PokemonSimulator.MODE_ABOUT)

  let subSkillList = []
  if (subSkill.value == 1) subSkillList = ['食材確率アップS']
  if (subSkill.value == 2) subSkillList = ['食材確率アップM']
  if (subSkill.value == 3) subSkillList = ['食材確率アップS', '食材確率アップM']

  for(let base of targetList) {

    for(let foodIndexList of foodIndexListList) {

      // 食材を設定しておく
      let foodList = foodIndexList.map((f, i) => {
        const food = Food.map[base.foodList[f]?.name];
        if (food == null) return null;
        return base.foodList[f].name
      });
      if (foodList.includes(null)) continue;

      const pokemon = simulator.fromBox({
        name: base.name,
        lv: lv.value,
        foodList: foodList,
        subSkillList,
        nature: nature.value,
      });
      
      simulator.calcStatus(
        pokemon,
        speed.value / 5,
      )

      simulator.calcHelp(
        pokemon,
        0,
        0,
      )

      result.push(pokemon)
    }
  }

  pokemonList.value = result;
}
watch(lv, calc)
watch(nature, calc)
watch(subSkill, calc)
watch(speed, calc)
calc();

const columnList = computed(() => {
  return [
    { key: 'name', name: '名前', convert: x => x.base.name },
    { key: 'foodList', name: '食材' },
    ...Food.list.map(food => ({ key: food.name, name: food.name, img: food.img, type: Number, fixed: 1 })),
  ]
})

</script>

<template>
  <div class="page">
    
    <SettingList>
      <div>
        <label>Lv</label>
        <div>
          <input class="w-50px" type="number" v-model="lv" /> Lv
        </div>
      </div>

      <div>
        <label>せいかく</label>
        <div>
          <select v-model="nature">
            <option v-for="nature in Nature.list" :value="nature.name">
              {{ nature.name }}
              <template v-if="nature.good">({{ nature.good }}↑ / {{ nature.weak }}↓)</template>
            </option>
          </select>
        </div>
      </div>

      <div>
        <label>サブスキル</label>
        <div>
          <select v-model="subSkill">
            <option :value="0">-</option>
            <option :value="1">食材確率アップS</option>
            <option :value="2">食材確率アップM</option>
            <option :value="3">食材確率アップS&食材確率アップM</option>
          </select>
        </div>
      </div>

      <div>
        <label>おてスピ短縮</label>
        <div>
          <input class="w-50px" type="number" v-model="speed" max="35" /> %
        </div>
      </div>
    </SettingList>

    <div class="scroll mt-10px">
      <!-- {{ pokemonList }} -->
      <SortableTable class="pokemon-list" :dataList="pokemonList" :columnList="columnList" :fixColumn="1">
        <template #foodList="{ data, value }">
          <FoodList :pokemon="data" />
        </template>
      </SortableTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;

  min-height: 0;

  .scroll {
    flex: 1 1 0;
    min-height: 0;
    overflow: auto;
  }

  .pokemon-list {
    img {
      width: 24px;
      height: 24px;
    }
  }
}
</style>