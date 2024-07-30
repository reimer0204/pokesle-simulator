<script setup>
import Cooking from '../data/cooking';
import config from '../models/config';
import PopupBase from './util/popup-base.vue';

const checkAll = computed({
  get() { return Cooking.list.every(x => config.simulation.enableCooking[x.name]) },
  set(newValue) { Cooking.list.forEach(x => config.simulation.enableCooking[x.name] = newValue) },
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
        
        <div class="scroll">
          <SortableTable
            :dataList="Cooking.list"
            :columnList="[
              { key: 'check', name: '', convert: data => config.simulation.enableCooking[data.name] },
              { key: 'type', name: 'タイプ' },
              { key: 'name', name: '名前' },
              { key: 'foodList', name: 'レシピ' },
              { key: 'rate', name: 'ボーナス', percent: true, fixed: 0 },
              { key: 'energy', name: 'エナジー', type: Number, fixed: 0 },
              { key: 'addEnergy', name: '追加エナジー', type: Number, fixed: 0 },
              { key: 'maxEnergy', name: 'エナジー(最大)', type: Number, fixed: 0 },
              { key: 'foodNum', name: '食材数', type: Number },
            ]"
            @clickRow="(data) => config.simulation.enableCooking[data.name] = !config.simulation.enableCooking[data.name]"
          >
            <template #header.check>
              <InputCheckbox v-model="checkAll" @click.stop></InputCheckbox>
            </template>
            <template #check="{ data }">
              <InputCheckbox v-model="config.simulation.enableCooking[data.name]" @click.stop></InputCheckbox>
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
  width: 1000px;
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