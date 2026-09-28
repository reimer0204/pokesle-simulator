<script setup>
import { Cooking } from '../data/food_and_cooking';
import Nature from '../data/nature';
import Pokemon from '../data/pokemon';
import SubSkill from '../data/sub-skill';
import { AsyncWatcher } from '../models/async-watcher';
import config from '../models/config.ts';
import EvaluateTable from '../models/simulation/evaluate-table';
import MultiWorker from '../models/multi-worker';
import PokemonBox from '../models/pokemon-box/pokemon-box';
import Popup from '../models/popup/popup';
import convertRomaji from '../models/utils/convert-romaji';
import PokemonListSimulator from '../models/pokemon-box/pokemon-box-worker?worker';
import AsyncWatcherArea from './util/async-watcher-area.vue';
import PopupBase from './util/popup-base.vue';
import FoodIconSelect from './form/food-icon-select.vue';
import FoodIconSelectList from './form/food-icon-select-list.vue';
import InputSlider from './form/input-slider.vue';
import InputTextarea from './form/input-textarea.vue';
import NatureSelect from './form/nature-select.vue';
import SubSkillSelect from './form/sub-skill-select.vue';
import SettingButton from './design/setting-button.vue';
import PokemonSelectPopup from './pokemon-select-popup.vue';
import NatureInfo from './status/nature-info.vue';

import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import Exp from '@/data/exp.ts';
import DesignTable from './design-table.vue';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

let evaluateTable;
const evaluateTablePromise = (async () => {
  evaluateTable = await EvaluateTable.load(config);
})();

const requireRefresh = computed(() => {
  let result = {};
  if (!EvaluateTable.isEnableEvaluateTable(config)) {
    result.setting = true;
  }
  return result;
});

const props = defineProps({
  index: { type: Number },
  initialPokemon: { type: Object },
});

const $emit = defineEmits(['close', 'input']);

const assistInput = ref(null);
const HIDE_INPUT_UI_COOKIE_KEY = 'pokemon-edit-popup-hide-input-ui';
const $cookies = inject('$cookies');
const hideInputUi = ref($cookies.get(HIDE_INPUT_UI_COOKIE_KEY) === 'true');

watch(hideInputUi, (value) => {
  $cookies.set(HIDE_INPUT_UI_COOKIE_KEY, String(value));
});

let pokemon = reactive({
  name: null,
  lv: null,
  skillLv: null,
  foodList: [null, null, null],
  subSkillList: [null, null, null, null, null],
  nature: null,
  shiny: false,
  fix: null,
});
const insertTo = ref(null);

const basePokemon = computed(() => {
  return Pokemon.map[pokemon.name];
});
const kaihouPokemon = computed(() => {
  return basePokemon.value?.kaihou;
});

// 厳選情報のボックス比較では、編集対象と進化先候補を共有する個体だけを使う。
const boxPokemonListForSelect = computed(() => {
  if (basePokemon.value == null) return [];

  const afterSet = new Set(basePokemon.value.afterList);
  return PokemonBox.list.filter((boxPokemon) =>
    Pokemon.map[boxPokemon.name]?.afterList.some((after) => afterSet.has(after)),
  );
});

const assistText = ref('');

const pokemonFoodABC = computed(() => {
  return pokemon.foodList
    .map((f) =>
      f
        ? String.fromCharCode(
            65 + Math.max(basePokemon.value?.foodList.findIndex((x) => x.name == f) ?? 0, 0),
          )
        : '',
    )
    .join('');
});

function syncAssistWithPokemon() {
  assistText.value = [
    pokemon.name,
    pokemon.lv,
    pokemon.shiny ? 'shiny' : null,
    pokemon.skillLv ? `s:${pokemon.skillLv}` : null,
    pokemonFoodABC.value,
    ...pokemon.subSkillList,
    pokemon.nature,
  ]
    .filter((value) => value != null && value !== '')
    .join('\n');
}

// 編集または初期値付きの新規登録なら、入力済みの値を引き継ぐ
if (props.index != null) {
  pokemon = reactive(JSON.parse(JSON.stringify(PokemonBox.list[props.index])));
  syncAssistWithPokemon();
} else if (props.initialPokemon != null) {
  pokemon = reactive(JSON.parse(JSON.stringify(props.initialPokemon)));
  syncAssistWithPokemon();
}

