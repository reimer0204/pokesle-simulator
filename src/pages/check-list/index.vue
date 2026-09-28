<script setup lang="ts">
import { Cooking, Food } from '@/data/food_and_cooking';
import SortableTable from '../../components/sortable-table.vue';
import Berry from '../../data/berry';
import config from '../../models/config.ts';
import PokemonInfo from './pokemon-info.vue';
import SimulationSelectType from '@/components/simulation-select-type.vue';
import Pokemon from '@/data/pokemon.ts';
import InputCheckbox from '@/components/form/input-checkbox.vue';
import InputRadio from '@/components/form/input-radio.vue';
import PokemonSimulator from '@/models/simulation/pokemon-simulator.ts';
import DesignTable from '@/components/design-table.vue';
import Skill from '@/data/skill.ts';
import SettingList from '@/components/util/setting-list.vue';
import type { FoodName } from '@/type.ts';
import Field from '@/data/field.ts';
import TablePopup from '@/components/table-popup.vue';
import Popup from '@/models/popup/popup.ts';
import HelpButton from '@/components/help/help-button.vue';
import PokemonTargetSetting from '@/components/pokemon-target-setting.vue';
import { createPokemonTarget } from '@/models/pokemon-target.ts';

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
  return Pokemon.list
    .filter((x) => x.isLast)
    .filter((x) => x.fieldList.length)
    .sort((a, b) => (a.name < b.name ? -1 : 1));
});

const filteredSaishuuShinkaPokemonList = computed(() => {
  return saishuuShinkaPokemonList.value.filter(
    (pokemon) => !config.summary.checklist.pokemonCondition.disablePokemonMap[pokemon.name],
  );
});

const activeTab = ref('pokemon');
</script>

