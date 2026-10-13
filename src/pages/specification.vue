<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import DesignTable from '../components/design-table.vue';
import Skill from '../data/skill';
import { PokemonSimulatorMode } from '../models/simulation/pokemon-simulator-mode';
import { getSkillSpecification } from '../models/simulation/skills/skill-specification';

const route = useRoute();
const router = useRouter();
const selectedSection = computed(() => (route.query.section === 'help' ? 'help' : 'skill'));
const selectedSkillName = computed(() => {
  const name = typeof route.query.skill === 'string' ? route.query.skill : null;
  return Skill.map[name ?? ''] ? name! : Skill.list[0].name;
});
const selectedSkill = computed(() => Skill.map[selectedSkillName.value]);
const skillLevel = ref(selectedSkill.value.effect.length);
const activeSkillLevel = computed(() =>
  Math.min(Math.max(skillLevel.value, 1), selectedSkill.value.effect.length),
);
const mode = ref(PokemonSimulatorMode.SELECT);

const specification = computed(() =>
  getSkillSpecification(selectedSkill.value, activeSkillLevel.value - 1),
);
const inputValuesByMode = reactive<Partial<Record<PokemonSimulatorMode, Record<string, number>>>>(
  {},
);

watch(
  specification,
  (value) => {
    const defaultValues = Object.fromEntries(
      value.inputs.map((input) => [input.key, input.defaultValue]),
    );
    for (const specificationMode of value.modes) {
      inputValuesByMode[specificationMode.id] = { ...defaultValues };
    }
  },
  { immediate: true },
);

watch(selectedSkillName, () => {
  skillLevel.value = selectedSkill.value.effect.length;
  mode.value = PokemonSimulatorMode.SELECT;
});

const selectedMode = computed(() =>
  specification.value.modes.find((item) => item.id === mode.value)!,
);
const inputValues = computed(() => inputValuesByMode[mode.value] ?? {});
const resolvedInputValues = computed(() =>
  Object.fromEntries(
    specification.value.inputs.map((input) => [
      input.key,
      input.fixedValue?.(inputValues.value, mode.value) ?? inputValues.value[input.key],
    ]),
  ),
);
const visibleInputs = computed(() =>
  specification.value.inputs.filter(
    (input) =>
      isInputEditable(input) && (!input.visibleModes || input.visibleModes.includes(mode.value)),
  ),
);
const calculationResult = computed(() =>
  specification.value.calculate(resolvedInputValues.value, mode.value),
);
const effectList = computed(
  () =>
    specification.value.effectList ??
    specification.value.inputs
      .filter((input) => input.editable === false)
      .map((input) => ({
        label: input.labelByMode?.[mode.value] ?? input.label,
        value: input.defaultValue,
        unit: input.unit,
      })),
);

function selectSkill(name: string) {
  const query = { ...route.query, skill: name };
  delete query.section;
  router.replace({ query });
}

function selectHelp() {
  router.replace({ query: { ...route.query, section: 'help' } });
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toLocaleString('ja-JP', { maximumFractionDigits: 3 }) : '-';
}

function isInputEditable(input: (typeof specification.value.inputs)[number]) {
  return input.editable !== false && input.fixedValue?.(inputValues.value, mode.value) == null;
}

function inputLabel(input: (typeof specification.value.inputs)[number]) {
  return input.labelByMode?.[mode.value] ?? input.label;
}
</script>