// 厳選情報計算
let selectAsyncWatcher = AsyncWatcher.init();
let boxMultiWorker = new MultiWorker(PokemonListSimulator);
let singleMultiWorker = new MultiWorker(PokemonListSimulator, 1);
onBeforeUnmount(() => {
  boxMultiWorker.close();
  singleMultiWorker.close();
});
const simulatedPokemonList = ref([]);
let boxLoading;
let boxLoadVersion = 0;
async function loadBoxInfo(setConfig = false) {
  if (requireRefresh.setting) {
    return;
  }
  const loadVersion = ++boxLoadVersion;
  const boxPokemonList = boxPokemonListForSelect.value;
  boxLoading = selectAsyncWatcher.run(async (progressCounter) => {
    await evaluateTablePromise;
    const result = await PokemonBox.simulation(
      boxPokemonList,
      boxMultiWorker,
      evaluateTable,
      config,
      progressCounter,
      setConfig,
      false,
    );
    if (loadVersion === boxLoadVersion) simulatedPokemonList.value = result;
  });
  await boxLoading;
}
loadBoxInfo(true);

watch(
  () => pokemon.name,
  () => loadBoxInfo(),
);

const foodSelectList = computed(() => {
  if (basePokemon.value == null) return [[], [], []];
  return [
    basePokemon.value.foodList.filter((x) => x?.name && x.numList[0]).map((x) => x?.name),
    basePokemon.value.foodList.filter((x) => x?.name && x.numList[1]).map((x) => x?.name),
    basePokemon.value.foodList.filter((x) => x?.name && x.numList[2]).map((x) => x?.name),
  ];
});

// ひらがなをカタカナに直した名前
const pokemonNames = computed(() => {
  return Pokemon.list.map((pokemon) => {
    return {
      pokemon,
      normalizedName: pokemon.name.replace(/[\u3041-\u3096]/g, (match) =>
        String.fromCharCode(match.charCodeAt(0) + 0x60),
      ),
    };
  });
});

function inferName(name) {
  if (!name) return;

  // ローマ字をカタカナに、ひらがなをカタカナに変換
  const regexp = new RegExp(
    convertRomaji(name)
      .replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60))
      .split('')
      .map((x) => ('^$\\.*+?()[]{}|'.includes(x) ? `\\${x}` : x))
      .join('.*'),
  );

  let matchPokemonList = pokemonNames.value
    .map(({ pokemon, normalizedName }) => {
      let result = regexp.exec(normalizedName);
      if (result) return { pokemon, matchLength: result[0].length };
      return null;
    })
    .filter((x) => x);
  if (matchPokemonList.length) {
    matchPokemonList.sort((a, b) => {
      if (a.matchLength != b.matchLength) return a.matchLength - b.matchLength;
      return a.pokemon.name.length - b.pokemon.name.length;
    });
    pokemon.name = matchPokemonList[0].pokemon.name;
  }
}

function convertFoodABC(foodABC) {
  if (basePokemon.value == null || foodABC == null) return;

  (foodABC + '   ')
    .slice(0, 3)
    .split('')
    .forEach((letter, i) => {
      let charCode = letter.toUpperCase().charCodeAt(0);
      if (65 <= charCode && charCode <= 90) charCode -= 65;
      else if (49 <= charCode && charCode <= 64) charCode -= 49;
      else charCode = 99;
      let foodIndex = Math.max(charCode, 0);
      pokemon.foodList[i] = basePokemon.value.foodList[foodIndex]?.name;
    });
}

function convertSubSkill(name, index) {
  if (!name) return;

  const katakana = convertRomaji(name)
    .toUpperCase()
    .replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60));
  let regexp = new RegExp(katakana.split('').join('.*'));

  let match = SubSkill.listForInput.find(
    (x) => regexp.test(x.katakana) || x.name == name.toUpperCase(),
  );

  if (match) {
    pokemon.subSkillList[index] = match.name;
  }
}

function convertNature(name) {
  if (!name) return;

  // ローマ字をカタカナに、カタカナをひらがなに変換
  name = convertRomaji(name).replace(/[\u30a1-\u30f6]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) - 0x60),
  );
  let regexp = new RegExp(name.split('').join('.*'));

  let matchNatureList = Nature.list.filter((x) => regexp.test(x.name));
  if (matchNatureList.length) {
    matchNatureList.sort(
      (a, b) => Math.abs(a.name.length - name.length) - Math.abs(b.name.length - name.length),
    );
    pokemon.nature = matchNatureList[0].name;
  }
}

