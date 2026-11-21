<script setup>
import PopupBase from './util/popup-base.vue';
import SettingSectionTitle from './design/setting-section-title.vue';
import InputRadio from './form/input-radio.vue';
import FormButton from './form/form-button.vue';
import AndroidPokemonReader from '../models/ocr/android-pokemon-reader';
import AndroidPokemonRegistration from '../models/ocr/android-pokemon-registration';

const emit = defineEmits(['close']);
const condition = ref('all');
const running = ref(false);
const finished = ref(false);
const status = ref('');
const registered = ref(0);
const skipped = ref(0);
const currentPokemon = ref(null);
const abortButton = ref(null);
let reader;
let registration;
let appElement;
let previousInert = false;
let cancelled = false;

function unlock() {
  if (appElement) appElement.inert = previousInert;
  appElement = null;
}

async function start() {
  if (running.value || finished.value) return;
  running.value = true;
  appElement = document.getElementById('app');
  previousInert = appElement?.inert ?? false;
  if (appElement) appElement.inert = true;
  await nextTick();
  abortButton.value?.$el.focus();
  try {
    reader = new AndroidPokemonReader();
    registration = new AndroidPokemonRegistration();
    status.value = '厳選情報の計算を準備しています。';
    await registration.initialize();
    if (cancelled) return;
    await reader.read(
      async (result) => {
        currentPokemon.value = result.pokemonName;
        const saved = await registration.register(result, condition.value);
        if (cancelled) return;
        if (saved) registered.value++;
        else skipped.value++;
        // 次の個体へ、前の個体の入力や判定を引き継がない。
        currentPokemon.value = null;
      },
      (message) => {
        status.value = message;
      },
    );
  } catch (error) {
    if (!cancelled)
      status.value =
        error instanceof Error ? error.message : String(error ?? '取得に失敗しました。');
  } finally {
    reader?.stop();
    registration?.stop();
    currentPokemon.value = null;
    finished.value = true;
    running.value = false;
    unlock();
  }
}

function abort() {
  cancelled = true;
  reader?.stop();
  registration?.stop();
  status.value = '中断しました。登録済みのポケモンは保存されています。';
}

function close() {
  if (!running.value) emit('close', { registered: registered.value, skipped: skipped.value });
}

onBeforeUnmount(() => {
  abort();
  unlock();
});
</script>

<template>
  <PopupBase class="android-import-popup" @close="close">
    <template #headerText>Android端末からまとめて取得</template>
    <div class="flex-column gap-10px">
      <SettingSectionTitle>アプリのインストール</SettingSectionTitle>
      <p>
        本機能の利用には<a href="android-screenshot-to-clipboard.zip" target="_blank" rel="noopener"
          >ポケスリシミュサポートアプリ</a
        >のインストールが必要になります。
      </p>
      <SettingSectionTitle>登録条件</SettingSectionTitle>
      <InputRadio v-model="condition" value="all" :disabled="running || finished">全員</InputRadio>
      <InputRadio v-model="condition" value="normal-or-mint" :disabled="running || finished">
        ミント不使用orミント使用でチェックリストに該当するもの
      </InputRadio>
      <InputRadio v-model="condition" value="normal" :disabled="running || finished">
        ミント不使用でチェックリストに該当するもの
      </InputRadio>
      <p class="supplement-note">
        登録日降順で、未登録の最も古いポケモンのステータス画面を表示し、食材2,3枠目とせいかくが映っている状態で開始してください。
      </p>
      <p class="supplement-note">
        スクリーンショットからの解析は精度が不十分な可能性があります。不安な場合は一括登録後に取り込み結果を確認するようにしてください。
      </p>
      <p v-if="status" role="status">{{ status }}</p>
      <div v-if="finished">登録 {{ registered }}匹 ／ 対象外 {{ skipped }}匹</div>
      <FormButton v-if="!finished" class="execute" @click="start" :disabled="running"
        >まとめて登録を開始</FormButton
      >
      <FormButton v-else @click="close">閉じる</FormButton>
    </div>
  </PopupBase>
  <Teleport to="body">
    <div
      v-if="running"
      class="android-import-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Android端末からまとめて取得 実行中"
      @keydown.stop
      @keydown.tab.prevent
    >
      <div class="android-import-progress flex-column gap-10px">
        <SettingSectionTitle>Android端末からまとめて取得</SettingSectionTitle>
        <div role="status">{{ status }}</div>
        <div v-if="currentPokemon">{{ currentPokemon }}を判定しています</div>
        <div>登録 {{ registered }}匹 ／ 対象外 {{ skipped }}匹</div>
        <FormButton ref="abortButton" class="important" @click="abort">中断</FormButton>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.android-import-popup {
  width: 620px;
}
.android-import-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: var(--color-surface-subtle);
}
.android-import-progress {
  width: 560px;
  max-width: 100%;
  padding: 20px;
  border: 1px solid var(--color-line);
  border-radius: 12px;
  background: var(--color-surface);
  box-shadow: var(--shadow-control);
  overflow-wrap: anywhere;
}
</style>
