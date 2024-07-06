<script setup>
import PopupBase from '../popup-base.vue';
import { marked } from 'marked'

// そのうちmarkdownとしてちゃんと処理する
const props = defineProps({
  title: { type: String },
  markdown: { type: String },
})

let html = computed(() => {
  return marked(props.markdown.replace(/^[ \t]+/mg, '').trim());
})
</script>

<template>
  <PopupBase class="help-popup" @close="$emit('close')">
    <template #headerText>{{ title }}</template>

    <main v-html="html"></main>
  </PopupBase>
</template>

<style lang="scss" scoped>
.help-popup {
  max-width: 770px;

  :deep(main) {
    white-space: pre-wrap;

    h1, h2, h3 {
      font-weight: bold;
    }

    h1 {
      font-size: 20px;
      border-bottom: 2px #CCC solid;
    }
    
  }
}
</style>