<template>
  <div class="page">
    <TabList class="checklist-setting-tabs">
      <a
        href="#"
        :class="{ active: activeTab === 'pokemon' }"
        @click.prevent="activeTab = 'pokemon'"
      >
        各ポケモン厳選基準
      </a>
      <a href="#" :class="{ active: activeTab === 'food' }" @click.prevent="activeTab = 'food'"
        >食材厳選基準</a
      >
      <a href="#" :class="{ active: activeTab === 'skill' }" @click.prevent="activeTab = 'skill'">
        スキル厳選基準
      </a>
      <a href="#" :class="{ active: activeTab === 'other' }" @click.prevent="activeTab = 'other'"
        >その他</a
      >
    </TabList>
    <div class="checklist-setting-content">
      <section v-if="activeTab === 'pokemon'" class="pokemon-condition-section">
        <div class="pokemon-condition-overview">
          <SettingGroup title="評価方法">
            <div class="flex-column-start-start gap-5px">
              <div class="flex-row-start-center gap-5px">
                基準レベル：<InputSelect
                  v-model="config.summary.checklist.pokemonCondition.selectLv"
                >
                  <option v-for="lv in lvList" :value="lv">Lv. {{ lv }}</option>
                  <option value="max">全レベル内最大値</option>
                </InputSelect>
              </div>
              <InputRadio v-model="config.simulation.selectType" :value="0">厳選度</InputRadio>
              <InputRadio v-model="config.simulation.selectType" :value="1">2段階評価</InputRadio>
              <div v-if="config.simulation.selectType == 1">
                厳選度
                <InputNumber class="w-50px" v-model="config.simulation.selectBorder" />
                %の出力に対して
              </div>
            </div>
          </SettingGroup>
        </div>
        <div class="pokemon-condition-list">
          <SettingGroup
            v-for="(item, index) in config.summary.checklist.pokemonCondition.list"
            :key="index"
            :title="`条件 ${index + 1}`"
            class="pokemon-condition"
          >
            <template #actions>
              <FormButton
                @click="config.summary.checklist.pokemonCondition.list.swap(index, index - 1)"
                >上へ</FormButton
              >
              <FormButton
                @click="config.summary.checklist.pokemonCondition.list.swap(index, index + 1)"
                >下へ</FormButton
              >
              <FormButton @click="config.summary.checklist.pokemonCondition.list.splice(index, 1)"
                >削除</FormButton
              >
            </template>
            <div class="pokemon-condition-setting">
              <label>対象</label>
              <PokemonTargetSetting :target="item.target" />
            </div>
            <div class="pokemon-condition-setting">
              <label>食材構成</label>
              <div class="food-combination-list">
                <InputCheckbox
                  v-for="combine in ['aaa', 'aab', 'aac', 'aba', 'abb', 'abc']"
                  v-model="item[combine]"
                  >{{ combine.toUpperCase() }}</InputCheckbox
                >
              </div>
            </div>
            <div class="pokemon-condition-setting">
              <label>厳選度</label>
              <div class="pokemon-condition-score-setting">
                <label>
                  総合厳選度
                  <InputNumber class="w-50px" v-model="item.energyBorder" />
                  %以上
                </label>
                <label>
                  とくい厳選度
                  <InputNumber class="w-50px" v-model="item.specialtyBorder" />
                  %以上
                </label>
              </div>
            </div>
            <div class="pokemon-condition-setting">
              <label>食材/スキル基準達成時</label>
              <InputCheckbox v-model="item.alsoFoodAndSkill">厳選済みとする</InputCheckbox>
            </div>
          </SettingGroup>
        </div>
        <div class="pokemon-condition-footer">
          <FormButton
            @click="
              config.summary.checklist.pokemonCondition.list.push({
                target: createPokemonTarget(),
                aaa: true,
                aab: true,
                aac: true,
                aba: true,
                abb: true,
                abc: true,
                energyBorder: null,
                specialtyBorder: null,
                alsoFoodAndSkill: false,
              })
            "
            >追加</FormButton
          >
          <SettingButton title="非表示ポケモン設定">
            <template #label>
              <div class="flex-row-start-center">
                非表示ポケモン設定
                <template
                  v-if="saishuuShinkaPokemonList.length - filteredSaishuuShinkaPokemonList.length"
                >
                  ：<span class="caution"
                    >{{
                      saishuuShinkaPokemonList.length - filteredSaishuuShinkaPokemonList.length
                    }}匹</span
                  >
                </template>
              </div>
            </template>

            <div>
              <SortableTable
                class="w-300px h-600px"
                :dataList="saishuuShinkaPokemonList"
                :columnList="[
                  { key: 'name', name: 'ポケモン' },
                  {
                    key: 'checked',
                    name: '非表示',
                    convert: (x) =>
                      !config.summary.checklist.pokemonCondition.disablePokemonMap[x.name],
                  },
                ]"
                scroll
              >
                <template #checked="{ data }">
                  <InputCheckbox
                    v-model="config.summary.checklist.pokemonCondition.disablePokemonMap[data.name]"
                    >非表示</InputCheckbox
                  >
                </template>
              </SortableTable>
            </div>
          </SettingButton>
        </div>
      </section>
      <section v-else-if="activeTab === 'food'" class="food-setting-section">
        <SettingGroup title="対象食材" class="food-target-group">
          <div class="food-selection-list">
            <InputCheckbox
              v-for="food in Food.list"
              v-model="config.summary.checklist.food.enableMap[food.name]"
            >
              <img class="food-selection-icon" :src="food.img" alt="" />
              {{ food.name }}
            </InputCheckbox>
          </div>
        </SettingGroup>
        <SettingGroup title="厳選基準" class="food-criteria-group">
          <div class="food-setting-item">
            <label>基準</label>
            <div class="flex-column-start-start gap-5px">
              <div class="flex-column-start-start gap-5px">
                <InputRadio v-model="config.summary.checklist.food.borderType" :value="0"
                  >ポケモンの能力に対しての割合</InputRadio
                >
                <InputRadio v-model="config.summary.checklist.food.borderType" :value="1"
                  >必要最大数に対しての割合</InputRadio
                >
              </div>
              <div v-if="config.summary.checklist.food.borderType == 0">
                <div class="flex-row-start-center gap-5px">
                  <InputSelect v-model="config.summary.checklist.food.borderLv">
                    <option v-for="lv in lvList" :value="lv">Lv. {{ lv }}</option>
                  </InputSelect>
                  における各ポケモンの厳選度
                  <InputNumber
                    class="w-40px"
                    v-model="config.summary.checklist.food.borderRate"
                    placeholder="理論値"
                  />
                  %
                </div>
              </div>
            </div>
          </div>
          <div class="food-setting-item">
            <label>達成条件</label>
            <div>
              <InputNumber class="w-50px" v-model="config.summary.checklist.food.borderValue" />
              %以上
            </div>
          </div>
          <div class="food-setting-item">
            <div class="food-setting-label">
              捕獲対象
              <HelpButton
                title="設定について"
                markdown="
              ## 捕獲対象の設定
              食材やスキルの厳選は複数のポケモンを対象にすることが多いかと思います（ヒーラーならサーナイト、パーモット等）。
              この時、2番手3番手のポケモンは捕まえても基準を満たしにくいため、捕まえるかどうか悩むラインになります。
              この「捕獲対象」の設定値は、その何番手まで捕まえるかの設定になります。

              例えばあるスキルの厳選基準を10回/日としたとします。
              仮にあるポケモンの理論値が10回の場合は、理論値を引かなければならず、このポケモンで厳選基準を満たすのは現実的ではありません。
              この時、例えば捕獲対象を80%にしておくと、理論値の8割を参照して8回になるので、このポケモンは捕獲候補から外れます。
              "
              ></HelpButton>
            </div>
            <div>
              そのポケモンの理論値の
              <InputNumber class="w-50px" v-model="config.summary.checklist.food.targetValue" />
              %以上が上記基準を超えるポケモン
            </div>
          </div>
        </SettingGroup>
      </section>
      <section v-else-if="activeTab === 'skill'" class="skill-setting-section">
        <SettingGroup title="対象スキル" class="skill-target-group">
          <InputCheckbox v-model="config.summary.checklist.skill.skillSpecialtyOnly"
            >スキルとくいが持っていないスキルをまとめて除外</InputCheckbox
          >
          <div class="skill-category-list">
            <div v-for="category in Skill.categoryList" :key="category.id">
              <h3>{{ category.name }}</h3>
              <div class="skill-selection-list">
                <template v-for="skill in category.skillList" :key="skill.name">
                  <InputCheckbox
                    v-if="
                      config.summary.checklist.skill.skillSpecialtyOnly && !skill.skillSpecialtyOnly
                    "
                    disabled
                    >{{ skill.name }}</InputCheckbox
                  >
                  <InputCheckbox
                    v-else
                    v-model="config.summary.checklist.skill.enableMap[skill.name]"
                    >{{ skill.name }}</InputCheckbox
                  >
                </template>
              </div>
            </div>
          </div>
        </SettingGroup>
        <SettingGroup title="厳選基準" class="skill-criteria-group">
          <div class="food-setting-item">
            <label>基準レベル</label>
            <div class="flex-row-start-center gap-5px">
              <InputSelect v-model="config.summary.checklist.skill.borderLv">
                <option v-for="lv in lvList" :value="lv">Lv. {{ lv }}</option>
              </InputSelect>
              における
            </div>
          </div>
          <div class="food-setting-item">
            <label>厳選度</label>
            <div>
              各ポケモンの厳選度
              <InputNumber
                class="w-40px"
                v-model="config.summary.checklist.skill.borderRate"
                placeholder="理論値"
              />
              %の
              <InputNumber class="w-40px" v-model="config.summary.checklist.skill.borderValue" />
              %以上
            </div>
          </div>
          <div class="food-setting-item">
            <div class="food-setting-label">
              捕獲対象
              <HelpButton
                title="設定について"
                markdown="
              ## 捕獲対象の設定
              食材やスキルの厳選は複数のポケモンを対象にすることが多いかと思います（ヒーラーならサーナイト、パーモット等）。
              この時、2番手3番手のポケモンは捕まえても基準を満たしにくいため、捕まえるかどうか悩むラインになります。
              この「捕獲対象」の設定値は、その何番手まで捕まえるかの設定になります。

              例えばあるスキルの厳選基準を10回/日としたとします。
              仮にあるポケモンの理論値が10回の場合は、理論値を引かなければならず、このポケモンで厳選基準を満たすのは現実的ではありません。
              この時、例えば捕獲対象を80%にしておくと、理論値の8割を参照して8回になるので、このポケモンは捕獲候補から外れます。
            "
              ></HelpButton>
            </div>
            <div>
              そのポケモンの理論値の
              <InputNumber class="w-50px" v-model="config.summary.checklist.skill.targetValue" />
              %以上が上記基準を超えるポケモン
            </div>
          </div>
        </SettingGroup>
      </section>
      <div v-else class="checklist-settings-scroll">
        <SettingGroup title="その他" class="skill-target-group">
          <div class="flex-column gap-5px">
            <InputCheckbox v-model="config.summary.checklist.field.bakecchaMatome"
              >バケッチャ・パンプジンをまとめて表示</InputCheckbox
            >
            <InputCheckbox v-model="config.summary.checklist.field.shinkago"
              >フィールド別画面に進化後を表示</InputCheckbox
            >
          </div>
        </SettingGroup>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  .scroll-x {
    overflow-x: scroll;
  }

  .pokemon-list {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
  }
}

