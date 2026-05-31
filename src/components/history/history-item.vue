<script lang="ts" setup>
const props = defineProps<{
  date: string;
}>();

const content = ref<HTMLDivElement>();

const historyText = computed(() => {
  function toText(ul: HTMLElement, nest = 0): string {
    let result = [];
    for(const e of ul?.childNodes ?? []) {
      if(e instanceof HTMLLIElement) {
        result.push('  '.repeat(nest) + '- ' + e.childNodes[0].textContent?.trim());
        const ul = e.querySelector('ul');
        if(ul) {
          result.push(toText(ul, nest + 1));
        }
      }
    }
    return result.join('\n');
  }
  const ul = content.value?.querySelector('ul');
  if (ul == null) return null;
  return toText(ul);
})

function shareX() {
  let text = [
    `【ポケスリシミュ更新】`,
    historyText.value,
    ``,
    `https://reimer0204.github.io/pokesle-simulator/`,
    `#ポケスリ #ポケスリシミュ`,
  ].join('\n');
  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`)
}

</script>

<template>
  <div class="history-item">
    <h3 class="flex-row-start-center gap-5px">
      {{ props.date }}
      <div class="x" @click="shareX" v-if="historyText"><img src="@/img/x.svg"></div>
    </h3>
    <div ref="content">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
h3 {
  font-size: 18px;
  line-height: 1.4;
  margin: 0.5em 0 0.25em 0;
  border-bottom: 2px #CCC solid;
  cursor: pointer;
}

.x {
  background-color: #000;
  width: 18px;
  height: 18px;
  padding: 4px;
  border-radius: 50%;
}
</style>