function inferAssist() {
  const lineList = assistText.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const [name, ...remainingLineList] = lineList;

  inferName(name);

  const shinyLineRegExp = /shiny|irochi|irochigai|iroti|irotigai/i;
  const favoriteLineRegExp = /favorite|okiniiri/i;
  pokemon.shiny = remainingLineList.some((line) => shinyLineRegExp.test(line));
  pokemon.favorite = remainingLineList.some((line) => favoriteLineRegExp.test(line));

  const statusLineList = remainingLineList.filter(
    (line) => !shinyLineRegExp.test(line) && !favoriteLineRegExp.test(line),
  );
  const lvLineList = statusLineList.filter((line) => /^\d+$/.test(line));
  if (lvLineList.length) {
    pokemon.lv = Number(lvLineList[0]);
  }

  const skillLvLineRegExp = /^s\s*:\s*(\d+)$/i;
  const skillLvLine = statusLineList.find((line) => skillLvLineRegExp.test(line));
  if (skillLvLine) {
    pokemon.skillLv = Number(skillLvLine.match(skillLvLineRegExp)[1]);
  }

  const nonLvLineList = statusLineList.filter(
    (line) => !/^\d+$/.test(line) && !skillLvLineRegExp.test(line),
  );
  const foodLineList = nonLvLineList.filter((line) => /^[a-h]{3}$/i.test(line));
  pokemon.foodList = [null, null, null];
  if (foodLineList.length) {
    convertFoodABC(foodLineList[0]);
  }

  const otherLineList = nonLvLineList.filter((line) => !/^[a-h]{3}$/i.test(line));
  const subSkillLineList = otherLineList.slice(0, 5);
  pokemon.subSkillList = [null, null, null, null, null];
  subSkillLineList.forEach((line, index) => convertSubSkill(line, index));

  // pokemon.nature = null;
  convertNature(otherLineList[5]);
}

async function selectPokemon() {
  const name = await Popup.show(PokemonSelectPopup, { selectedName: pokemon.name ?? '' });
  if (name) pokemon.name = name;
}

// 厳選情報
let selectResult = ref(null);
let selectLvList = [
  'max',
  ...Object.entries(config.selectEvaluate.levelList)
    .flatMap(([lv, v]) => (v ? [lv] : []))
    .sort((a, b) => a - b),
];

async function calcSelectScore() {
  const pokemonName = pokemon.name;
  await boxLoading;
  await evaluateTablePromise;

  if (pokemonName !== pokemon.name) return;

  if (requireRefresh.setting) {
    selectResult.value = null;
    return;
  }

  try {
    PokemonBox.check(pokemon);
    selectAsyncWatcher.run(async (progressCounter) => {
      // ボックス整理モードと同じチェックリスト判定を、編集中の個体にも行う。
      const selectConfig = JSON.parse(JSON.stringify(config));
      selectConfig.cleaning = true;
      await singleMultiWorker.call(null, () => ({
        type: 'config',
        config: selectConfig,
      }));

      const result = (
        await singleMultiWorker.call(progressCounter, () => {
          return {
            type: 'basic',
            pokemonList: [JSON.parse(JSON.stringify(pokemon))],
            evaluateTable,
          };
        })
      ).flat(1)[0];

      if (simulatedPokemonList.value && result) {
        result.box = {};
        for (let selectLv of selectLvList) {
          result.box[selectLv] = {};
          for (let after of result.base.afterList) {
            result.box[selectLv][after] = {};
            for (let { key } of selectResultColumns.value) {
              let targetList = simulatedPokemonList.value.filter(
                (x) => x.evaluateResult?.[selectLv]?.[after]?.[key]?.score != null,
              );
              let sameFoodTargetList = targetList.filter((x) =>
                x.box?.foodList.every((f, i) => pokemon.foodList[i] == f),
              );
              let sameList = targetList.map(
                (x) => x.evaluateResult?.[selectLv]?.[after]?.[key]?.score,
              );
              let sameFoodList = sameFoodTargetList.map(
                (x) => x.evaluateResult?.[selectLv]?.[after]?.[key]?.score,
              );

              result.box[selectLv][after][key] = {
                same: sameList.length ? Math.max(...sameList) : null,
                food: sameFoodList.length ? Math.max(...sameFoodList) : null,
              };
            }
          }
        }
      }

      selectResult.value = result;
    });
  } catch (e) {
    selectResult.value = null;
    // ignore
  }
}
calcSelectScore();
// 入力アシストでは入力のたびに配列を作り直すため、参照の変化ではなく
// 厳選計算に影響する値そのものが変わった時だけ再計算する。
watch(
  () =>
    JSON.stringify([pokemon.name, ...pokemon.foodList, ...pokemon.subSkillList, pokemon.nature]),
  calcSelectScore,
);

