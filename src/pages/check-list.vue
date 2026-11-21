<script setup lang="ts">
import { Cooking, Food } from '@/data/food_and_cooking';
import SortableTable from '../components/sortable-table.vue';
import AsyncWatcherArea from '../components/util/async-watcher-area.vue';
import { AsyncWatcher } from '../models/async-watcher.js';
import config from '../models/config.ts';
import MultiWorker from '../models/multi-worker.js';
import PokemonListSimulator from '../models/pokemon-box/pokemon-box-worker?worker';
import PokemonBox from '../models/pokemon-box/pokemon-box.js';
import EvaluateTable from '../models/simulation/evaluate-table.ts';
import Pokemon from '@/data/pokemon.ts';
import InputCheckbox from '@/components/form/input-checkbox.vue';
import InputRadio from '@/components/form/input-radio.vue';
import DesignTable from '@/components/design-table.vue';
import Skill from '@/data/skill.ts';
import type { PokemonBoxType, SimulatedPokemon } from '@/type.ts';
import Field from '@/data/field.ts';
import TablePopup from '@/components/table-popup.vue';
import Popup from '@/models/popup/popup.ts';
import { CheckList, withMintChecked } from '@/models/check-list.ts';
import Nature from '@/data/nature';

let lvList = Object.entries(config.selectEvaluate.levelList)
  .filter(([lv, enable]) => enable)
  .map(([lv]) => Number(lv));

if (
  config.summary.checklist.food.borderLv == null ||
  !lvList.includes(config.summary.checklist.food.borderLv)
) {
  config.summary.checklist.food.borderLv = lvList.filter((x) => x >= 60)[0] ?? lvList.at(-1);
}
if (
  config.summary.checklist.skill.borderLv == null ||
  !lvList.includes(config.summary.checklist.skill.borderLv)
) {
  config.summary.checklist.skill.borderLv = lvList.filter((x) => x >= 60)[0] ?? lvList.at(-1);
}

const saishuuShinkaPokemonList = computed(() => {
  return Pokemon.list.filter((x) => x.isLast).sort((a, b) => (a.name < b.name ? -1 : 1));
});

const filteredSaishuuShinkaPokemonList = computed(() => {
  return saishuuShinkaPokemonList.value.filter(
    (pokemon) => !config.summary.checklist.pokemonCondition.disablePokemonMap[pokemon.name],
  );
});

let evaluateTable = EvaluateTable.load(config);
let promisedEvaluateTable = ref({});
evaluateTable.then((table) => {
  promisedEvaluateTable.value = table ?? {};
});
let multiWorker = new MultiWorker(PokemonListSimulator);
onBeforeUnmount(() => {
  multiWorker.close();
});

const checkList = computed(() => {
  return promisedEvaluateTable.value ? new CheckList(config, promisedEvaluateTable.value) : null;
});

let simulatingCount = 0;
const simulatedPokemonList = ref<SimulatedPokemon[]>([]);
const mintSimulatedPokemonList = ref<SimulatedPokemon[]>([]);
const asyncWatcher = AsyncWatcher.init();
let simulatingPromise: Promise<SimulatedPokemon[]>;
async function createPokemonList(setConfig = false) {
  if (simulatingCount > 1) return;

  simulatingCount++;
  try {
    await simulatingPromise;
  } finally {
  }

  try {
    simulatingPromise = asyncWatcher.run(async (progressCounter) => {
      // ミント前後を別個体として渡し、食材数・スキル回数もそれぞれの性格で計算する。
      const pokemonList: PokemonBoxType[] = PokemonBox.list;
      const result: SimulatedPokemon[] = await PokemonBox.simulation(
        pokemonList.flatMap((pokemon) => [
          pokemon,
          ...(config.summary.checklist.showMint && Nature.map[pokemon.nature]?.good
            ? [{ ...pokemon, nature: 'がんばりや', useMint: true }]
            : []),
        ]),
        multiWorker,
        await evaluateTable,
        {
          ...config,
          pureMint: false,
          simulation: {
            ...config.simulation,
            bagOverOperation: false,
            fix: false,
          },
        },
        progressCounter,
        true,
      );
      for (let simulatedPokemon of result) {
        simulatedPokemon.foodCombination = simulatedPokemon
          .box!.foodList.map((x) =>
            String.fromCharCode(simulatedPokemon.base.foodList.findIndex((f) => f.name == x) + 65),
          )
          .join('');
      }
      simulatedPokemonList.value = result.filter((pokemon) => !pokemon.box?.useMint);
      mintSimulatedPokemonList.value = result.filter((pokemon) => pokemon.box?.useMint);
    });
  } finally {
    simulatingCount--;
  }
}
createPokemonList();
watch(
  () => [
    config.simulation.selectType,
    config.simulation.selectBorder,
    PokemonBox.watch.value,
    config.summary.checklist.showMint,
  ],
  () => {
    createPokemonList(true);
  },
);

