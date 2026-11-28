import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { parse, compileScript } from '@vue/compiler-sfc';
import * as Vue from 'vue';
import {
  mdiFilterOutline,
  mdiFilterCheck,
  mdiSortReverseVariant,
  mdiSortVariant,
  mdiSort,
} from '@mdi/js';

// 実コンポーネントのsetupを動かし、確定・変換・ソート・ページ送りの連携を検証する。
function mount(path, input, globals = {}) {
  const { descriptor } = parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
  const source = compileScript(descriptor, { id: path })
    .content.replace(/^import [^\n]*\n/gm, '')
    .replace('export default', 'const component =');
  const component = vm.runInNewContext(`${source}\ncomponent`, {
    ...Vue,
    mdiFilterOutline,
    mdiFilterCheck,
    mdiSortReverseVariant,
    mdiSortVariant,
    mdiSort,
    _useCssVars() {},
    _unref: Vue.unref,
    TableColumnFilter: {},
    ResizeObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    document: { addEventListener() {}, removeEventListener() {} },
    window: { addEventListener() {}, removeEventListener() {} },
    ...globals,
  });
  const renderer = Vue.createRenderer({
    createComment: () => ({}),
    insert() {},
    remove() {},
    parentNode() {},
    nextSibling() {},
  });
  const props = Vue.reactive(input);
  component.render = () => null;
  const app = renderer.createApp({ render: () => Vue.h(component, props) });
  app.mount({});
  return { state: app._instance.subTree.component.setupState, props, unmount: () => app.unmount() };
}

test('数値表示の丸め・桁数・区切り・負のゼロを維持し、フォーマッターを再利用する', () => {
  let formatterCount = 0;
  const table = mount(
    '../src/components/sortable-table.vue',
    { dataList: [] },
    {
      Intl: {
        NumberFormat: class extends Intl.NumberFormat {
          constructor(...args) {
            super(...args);
            formatterCount++;
          }
        },
      },
    },
  );
  const values = [
    0,
    -0,
    -0.001,
    1.005,
    2.675,
    -2.675,
    1234567.891,
    -1234567.891,
    1e21,
    NaN,
    Infinity,
  ];
  for (const fixed of [0, 1, 2, 6]) {
    for (const value of values) {
      const expected = Number(value.toFixed(fixed)).toLocaleString(undefined, {
        minimumFractionDigits: fixed,
        maximumFractionDigits: fixed,
      });
      assert.equal(table.state.formatNumber(value, fixed), expected);
    }
  }
  assert.equal(formatterCount, 4);
  for (let i = 0; i < 1000; i++) table.state.formatNumber(i / 100, 2);
  assert.equal(formatterCount, 4);
  table.unmount();
});

test('範囲の両端・複数選択・convert・ソート・ページ数と0件を扱う', async () => {
  const table = mount('../src/components/sortable-table.vue', {
    dataList: [
      { lv: 1, berry: 'A' },
      { lv: 30, berry: 'B' },
      { lv: 60, berry: 'A' },
      { lv: 60, berry: 'C' },
      { lv: 100, berry: 'B' },
    ],
    columnList: [
      { key: 'lv', type: Number, filter: { type: 'range', min: 1, max: 100 } },
      { key: 'berryName', convert: (x) => x.berry, filter: { type: 'select' } },
    ],
    pager: 2,
  });
  const s = table.state;
  assert.equal(s.pageMax, 3);
  s.page = 2;
  s.setFilter('lv', { min: 30, max: 60 });
  assert.equal(s.page, 0);
  assert.equal(s.pageMax, 2);
  assert.deepEqual(
    Array.from(s.filteredDataList, (x) => x.$original.lv),
    [30, 60, 60],
  );
  s.setFilter('berryName', ['A', 'B']);
  assert.deepEqual(
    Array.from(s.filteredDataList, (x) => x.$original.lv),
    [30, 60],
  );
  s.setSort({ shiftKey: false }, 'lv');
  s.setSort({ shiftKey: false }, 'lv');
  assert.deepEqual(
    Array.from(s.sortedDataList, (x) => x.$original.lv),
    [60, 30],
  );
  s.setFilter('berryName', ['D']);
  assert.equal(s.pageMax, 0);
  assert.equal(s.sortedDataList.length, 0);
  s.setFilter('berryName', null);
  s.setFilter('lv', null);
  assert.equal(s.filteredDataList.length, 5);
  s.setFilter('berryName', ['A']);
  table.props.columnList = [table.props.columnList[0]];
  await Vue.nextTick();
  assert.equal(s.filteredDataList.length, 5);
  table.unmount();
});

test('編集値は決定まで通知せず、閉じると破棄し、クリアで解除する', async () => {
  const updates = [];
  const editor = mount('../src/components/table-column-filter.vue', {
    column: { name: 'Lv', filter: { type: 'range', min: 1, max: 100 } },
    modelValue: { min: 10, max: 70 },
    'onUpdate:modelValue': (value) => updates.push(value),
  });
  const s = editor.state;
  await s.toggle();
  s.draft.min = 30;
  assert.equal(updates.length, 0);
  s.close();
  await s.toggle();
  assert.equal(s.draft.min, 10);
  s.draft.min = 80;
  assert.equal(s.validRange, false);
  s.draft.min = 30;
  s.apply();
  assert.equal(updates[0].min, 30);
  s.clear();
  assert.equal(updates[1], null);
  editor.unmount();
});

test('複数選択は確定時にまとめて通知し、空の選択は解除として扱う', async () => {
  const updates = [];
  const editor = mount('../src/components/table-column-filter.vue', {
    column: { name: 'きのみ', filter: { type: 'select', options: [] } },
    'onUpdate:modelValue': (value) => updates.push(value),
  });
  const s = editor.state;
  await s.toggle();
  s.toggleOption('A', true);
  s.toggleOption('B', true);
  assert.equal(updates.length, 0);
  s.apply();
  assert.deepEqual(Array.from(updates[0]), ['A', 'B']);
  await s.toggle();
  s.apply();
  assert.equal(updates[1], null);
  editor.unmount();
});
