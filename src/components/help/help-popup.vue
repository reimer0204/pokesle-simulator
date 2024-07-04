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

  main {
    white-space: pre-wrap;

    h1, h2, h3 {
      font-weight: bold;
    }
    
  }
}
</style>