const pokemonCheckList = computed(() => {
  const normal = checkList.value?.pokemonCheckList(
    config,
    simulatedPokemonList.value,
    null,
    normalFoodCheckList.value,
    normalSkillCheckList.value,
  );
  if (!config.summary.checklist.showMint) return normal;
  const mint = checkList.value?.pokemonCheckList(
    config,
    mintSimulatedPokemonList.value,
    null,
    mintFoodCheckList.value,
    mintSkillCheckList.value,
  );
  const combined = checkList.value?.pokemonCheckList(
    config,
    [...simulatedPokemonList.value, ...mintSimulatedPokemonList.value],
    null,
    combinedFoodCheckList.value,
    combinedSkillCheckList.value,
  );
  return withMintChecked(
    normal,
    mint,
    (row) => row.name,
    combined,
    config.summary.checklist.field.excludeMint,
  );
});

const foodCheckList = computed(() => {
  if (!config.summary.checklist.showMint) return normalFoodCheckList.value;
  return withMintChecked(
    normalFoodCheckList.value,
    mintFoodCheckList.value,
    (row) => row.food.name,
    combinedFoodCheckList.value,
    config.summary.checklist.field.excludeMint,
  );
});

const skillCheckList = computed(() => {
  if (!config.summary.checklist.showMint) return normalSkillCheckList.value;
  return withMintChecked(
    normalSkillCheckList.value,
    mintSkillCheckList.value,
    (row) => row.skill.name,
    combinedSkillCheckList.value,
    config.summary.checklist.field.excludeMint,
  );
});

const normalFoodCheckList = computed(() =>
  checkList.value?.foodCheckList(config, simulatedPokemonList.value),
);
const normalSkillCheckList = computed(() =>
  checkList.value?.skillCheckList(config, simulatedPokemonList.value),
);
const combinedFoodCheckList = computed(() =>
  checkList.value?.foodCheckList(config, [
    ...simulatedPokemonList.value,
    ...mintSimulatedPokemonList.value,
  ]),
);
const combinedSkillCheckList = computed(() =>
  checkList.value?.skillCheckList(config, [
    ...simulatedPokemonList.value,
    ...mintSimulatedPokemonList.value,
  ]),
);
const mintFoodCheckList = computed(() =>
  checkList.value?.foodCheckList(config, mintSimulatedPokemonList.value),
);
const mintSkillCheckList = computed(() =>
  checkList.value?.skillCheckList(config, mintSimulatedPokemonList.value),
);
</script>

<template>
  <div class="page">
    <div class="tab-list">
      <router-link to="/check-list/">厳選基準設定</router-link>
      <router-link to="/check-list/pokemon">ポケモン</router-link>
      <router-link to="/check-list/food">食材</router-link>
      <router-link to="/check-list/skill">スキル</router-link>
      <router-link to="/check-list/field">フィールド別</router-link>
    </div>

    <AsyncWatcherArea :asyncWatcher="asyncWatcher" class="flex-110 flex-column mt-10px">
      <router-view
        class="flex-110"
        :simulatedPokemonList="simulatedPokemonList"
        :promisedEvaluateTable="promisedEvaluateTable"
        :pokemonCheckList="pokemonCheckList"
        :foodCheckList="foodCheckList"
        :skillCheckList="skillCheckList"
      />
    </AsyncWatcherArea>
  </div>
</template>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100%;
  min-height: 0;

  > .async-watcher-area {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;

    > :deep(.page) {
      flex: 1 1 0;
      min-height: 0;
    }
  }

  .scroll-x {
    overflow-x: scroll;
  }

  .pokemon-list {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
  }
}

.caution {
  color: yellow;
}

.tab-list {
  display: flex;
  flex: 0 0 auto;
  border-bottom: 3px #ccc solid;

  & > a {
    padding: 5px 15px;
    text-decoration: none;
    color: inherit;

    &.router-link-exact-active {
      font-weight: bold;
      border-bottom: 3px #08c solid;
      margin-bottom: -3px;
      color: #08c;
    }
  }
}
</style>