<template>
  <div class="specification-page">
    <aside class="skill-menu" aria-label="仕様一覧">
      <SettingSectionTitle>仕様</SettingSectionTitle>
      <p class="menu-description">項目を選ぶと、実装上の計算仕様を確認できます。</p>

      <SettingSectionTitle type="item">ポケモン</SettingSectionTitle>
      <router-link
        :to="{ query: { ...route.query, section: 'help' } }"
        class="skill-link"
        :class="{ active: selectedSection === 'help' }"
        @click.prevent="selectHelp"
      >
        おてつだい
      </router-link>

      <SettingSectionTitle type="item">メインスキル</SettingSectionTitle>
      <template v-for="category in Skill.categoryList" :key="category.id">
        <p class="skill-category">{{ category.name }}</p>
        <router-link
          v-for="skill in category.skillList"
          :key="skill.name"
          :to="{ query: { ...route.query, skill: skill.name } }"
          class="skill-link"
          :class="{ active: selectedSection === 'skill' && skill.name === selectedSkillName }"
          @click.prevent="selectSkill(skill.name)"
        >
          {{ skill.name }}
        </router-link>
      </template>
    </aside>

    <section v-if="selectedSection === 'skill'" class="skill-detail">
      <div class="detail-header">
        <div>
          <p class="eyebrow">メインスキルの仕様</p>
          <div class="skill-title-row">
            <h2>{{ selectedSkill.name }}</h2>
            <label class="level-select">
              <span>スキルLv</span>
              <InputSelect v-model.number="skillLevel">
                <option v-for="(_, index) in selectedSkill.effect" :key="index" :value="index + 1">
                  Lv{{ index + 1 }}
                </option>
              </InputSelect>
            </label>
          </div>
        </div>
      </div>

      <SettingGroup title="スキル効果">
        <DesignTable class="effect-table">
          <tbody>
            <tr v-for="effectItem in effectList" :key="effectItem.label">
              <th>{{ effectItem.label }}</th>
              <td>{{ formatNumber(Number(effectItem.value)) }}{{ effectItem.unit }}</td>
            </tr>
          </tbody>
        </DesignTable>
      </SettingGroup>

      <TabList class="mode-tabs">
        <a
          v-for="item in specification.modes"
          :key="item.id"
          href="#"
          :class="{ active: item.id === mode }"
          @click.prevent="mode = item.id"
        >
          {{ item.label }}
        </a>
      </TabList>

      <SettingGroup :title="selectedMode.label">
        <p class="mode-description">{{ selectedMode.description }}</p>
        <pre
          v-if="selectedMode.formulaHtml"
          class="formula"
          v-html="selectedMode.formulaHtml"
        ></pre>
        <pre v-else class="formula">{{ selectedMode.formula }}</pre>
      </SettingGroup>

      <SettingGroup title="試算">
        <div class="calculator-grid">
          <label v-for="input in visibleInputs" :key="input.key" class="calculator-input">
            <span>{{ inputLabel(input) }}</span>
            <div>
              <InputSelect v-if="input.type === 'select'" v-model.number="inputValues[input.key]">
                <option v-for="option in input.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </InputSelect>
              <InputNumber v-else v-model="inputValues[input.key]" class="w-100px" :step="input.step" />
              <small v-if="input.unit">{{ input.unit }}</small>
            </div>
          </label>
        </div>
        <div class="calculation-result">
          <span>{{ specification.resultLabel }}</span>
          <strong>{{ formatNumber(calculationResult) }}</strong>
          <small>{{ specification.resultUnit }}</small>
        </div>
      </SettingGroup>

      <p class="notice">
        この試算はスキル単体の式を確認するためのものです。実際のシミュレーションでは、発動回数、スキル確率、食材バッグ、料理、げんき、イベントなどの条件を加えて計算します。
      </p>
    </section>

    <section v-else class="skill-detail help-detail">
      <div class="detail-header">
        <div>
          <p class="eyebrow">ポケモンの仕様</p>
          <h2>おてつだい</h2>
        </div>
      </div>

      <SettingGroup title="おてつだいスピード">
        <pre class="formula">
速度短縮量 = min(おてつだいスピードSの0.07 + おてつだいスピードMの0.14 + おてつだいボーナス対象数 × 0.05, 0.35)

基本おてつだい時間 = floor(マスターおてつだい時間
  × (1 - (レベル - 1) × 0.002)
  × (1 - 速度短縮量)
  × 性格補正
  ÷ キャンプ補正)</pre>
        <p class="mode-description">
          性格補正は、おてつだいスピード上昇が0.9、下降が1.075、補正なしが1です。キャンプ補正はチケット使用時1.2、未使用時1です。ここで一度だけ切り捨てます。
        </p>
        <p class="mode-description">
          その後、おやすみリボンとEXフィールドの速度倍率を順に掛けます。最終進化まで残り1段階では500時間以上で0.95、2000時間以上でさらに0.88、残り2段階では500時間以上で0.89、2000時間以上でさらに0.75を掛けます。EXフィールドでは好みのきのみ、または好み以外のきのみかに応じた速度倍率を最後に掛けます。
        </p>
      </SettingGroup>

      <SettingGroup title="いつのまに育成に入るまでのおてつだい回数">
        <pre class="formula">
平均取得個数/手伝い = きのみ数 × (1 - 食材確率) + 平均食材数 × 食材確率

