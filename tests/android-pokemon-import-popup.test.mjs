import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { parse, compileScript } from '@vue/compiler-sfc';

function setup(failInitialization = false) {
  const { descriptor } = parse(
    readFileSync(
      new URL('../src/components/android-pokemon-import-popup.vue', import.meta.url),
      'utf8',
    ),
  );
  const script = compileScript(descriptor, { id: 'test' }).content;
  const app = { inert: false };
  const emitted = [];
  const state = { launches: 0, stops: 0, focused: false, process: null, saved: true };
  let finish;
  let signalStarted;
  const started = new Promise((resolve) => {
    signalStarted = resolve;
  });
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(script, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      exports,
      ref: (value) => ({ value }),
      nextTick: async () => {},
      onBeforeUnmount() {},
      document: { getElementById: () => app },
      require(name) {
        if (name.endsWith('/android-pokemon-reader'))
          return {
            default: class {
              read(process) {
                state.launches++;
                state.process = process;
                signalStarted();
                return new Promise((resolve) => {
                  finish = resolve;
                });
              }
              stop() {
                state.stops++;
                finish?.();
              }
            },
          };
        if (name.endsWith('/android-pokemon-registration'))
          return {
            default: class {
              async initialize() {
                if (failInitialization) throw new Error('基準なし');
              }
              async register() {
                return state.saved;
              }
              stop() {}
            },
          };
        return { default: {} };
      },
    },
  );
  const component = exports.default.setup(
    {},
    { expose() {}, emit: (...args) => emitted.push(args) },
  );
  component.abortButton.value = {
    $el: {
      focus() {
        state.focused = true;
      },
    },
  };
  return { component, app, emitted, state, started };
}

test('設定を開いただけでは起動せず、実行中は操作をロックして中断後に復帰する', async () => {
  const api = setup();
  assert.equal(api.state.launches, 0);
  const running = api.component.start();
  await api.started;
  assert.equal(api.app.inert, true);
  assert.equal(api.state.focused, true);
  api.component.close();
  assert.equal(api.emitted.length, 0);
  await api.state.process({ pokemonName: 'ピカチュウ' });
  assert.equal(api.component.registered.value, 1);
  assert.equal(api.component.currentPokemon.value, null);
  api.state.saved = false;
  await api.state.process({ pokemonName: 'イーブイ' });
  assert.equal(api.component.skipped.value, 1);
  assert.equal(api.component.currentPokemon.value, null);
  api.component.abort();
  await running;
  assert.equal(api.app.inert, false);
  assert.equal(api.component.running.value, false);
  assert.equal(api.component.registered.value, 1);
  assert.ok(api.state.stops);
  api.component.close();
  assert.equal(api.emitted[0][0], 'close');
});

test('準備に失敗した場合もロックを解除し、exeは起動しない', async () => {
  const api = setup(true);
  await api.component.start();
  assert.equal(api.app.inert, false);
  assert.equal(api.state.launches, 0);
  assert.match(api.component.status.value, /基準なし/);
});
