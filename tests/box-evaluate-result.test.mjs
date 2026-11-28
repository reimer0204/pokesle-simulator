import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as Vue from 'vue';
import { renderToString } from 'vue/server-renderer';
import { parse, compileScript } from '@vue/compiler-sfc';

// 名前表示も実コンポーネントを使い、評価未取得時の描画エラーを検出する。
function loadComponent(path, dependencies = {}) {
  const { descriptor } = parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
  const source = compileScript(descriptor, { id: path, inlineTemplate: true }).content;
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      exports,
      ...Vue,
      require(name) {
        if (name === 'vue') return Vue;
        assert.ok(name in dependencies, `Unexpected import: ${name}`);
        return dependencies[name];
      },
    },
  );
  return exports.default;
}

const NameLabel = loadComponent('../src/components/status/name-label.vue');
const base = { name: 'テスト', afterList: ['テスト'] };
const branchingBase = { name: '分岐前', afterList: ['テスト', '別進化'] };
const toxelBase = {
  name: 'エレズン',
  afterList: ['ストリンダー(ハイなすがた)', 'ストリンダー(ローなすがた)'],
};
const config = { pokemonList: { selectDetail: false } };
const EvaluateResult = loadComponent('../src/components/page-assist/index/evaluate-result.vue', {
  '@/models/config.ts': { default: config },
  '@/models/popup/popup.ts': { default: {} },
  '@/components/evaluate-table-detail-popup.vue': { default: {} },
  '@/data/pokemon.ts': {
    default: {
      map: {
        テスト: base,
        別進化: { name: '別進化' },
        ...Object.fromEntries(toxelBase.afterList.map((name) => [name, { name }])),
      },
    },
  },
});

async function render(evaluateResult, props = {}, pokemonBase = base) {
  const app = Vue.createSSRApp({
    render: () =>
      Vue.h(EvaluateResult, {
        pokemon: { base: pokemonBase, evaluateResult },
        lv: 'max',
        ...props,
      }),
  });
  app.component('NameLabel', NameLabel);
  const errors = [];
  app.config.errorHandler = (error) => errors.push(error);
  const html = await renderToString(app);
  assert.deepEqual(errors, []);
  return html;
}

test('評価・対象レベル・評価種別が未取得でも厳選欄を「-」で描画する', async () => {
  config.pokemonList.selectDetail = false;
  for (const result of [null, undefined, {}, { max: {} }, { max: { best: {} } }]) {
    const html = await render(result);
    assert.ok(html.includes('-'));
    assert.ok(!html.includes('name-label'));
  }
  const html = await render(
    { max: { best: { energy: { name: 'テスト', score: 0.9 } } } },
    {
      type: 'specialty',
    },
  );
  assert.ok(html.includes('-'));
  assert.ok(!html.includes('name-label'));
});

test('進化先が1つなら名前を省略し、厳選度と詳細表示の未取得値を維持する', async () => {
  config.pokemonList.selectDetail = false;
  const html = await render({
    max: {
      best: { energy: { name: 'テスト', score: 0.9 } },
      テスト: { energy: { score: 0.9 } },
    },
  });
  assert.ok(!html.includes('name-label'));
  assert.ok(html.includes('90.0%'));

  config.pokemonList.selectDetail = true;
  try {
    const detail = await render(null);
    assert.ok(!detail.includes('name-label'));
    assert.ok(detail.includes('-'));
  } finally {
    config.pokemonList.selectDetail = false;
  }
});

test('進化先が複数なら通常表示でも進化先別の詳細表示でも名前を表示する', async () => {
  const result = {
    max: {
      best: { energy: { name: 'テスト', score: 0.9 } },
      テスト: { energy: { score: 0.9 } },
      別進化: {},
    },
  };
  config.pokemonList.selectDetail = false;
  const html = await render(result, {}, branchingBase);
  assert.ok(html.includes('name-label'));
  assert.ok(html.includes('テスト'));
  assert.ok(html.includes('90.0%'));
  config.pokemonList.selectDetail = true;
  try {
    const detail = await render(result, {}, branchingBase);
    assert.ok(detail.includes('テスト'));
    assert.ok(detail.includes('別進化'));
    assert.ok(detail.includes('90.0%'));
    assert.ok(detail.includes('-'));
  } finally {
    config.pokemonList.selectDetail = false;
  }
});

test('エレズンはせいかくに応じた片方だけの厳選結果なら進化先名を省略する', async () => {
  try {
    for (const after of toxelBase.afterList) {
      for (const lv of ['max', 30]) {
        const result = {
          [lv]: {
            best: { energy: { name: after, score: 0.9 } },
            [after]: { energy: { score: 0.9 } },
          },
        };
        for (const selectDetail of [false, true]) {
          config.pokemonList.selectDetail = selectDetail;
          const html = await render(result, { lv }, toxelBase);
          assert.ok(!html.includes('name-label'));
          assert.ok(html.includes('90.0%'));
          // 未計算のもう片方の姿の「-」行も作らない。
          assert.ok(!html.includes('>-<'));
        }
      }
    }
  } finally {
    config.pokemonList.selectDetail = false;
  }
});