所持上限到達手伝い数 = max(最終所持数 ÷ 平均取得個数/手伝い + 4, 0)</pre>
        <p class="mode-description">
          最終所持数には、最大所持数アップ、睡眠リボン、イベント、キャンプチケット、EX補正を所定の順で反映します。末尾の4回は、所持数が埋まった後にキューを消化する分です。
        </p>
        <p class="mode-description">
          日中は各チェック間隔ごと、睡眠中は睡眠全体について、この回数までを通常おてつだいとして扱います。超過分はいつのまに育成となり、食材抽選を行わず、きのみだけを取得します。
        </p>
      </SettingGroup>

      <SettingGroup title="下振れ計算の概要">
        <p class="mode-description">
          下振れ考慮を有効にした項目は、単純な期待値ではなく、設定したボーダー%以上の確率で下回らない確率境界の値を使います。例えばボーダー80%では、結果がその値未満になる確率が概ね20%となる位置を採用します。
        </p>
        <pre class="formula">
食材: 各食材について、通常おてつだい回数 n と
      1回のおてつだいで得る確率 p から二項分布を作り、確率境界の成功回数を求める。

スキル: 1回のチェック区間の抽選回数と持ち越し上限（通常1回、スキルとくい・オール2回）から
      発動回数の分布を作り、日中のチェック回数分だけ畳み込んで確率境界を求める。</pre>
        <p class="mode-description">
          境界が確率分布の整数値の途中にある場合は、その確率質量内を線形補間します。食材では食材ごとの個数を掛けてエナジー・個数へ反映します。スキルでは日中だけを確率境界に置き換え、睡眠中は通常どおり「1回以上」または0・1・2回の期待値を加算します。
        </p>
      </SettingGroup>

      <p class="notice">
        実際の1日あたりのおてつだい回数には、上記のおてつだい時間に加え、睡眠時間、チェック回数、げんきの時系列変化、回復スキルも反映します。げんき別のおてつだい時間倍率は別途
        `HelpRate` が計算します。
      </p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.specification-page {
  display: grid;
  grid-template-columns: minmax(190px, 280px) minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  gap: 10px;
}

.skill-menu,
.skill-detail {
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--color-line);
  border-radius: 7px;
  background: var(--color-surface);
}

.skill-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}

.menu-description,
.hint,
.mode-description,
.notice {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;
}

.menu-description {
  padding: 0 4px 6px;
}

.skill-category {
  margin: 6px 4px 0;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: bold;
}

.skill-link {
  display: block;
  padding: 6px 8px;
  border-radius: 5px;
  color: inherit;
  text-decoration: none;

  &:hover {
    background: var(--color-primary-soft);
  }

  &.active {
    background: var(--color-mint-soft);
    color: var(--color-primary-strong);
    font-weight: bold;
  }
}

.skill-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.detail-header {
  display: flex;
  align-items: start;
  gap: 12px;

  h2 {
    margin: 0;
    color: var(--color-primary-strong);
    font-size: 22px;
  }
}

.eyebrow {
  margin: 0 0 3px;
  color: var(--color-muted);
}

.skill-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.level-select,
.calculator-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: bold;
}

.level-select {
  flex: 0 0 auto;
}

.effect-table {
  width: auto;

  th,
  td {
    padding: 5px 10px;
  }

  th {
    white-space: nowrap;
  }
}

.mode-tabs {
  flex: 0 0 auto;
}

.formula {
  margin: 8px 0 0;
  padding: 10px;
  overflow-x: auto;
  border-radius: 5px;
  background: var(--color-surface-subtle);
  color: var(--color-primary-strong);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre-wrap;
}

.formula :deep(ruby) {
  color: var(--color-primary-strong);
  font-weight: bold;
  ruby-align: center;
}

.formula :deep(rt) {
  color: var(--color-muted);
  font-size: 0.72em;
  font-weight: normal;
}

.calculator-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, max-content));
  justify-content: start;
  gap: 10px;
}

.calculator-input > div {
  display: flex;
  align-items: center;
  gap: 5px;

  .input-number {
    width: 100%;
  }

  .fixed-value {
    min-height: 32px;
    padding: 6px 8px;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-surface-subtle);
  }

  small {
    white-space: nowrap;
    color: var(--color-muted);
  }
}

.calculation-result {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 14px;
  padding: 10px;
  border-radius: 5px;
  background: var(--color-mint-soft);

  strong {
    color: var(--color-primary-strong);
    font-size: 20px;
  }

  small {
    color: var(--color-muted);
  }
}

.notice {
  padding: 0 2px;
}

.help-detail {
  .mode-description + .mode-description {
    margin-top: 8px;
  }
}

@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .specification-page {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(150px, 35%) minmax(0, 1fr);
  }

  .skill-menu,
  .skill-detail {
    min-height: 0;
  }

  .detail-header {
    display: block;
  }
}
</style>