.pokemon-condition-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.food-setting-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 10px;
  min-width: 0;
}
.skill-setting-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 10px;
  min-width: 0;
}
.food-target-group {
  grid-column: 1 / -1;
}
.skill-target-group {
  grid-column: 1 / -1;
}
.food-criteria-group {
  min-width: 0;
}
.skill-criteria-group {
  min-width: 0;
}
:deep(.food-target-group .setting-group-body),
:deep(.food-criteria-group .setting-group-body),
:deep(.skill-target-group .setting-group-body),
:deep(.skill-criteria-group .setting-group-body) {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.food-selection-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 5px 10px;
}
.food-selection-icon {
  width: 1.6em;
  height: 1.6em;
  object-fit: contain;
}
.skill-category-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skill-category-list h3 {
  margin: 0 0 5px;
}
.skill-selection-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(265px, 1fr));
  gap: 5px 10px;
}
.food-setting-item {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  align-items: start;
  column-gap: 10px;
  min-width: 0;
}
.food-setting-item > label,
.food-setting-label {
  padding-top: 3px;
  color: var(--color-muted);
  font-size: 80%;
  font-weight: bold;
}
.checklist-setting-tabs {
  flex: 0 0 auto;
  background: var(--color-surface-subtle);
}
.checklist-setting-content {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 15px;
  padding-top: 5px;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 10px;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}