const selectResultColumns = computed(() => {
  const result = [
    { key: 'energy', name: '総合スコア', color: 'rgb(220, 48, 50)', order: 1 },
    {
      key: 'berry',
      name: 'きのみ',
      color: 'rgb(32, 212, 102)',
      order: basePokemon.value?.specialty == 'きのみ' ? 2 : 3,
    },
    {
      key: 'food',
      name: '食材',
      color: 'rgb(245, 183, 72)',
      order: basePokemon.value?.specialty == '食材' ? 2 : 4,
    },
    {
      key: 'skill',
      name: 'スキル',
      color: 'rgb(70, 159, 253)',
      order: basePokemon.value?.specialty == 'スキル' ? 2 : 5,
    },
  ];
  result.sort((a, b) => a.order - b.order);
  if (!showSecondarySelectMetrics.value) {
    return result.filter((x) => x.order <= 2);
  }
  return result;
});

const specialtySelectColumn = computed(() =>
  selectResultColumns.value.find(({ order }) => order === 2),
);

const saveDisabled = computed(() => {
  return (
    basePokemon.value == null ||
    !pokemon.lv ||
    (pokemon.foodList.some((x) => !x) && !kaihouPokemon.value) ||
    (pokemon.subSkillList.some((x) => !x) && !kaihouPokemon.value) ||
    !pokemon.nature
  );
});

async function save(requireContinue) {
  if (saveDisabled.value) {
    return;
  }

  let sanitizedPokemon = JSON.parse(JSON.stringify(pokemon));

  if (props.index == null) {
    PokemonBox.post(sanitizedPokemon, null, insertTo.value);

    if (requireContinue) {
      await loadBoxInfo();
      reset();
      $emit('input', true);
    } else {
      $emit('close', true);
    }
  } else {
    PokemonBox.post(sanitizedPokemon, props.index, insertTo.value);
    $emit('close', true);
  }
}

function deletePokemon() {
  if (confirm('このポケモンを削除します。よろしいですか？')) {
    PokemonBox.delete(props.index);
    $emit('close', true);
  }
}

const selectDisplayMode = computed({
  get: () => config.pokemonEdit.selectDisplayMode,
  set: (value) => (config.pokemonEdit.selectDisplayMode = value),
});
const showSecondarySelectMetrics = computed({
  get: () => config.pokemonEdit.showSecondarySelectMetrics,
  set: (value) => (config.pokemonEdit.showSecondarySelectMetrics = value),
});
const selectChartLvList = computed(() => [...selectLvList.filter((lv) => lv !== 'max'), 'max']);
const selectChartColumns = computed(() =>
  showSecondarySelectMetrics.value
    ? selectResultColumns.value
    : selectResultColumns.value.filter(({ order }) => order <= 2),
);
const selectChartList = computed(() => {
  if (selectResult.value == null) return [];

  return selectResult.value.base.afterList.map((after) => ({
    after,
    chartList: selectChartColumns.value.map(({ key, name, color }) => ({
      key,
      name,
      color,
      data: {
        labels: selectChartLvList.value.map((lv) => (lv === 'max' ? '最大' : `Lv${lv}`)),
        datasets: [
          {
            label: '本個体',
            data: selectChartLvList.value.map((lv) => {
              const score = selectResult.value.evaluateResult?.[lv]?.[after]?.[key]?.score;
              return score == null ? null : score * 100;
            }),
            borderColor: color,
            backgroundColor: color,
            borderWidth: 4,
            pointRadius: 3,
            tension: 0.2,
          },
          {
            label: '同種族1位',
            data: selectChartLvList.value.map((lv) => {
              const score = selectResult.value.box?.[lv]?.[after]?.[key]?.same;
              return score == null ? null : score * 100;
            }),
            borderColor: '#555',
            backgroundColor: '#555',
            borderDash: [6, 4],
            borderWidth: 4,
            pointRadius: 2,
            tension: 0.2,
          },
          {
            label: '同種族・同食材1位',
            data: selectChartLvList.value.map((lv) => {
              const score = selectResult.value.box?.[lv]?.[after]?.[key]?.food;
              return score == null ? null : score * 100;
            }),
            borderColor: '#999',
            backgroundColor: '#999',
            borderDash: [2, 3],
            borderWidth: 4,
            pointRadius: 2,
            tension: 0.2,
          },
        ],
      },
    })),
  }));
});
const selectChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      min: 0,
      ticks: {
        callback: (value) => `${value}%`,
      },
    },
  },
};

function getSelectChartOptions(data) {
  const maxScore = Math.max(
    100,
    ...data.datasets.flatMap((dataset) => dataset.data.filter((score) => score != null)),
  );
  const axisMax = Math.ceil(maxScore / 20) * 20;
  return {
    ...selectChartOptions,
    scales: {
      ...selectChartOptions.scales,
      y: {
        ...selectChartOptions.scales.y,
        max: axisMax,
        ticks: {
          ...selectChartOptions.scales.y.ticks,
          stepSize: 20,
        },
      },
    },
  };
}

