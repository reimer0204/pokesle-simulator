<script setup>
import Cooking from '../data/cooking';
import config from '../models/config';
import PopupBase from './util/popup-base.vue';

const checkAll = computed({
  get() { return Cooking.list.every(x => config.simulation.enableCooking[x.name]) },
  set(newValue) { Cooking.list.forEach(x => config.simulation.enableCooking[x.name] = newValue) },
})

const calcCookingList = computed(() => {
  return Cooking.evaluateLvList(config)
})

const columnList = computed(() => {
  return [
    { key: 'check', name: '', convert: data => config.simulation.enableCooking[data.name] },
    { key: 'type', name: 'タイプ' },
    { key: 'name', name: '名前' },
    { key: 'foodList', name: 'レシピ' },
    { key: 'foodNum', name: '食材数', type: Number },
    { key: 'rate', name: 'ボーナス', percent: true, fixed: 0 },
    { key: 'energy', name: '基礎エナジー', type: Number, fixed: 0 },
    // { key: 'addEnergy', name: '追加エナジー', type: Number, fixed: 0 },
    // { key: 'maxEnergy', name: 'エナジー(最大)', type: Number, fixed: 0 },
    config.simulation.cookingRecipeLvType1 ? { key: 'lv1', name: '実際のLv' } : null,
    config.simulation.cookingRecipeLvType3 ? { key: 'lv3', name: `${config.simulation.cookingRecipeRepeatLv}回\n料理時Lv` } : null,
    { key: 'lv', name: '計算Lv' },
    { key: 'fixEnergy', name: '最終エナジー', type: Number, fixed: 0 },
  ].filter(x => x)
})

</script>

<template>
  <PopupBase class="edit-pokemon-popup" @close="$emit('close')">
    <template #headerText>料理設定</template>
    <template #bodyWrapper>
      <div class="body-wrapper">
    
        <BaseAlert>
          各種シミュレーションに使用する料理を選択してください。<br>
          任意の料理のレシピレベルを上げたい場合はその料理のみチェックを入れてください。<br>
          エナジー効率が良い料理は、エナジーが高いものではなく追加エナジーが高いものになります。
        </BaseAlert>

        <SettingList>
          <div>
            <label>シミュレーション設定</label>
            <div>
              <div class="flex-row-start-center gap-20px">
                <InputCheckbox v-model.number="config.simulation.cookingRecipeLvType1" :value="1">実際のLv</InputCheckbox>
                <InputCheckbox v-model.number="config.simulation.cookingRecipeLvType2" :value="2">
                  全て<input type="number" class="w-50px" v-model.number="config.simulation.cookingRecipeFixLv" @click.stop />Lv
                </InputCheckbox>
                <InputCheckbox v-model.number="config.simulation.cookingRecipeLvType3" :value="3">
                  <input type="number" class="w-50px" v-model.number="config.simulation.cookingRecipeRepeatLv" @click.stop />
                回料理した際のLv</InputCheckbox>
              </div>
              <small class="mt-5px">
                <b>上記で選択したもののうち、最もレベルの高いものが各種シミュレーションに採用されます。</b><br>
                「個々に設定されたレシピレベルを使用する」のみを使用するのが最も正しい値になりますが、最上位料理であっても育っていない場合は評価されなくなります。<br>
                料理を育てたい通常週と、スコアアタック週で使い分けてください。
              </small>

              <div class="mt-10px">
                <InputCheckbox v-model="config.simulation.cookingExcludeLvMax">レシピレベル上げ(カンスト済みを除外)</InputCheckbox>
              </div>
            </div>
          </div>
        </SettingList>
        
        <div class="scroll">
          <SortableTable
            :dataList="calcCookingList"
            :columnList="columnList"
            :disabledColumn="data => !config.simulation.enableCooking[data.name]"
          >
            <template #header.check>
              <div class="w-100 h-100 flex-row-center-center">
                <InputCheckbox v-model="checkAll" @click.stop></InputCheckbox>
              </div>
            </template>
            <template #check="{ data }">
              <div class="w-100 h-100 flex-row-center-center" @click="config.simulation.enableCooking[data.name] = !config.simulation.enableCooking[data.name]">
                <InputCheckbox :modelValue="config.simulation.enableCooking[data.name]"></InputCheckbox>
              </div>
            </template>
            <template #lv1="{ data }">
              <template v-if="data.rate > 1">
                <input
                  class="w-50px"
                  @click.stop
                  v-model="config.simulation.cookingSettings[data.name].lv" type="number" min="1" :max="Cooking.maxRecipeLv"
                >
                <template>{{ data.lv }}</template>
              </template>
              <template v-else>-</template>
            </template>

            <template #foodList="{ data }">
              <div>
                <div v-for="{name, num} in data.foodList">{{ name }}×{{ num }}</div>
              </div>
            </template>
          </SortableTable>
        </div>
      </div>
    </template>

  </PopupBase>
</template>

<style lang="scss" scoped>
.edit-pokemon-popup {
  display: flex;
  flex-direction: column;
  width: 1100px;
  max-width: 90%;
  height: 100%;
  flex: 1 1 0;

  .body-wrapper {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 5px;

    .base-alert {
      flex: 0 0 auto;
    }

    .scroll {
      flex: 1 1 0;
      overflow: auto;
      position: relative;
    }
  }
}
</style>