.pokemon-condition-overview {
  display: grid;
  grid-template-columns: minmax(0, 360px);
}
.pokemon-condition-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 10px;
}
.pokemon-condition {
  min-width: 0;
}
:deep(.pokemon-condition .setting-group-body) {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pokemon-condition-setting {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  align-items: start;
  column-gap: 10px;
  min-width: 0;
}
.pokemon-condition-setting > label {
  padding-top: 3px;
  color: var(--color-muted);
  font-size: 80%;
  font-weight: bold;
}
.pokemon-condition-score-setting {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 10px;
}
.pokemon-condition-score-setting > label {
  white-space: nowrap;
}
.food-combination-list,
.pokemon-condition-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 10px;
}

// 設定表は列数が多いため、画面全体を押し広げず、この領域内だけを横スクロールさせる。
.checklist-settings-scroll {
  flex: 0 0 auto;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: visible;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}

.checklist-settings-table {
  width: max-content;
  min-width: 100%;
}

.caution {
  color: yellow;
}

.tab-list {
  display: flex;
  border-bottom: 3px #ccc solid;

  & > div {
    padding: 5px 15px;
    text-decoration: none;
    color: inherit;

    &.active {
      font-weight: bold;
      border-bottom: 3px #08c solid;
      margin-bottom: -3px;
      color: #08c;
    }
  }
}

@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .pokemon-condition-list {
    grid-template-columns: minmax(0, 1fr);
  }
  .pokemon-condition-footer > :deep(.setting-button) {
    max-width: 100%;
  }
}
</style>