// 表示時に入力アシスト欄にフォーカスをあわせる
onMounted(() => {
  assistInput.value.focus();
});

function reset() {
  pokemon.name = null;
  pokemon.lv = null;
  pokemon.skillLv = null;
  pokemon.foodList = ['', '', ''];
  pokemon.subSkillList = [null, null, null, null, null];
  pokemon.nature = null;
  pokemon.shiny = false;
  pokemon.memo = null;
  pokemon.favorite = null;

  assistText.value = '';

  insertTo.value = null;

  assistInput.value.focus();
}

function onEsc() {
  if (
    Object.values(pokemon)
      .flat(1)
      .some((v) => v != null && v != '')
  ) {
    reset();
  } else {
    $emit('close');
  }
}

function getMaxSelectScore(key) {
  const scoreList = Object.values(selectResult.value?.evaluateResult?.max ?? {})
    .map((result) => result?.[key]?.score)
    .filter((score) => Number.isFinite(score));
  return scoreList.length ? Math.max(...scoreList) : null;
}

function formatSelectScore(score) {
  return score == null ? '?' : (score * 100).toFixed(1);
}

function shareX() {
  const maxScore = getMaxSelectScore('energy');
  const specialtyScore = specialtySelectColumn.value
    ? getMaxSelectScore(specialtySelectColumn.value.key)
    : null;

  let text = [
    `「${pokemon.name ?? '?'}」を捕まえました！`,
    `食材: ${pokemonFoodABC.value}`,
    `サブスキル: ${pokemon.subSkillList.map((x) => SubSkill.map[x]?.short ?? '?').join('/')}`,
    `せいかく: ${pokemon.nature ?? '?'}`,
    `総合厳選度: ${formatSelectScore(maxScore)}%`,
    ...(specialtySelectColumn.value
      ? [`${specialtySelectColumn.value.name}厳選度: ${formatSelectScore(specialtyScore)}%`]
      : []),
    `https://reimer0204.github.io/pokesle-simulator/`,
    `#ポケスリ #ポケモンスリープ`,
  ].join('\n');
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
}

function toggleColor() {
  pokemon.shiny = !pokemon.shiny;
}

function toggleFavorite() {
  pokemon.favorite = !pokemon.favorite;
}

function onAssistKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && !saveDisabled.value) {
    event.preventDefault();
    save(true);
  }
}

const candyInfo = computed(() => {
  const result = Exp.calcRequireInfo(pokemon, pokemon.nature, config);
  return {
    data: [
      { name: '通常時', num: result.normalCandyNum, exp: result.normalCandyShard },
      {
        name: `アメブ(EXPx${config.candy.boostMultiply}/ゆめかけx${config.candy.boostShard})`,
        num: result.boostCandyNum,
        exp: result.boostCandyShard,
      },
      {
        name: 'バランス(通常分)',
        num: result.bestNormalCandyNum,
        exp: result.bestNormalCandyShard,
      },
      {
        name: 'バランス(アメブ分)',
        num: result.bestBoostCandyNum,
        exp: result.bestBoostCandyShard,
      },
      {
        name: 'バランス(合計)',
        num:
          result.bestNormalCandyNum != null
            ? result.bestNormalCandyNum + result.bestBoostCandyNum
            : null,
        exp:
          result.bestNormalCandyShard != null
            ? result.bestNormalCandyShard + result.bestBoostCandyShard
            : null,
      },
    ],
    columnList: [
      { key: 'name', name: '種類' },
      { key: 'num', name: '必要アメ数', type: Number },
      { key: 'exp', name: '必要ゆめのかけら', type: Number },
    ],
  };
});
</script>

