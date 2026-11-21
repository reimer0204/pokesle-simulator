import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { parse, compileScript } from '@vue/compiler-sfc';

test('チェックを外すとWorkerへミント個体を渡さず、再度ONにすると追加計算する', async () => {
  const { descriptor } = parse(
    readFileSync(new URL('../src/pages/check-list.vue', import.meta.url), 'utf8'),
  );
  const source = compileScript(descriptor, { id: 'test' }).content;
  const config = {
    pureMint: true,
    selectEvaluate: { levelList: { 30: true } },
    summary: { checklist: { showMint: true, food: { borderLv: 30 }, skill: { borderLv: 30 } } },
    simulation: {},
  };
  const boxes = [
    { name: 'テスト個体', nature: 'いじっぱり', foodList: ['a', 'a', 'a'] },
    { name: '無補正個体', nature: 'がんばりや', foodList: ['a', 'a', 'a'] },
  ];
  const calls = [];
  let pending;
  let watcher;
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      exports,
      ref: (value) => ({ value }),
      computed: (getter) => ({
        get value() {
          return getter();
        },
      }),
      watch: (_, callback) => {
        watcher = callback;
      },
      onBeforeUnmount() {},
      require(name) {
        if (name === 'vue') return { defineComponent: (value) => value };
        if (name.endsWith('/config.ts')) return { default: config };
        if (name.endsWith('/nature'))
          return { default: { map: { いじっぱり: { good: true }, がんばりや: {} } } };
        if (name.endsWith('/evaluate-table.ts')) return { default: { load: async () => ({}) } };
        if (name.endsWith('/multi-worker.js'))
          return {
            default: class {
              close() {}
            },
          };
        if (name.endsWith('/async-watcher.js'))
          return {
            AsyncWatcher: {
              init: () => ({
                run: (callback) => {
                  pending = callback({});
                  return pending;
                },
              }),
            },
          };
        if (name.endsWith('/pokemon-box.js'))
          return {
            default: {
              list: boxes,
              watch: { value: 0 },
              async simulation(list, worker, table, simulationConfig) {
                calls.push({ list, simulationConfig });
                return list.map((box) => ({ box, base: { foodList: [{ name: 'a' }] } }));
              },
            },
          };
        return { default: {} };
      },
    },
  );
  const page = exports.default.setup({}, { expose() {} });
  await Promise.resolve();
  await pending;
  assert.equal(calls.at(-1).list.length, 3);
  assert.equal(calls.at(-1).list.filter((box) => box.useMint).length, 1);
  assert.equal(config.pureMint, true);
  assert.equal(calls.at(-1).simulationConfig.pureMint, false);
  config.summary.checklist.showMint = false;
  watcher();
  await Promise.resolve();
  await pending;
  assert.equal(calls.at(-1).list.length, 2);
  assert.equal(
    calls.at(-1).list.some((box) => box.useMint),
    false,
  );
  assert.equal(page.mintSimulatedPokemonList.value.length, 0);
  config.summary.checklist.showMint = true;
  watcher();
  await Promise.resolve();
  await pending;
  assert.equal(calls.at(-1).list.length, 3);
  assert.equal(page.simulatedPokemonList.value.length, 2);
  assert.equal(page.mintSimulatedPokemonList.value.length, 1);
});