<template>
  <PopupBase
    class="edit-pokemon-popup"
    body-class="edit-pokemon-body"
    @close="$emit('close')"
    @keydown.esc.stop="onEsc"
    @keydown.c.alt="toggleColor"
    @keydown.f.alt="toggleFavorite"
  >
    <template #headerText>ポケモン編集</template>

    <BaseAlert class="assist-alert">
      入力アシスト欄に、名前・Lv・食材・サブスキル・せいかくを1行ずつ入力することでも入力できます。<br />
      ローマ字でも反応します。必須項目がそろった状態でEnterを押すと、保存して続けて登録します。Shift+Enter:
      改行、ESC: 全てクリア<br />
    </BaseAlert>

    <div class="edit-form mt-10px">
      <div class="assist-area">
        <div class="assist-heading">
          <label for="pokemon-assist-input">入力アシスト</label>
          <InputCheckbox v-model="hideInputUi">入力UIを非表示</InputCheckbox>
        </div>
        <InputTextarea
          id="pokemon-assist-input"
          ref="assistInput"
          v-model="assistText"
          class="assist-textarea"
          :placeholder="'入力例)\nfushigidane\n10\naab\notebo\nkinos\nsukim\nshokus\nshojil\nnonki\n\nせいかくを入力してEnterを押すまでに、以下を入力するとその他の設定も可能です\nshiny / irochi(色違い)\nfavorite / okiniiri(お気に入り)\ns:5 (スキルレベル)'"
          @input="inferAssist"
          @keydown="onAssistKeydown"
        />
      </div>

      <div class="edit-area-scroll">
        <DesignTable class="edit-area">
          <tbody>
            <tr>
              <th>名前</th>
              <td>
                <SettingButton class="pokemon-select-button" @click="selectPokemon">
                  <template #label>{{ pokemon.name ?? 'ポケモンを選択' }}</template>
                </SettingButton>
              </td>
            </tr>

            <tr>
              <th>Lv</th>
              <td><InputSlider v-model="pokemon.lv" :min="1" :max="100" /></td>
            </tr>

            <tr>
              <th>食材</th>
              <td>
                <FoodIconSelectList>
                  <FoodIconSelect
                    v-for="(foodList, index) in foodSelectList"
                    v-model="pokemon.foodList[index]"
                    :food-list="foodList"
                  />
                </FoodIconSelectList>
              </td>
            </tr>

            <tr>
              <th>サブスキル</th>
              <td>
                <SubSkillSelect
                  v-model="pokemon.subSkillList"
                  class="sub-skill-select-input"
                  :show-candidate="!hideInputUi"
                />
              </td>
            </tr>

            <tr>
              <th>せいかく</th>
              <td>
                <NatureInfo v-if="hideInputUi" :nature="Nature.map[pokemon.nature]" />
                <NatureSelect v-else v-model="pokemon.nature" />
              </td>
            </tr>
          </tbody>
        </DesignTable>
      </div>
    </div>

    <SettingList class="mt-10px">
      <div>
        <label>スキルLv</label>
        <InputNumber
          class="w-50px"
          v-model="pokemon.skillLv"
          :placeholder="basePokemon ? basePokemon.evolveLv : '省略可'"
        />
      </div>
      <div>
        <label>睡眠時間</label>
        <InputNumber class="w-50px" v-model="pokemon.sleepTime" placeholder="省略可" />
      </div>
      <div>
        <label>属性</label>
        <InputCheckbox v-model="pokemon.shiny">色違い</InputCheckbox>
        <InputCheckbox v-model="pokemon.favorite">お気に入り</InputCheckbox>
      </div>
      <div>
        <label>チームシミュ</label>
        <div class="flex-row flex-wrap gap-10px">
          <InputRadio v-model="pokemon.fix" :value="null">候補対象</InputRadio>
          <InputRadio v-model="pokemon.fix" :value="1">固定</InputRadio>
          <InputRadio v-model="pokemon.fix" :value="-1">除外</InputRadio>
        </div>
      </div>
      <div>
        <label>ボックス内No</label>
        <InputNumber class="w-50px" type="number" v-model.number="insertTo" placeholder="No" />
      </div>
      <div>
        <label>メモ</label>
        <InputText class="w-200px" type="text" v-model="pokemon.memo" placeholder="メモ" />
      </div>
    </SettingList>

    <ToggleArea
      class="mt-10px"
      open
      v-if="simulatedPokemonList && !requireRefresh.setting && !kaihouPokemon"
    >
      <template #headerText>厳選情報（ボックス内比較）</template>

      <AsyncWatcherArea :asyncWatcher="selectAsyncWatcher" class="select-area">
        <div v-if="selectResult">
          <div class="select-check-list">
            <b>チェックリスト</b>
            <div v-if="selectResult.hitCheckList?.length" class="flex-column-start-start gap-3px">
              <div
                v-for="(
                  { type, pokemon: targetPokemon, food, skill }, index
                ) in selectResult.hitCheckList"
                :key="index"
                class="flex-row-start-center gap-3px"
              >
                <span>✅️</span>
                <template v-if="type == 'pokemon'">厳選度({{ targetPokemon.name }})</template>
                <template v-else-if="type == 'food'">
                  <img :src="food.img" :alt="food.name" class="w-20px" />
                </template>
                <template v-else-if="type == 'skill'">{{ skill.name }}</template>
              </div>
            </div>
            <span v-else>該当なし</span>
          </div>
          <div class="flex-row gap-10px mb-5px">
            <InputRadio v-model="selectDisplayMode" value="graph">グラフ</InputRadio>
            <InputRadio v-model="selectDisplayMode" value="table">表</InputRadio>
            <InputCheckbox v-model="showSecondarySelectMetrics">
              その他の厳選度も表示する
            </InputCheckbox>
          </div>

          <div v-if="selectDisplayMode === 'graph'" class="select-chart-area">
            <p class="select-chart-note">
              本個体と、ボックス内の同種族・同種族同食材の最高厳選度を比較します。
            </p>
            <section
              v-for="{ after, chartList } in selectChartList"
              :key="after"
              class="select-chart-section"
            >
              <h3>進化先：{{ after }}</h3>
              <div class="select-chart-list">
                <div
                  v-for="{ key, name, color, data } in chartList"
                  :key="key"
                  class="select-chart"
                >
                  <h4>{{ name }}</h4>
                  <div class="select-chart-canvas">
                    <Line :data="data" :options="getSelectChartOptions(data)" />
                  </div>
                  <div class="select-chart-legend">
                    <span><i :style="{ borderColor: color }"></i>本個体</span>
                    <span><i class="same"></i>同種族1位</span>
                    <span><i class="food"></i>同種族・同食材1位</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div v-else class="select-table-area">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th></th>
                  <th
                    v-for="{ name, color } in selectResultColumns"
                    :colspan="selectLvList.length"
                    :style="{ backgroundColor: color }"
                  >
                    {{ name }}
                  </th>
                </tr>
                <tr>
                  <th>最終進化</th>
                  <th></th>
                  <template v-for="{ color } in selectResultColumns">
                    <th
                      v-for="lv in selectLvList"
                      class="text-align-right"
                      :style="{ backgroundColor: color }"
                    >
                      <template v-if="lv == 'max'">最大</template>
                      <template v-else>Lv{{ lv }}</template>
                    </th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <template v-for="after in selectResult.base.afterList">
                  <tr>
                    <th rowspan="3">{{ after }}</th>
                    <th>本個体</th>
                    <template v-for="{ key } in selectResultColumns">
                      <td
                        v-for="lv in selectLvList"
                        :class="{
                          best:
                            selectResult.evaluateResult?.[lv]?.best[key].score ==
                            selectResult.evaluateResult?.[lv]?.[after][key].score,
                        }"
                        class="text-align-right"
                      >
                        <template
                          v-if="isNaN(selectResult.evaluateResult?.[lv]?.[after][key].score)"
                        >
                          -
                        </template>
                        <template v-else>
                          {{
                            (selectResult.evaluateResult?.[lv]?.[after][key].score * 100).toFixed(
                              1,
                            )
                          }}%
                        </template>
                      </td>
                    </template>
                  </tr>
                  <tr>
                    <th>同種族</th>
                    <template v-for="{ key } in selectResultColumns">
                      <td v-for="lv in selectLvList" class="text-align-right">
                        <template v-if="isNaN(selectResult.box?.[lv]?.[after]?.[key]?.same)"
                          >-</template
                        >
                        <template v-else>
                          {{ (selectResult.box?.[lv]?.[after]?.[key]?.same * 100).toFixed(1) }}%
                        </template>
                      </td>
                    </template>
                  </tr>
                  <tr>
                    <th>同種族<br />同食材</th>
                    <template v-for="{ key } in selectResultColumns">
                      <td v-for="lv in selectLvList" class="text-align-right">
                        <template v-if="isNaN(selectResult.box?.[lv]?.[after]?.[key]?.food)"
                          >-</template
                        >
                        <template v-else>
                          {{ (selectResult.box?.[lv]?.[after]?.[key]?.food * 100).toFixed(1) }}%
                        </template>
                      </td>
                    </template>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else>せいかくまで入力すると表示されます</div>
      </AsyncWatcherArea>
    </ToggleArea>

    <ToggleArea class="mt-10px">
      <template #headerText>アメ＆EXP情報</template>

      <div>
        <SettingList>
          <div>
            <label>次のレベルまでのEXP</label>
            <div>
              <InputNumber
                class="w-80px"
                type="number"
                v-model.number="pokemon.nextExp"
                placeholder="次のレベルまであと"
              />
            </div>
          </div>

          <div>
            <label>目標レベル</label>
            <div>
              <InputNumber
                class="w-80px"
                type="number"
                v-model.number="pokemon.training"
                placeholder="目標レベル"
              />
              Lv
            </div>
          </div>

          <div>
            <label>所持アメ</label>
            <div>
              <InputNumber
                v-if="basePokemon"
                class="w-80px"
                type="number"
                v-model.number="config.candy.bag[basePokemon.candyName]"
                placeholder="アメ数"
              />
              <InputNumber v-else class="w-80px" type="number" disabled placeholder="アメ数" />
              個
            </div>
          </div>
        </SettingList>

        <SortableTable
          class="mt-5px"
          :dataList="candyInfo.data"
          :columnList="candyInfo.columnList"
        ></SortableTable>
      </div>
    </ToggleArea>

    <template #footer>
      <div class="edit-pokemon-footer flex-row-start-center gap-10px">
        <FormButton v-if="props.index != null" class="important" @click="deletePokemon"
          >削除</FormButton
        >
        <div class="flex-110"></div>
        <div class="x" @click="shareX"><img src="../img/x.svg" /></div>
        <FormButton @click="save(true)" :disabled="saveDisabled" v-if="props.index == null"
          >保存して続けて登録</FormButton
        >
        <FormButton @click="save(false)" :disabled="saveDisabled">保存</FormButton>
      </div>
    </template>
  </PopupBase>
</template>

<style lang="scss" scoped>
.edit-pokemon-popup {
  width: 780px;
  height: min(900px, calc(100dvh - 40px));
  display: flex;
  flex-direction: column;

  :deep(.edit-pokemon-body) {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
  }

  .edit-pokemon-footer {
    flex: 0 0 auto;
    padding: 10px 20px;
    border-top: 1px solid var(--color-line);
    background-color: var(--color-surface);
  }

  .edit-form {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .assist-area {
    display: flex;
    flex: 0 0 190px;
    flex-direction: column;
    gap: 5px;

    .assist-heading {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    label {
      color: var(--color-muted);
      font-weight: bold;
    }
  }

  .assist-textarea {
    width: 100%;
    min-height: 250px;
  }

  .edit-area-scroll {
    flex: 1 1 0;
    min-width: 0;
  }

  .edit-area {
    width: 100%;
    min-width: 540px;

    .sub-skill-select-input {
      min-width: 0;
    }

    th {
      white-space: nowrap;
    }

    td {
      vertical-align: top;
    }

    td:nth-child(2) {
      width: 100%;
    }

    :deep(.nature-select thead th) {
      color: var(--color-execute);
    }

    :deep(.nature-select tbody th) {
      color: var(--color-danger);
    }

    select {
      width: 150px;
    }
  }

  .select-area {
    .select-check-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-bottom: 8px;
      padding: 6px 8px;
      border: 1px solid var(--color-line);
      border-radius: 5px;
      background: var(--color-surface-subtle);
    }

    .select-table-area {
      overflow-x: auto;

      table {
        border-collapse: collapse;
        width: 100%;
        white-space: nowrap;

        thead {
          tr {
            background-color: rgb(66, 85, 158);
            color: #fff;
          }
        }

        tbody {
          tr {
            border-bottom: 1px #ccc solid;
          }
        }

        th,
        td {
          padding: 3px 5px;

          &.best {
            font-weight: bold;
          }
        }
      }
    }

    .select-chart-area {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .select-chart-note {
      margin: 0;
      color: var(--color-muted);
      font-size: 80%;
    }

    .select-chart-section {
      border-top: 1px solid var(--color-line);
      padding-top: 10px;

      h3 {
        margin: 0 0 5px;
        font-size: 100%;
      }
    }

    .select-chart-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .select-chart {
      min-width: 0;

      h4 {
        margin: 0;
        text-align: center;
        font-size: 90%;
      }
    }

    .select-chart-canvas {
      height: 190px;
    }

    .select-chart-legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 2px 8px;
      font-size: 80%;

      span {
        display: inline-flex;
        align-items: center;
        gap: 3px;
      }

      i {
        display: block;
        width: 28px;
        border-top: 4px solid;
        border-color: var(--color-ink);

        &.same {
          border-top-style: dashed;
          border-color: #555;
        }

        &.food {
          border-top-style: dotted;
          border-color: #999;
        }
      }
    }
  }

  .x {
    background-color: #000;
    width: 24px;
    height: 24px;
    padding: 5px;
    border-radius: 50%;
  }
}
</style>

<style lang="scss" scoped>
@media (max-width: 600px), (max-width: 900px) and (max-height: 500px) {
  .edit-pokemon-popup {
    .assist-alert,
    .assist-area {
      display: none;
    }

    .edit-area-scroll {
      max-width: 100%;
      overflow-x: visible;
    }

    .edit-area {
      min-width: 0;
      table-layout: fixed;

      > thead > tr > th:first-child,
      > tbody > tr > th {
        width: 48px;
        white-space: normal;
      }

      > tbody > tr > td {
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .sub-skill-select-input {
        width: 100%;
      }

      select {
        width: 100%;
        min-width: 100px;
      }
    }

    .select-area {
      max-width: 100%;

      .select-chart-list {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  }
}
</style>
