import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const saved = [];
  const requests = [];
  const state = { normal: false, mint: false, valid: true, table: {}, gate: null };
  const result = (hit) => ({
    evaluateResult: state.valid ? { 50: { ピカチュウ: { energy: { score: 0.5 } } } } : null,
    hitCheckList: hit ? ['hit'] : [],
  });
  const dependencies = {
    '@/data/nature': { default: { map: { いじっぱり: { good: 'speed' }, がんばりや: {} } } },
    '../config': { default: { clone: () => ({ simulation: {} }) } },
    '../pokemon-box/pokemon-box': {
      default: {
        check() {},
        post(pokemon) {
          saved.push(pokemon);
        },
      },
    },
    '../multi-worker': {
      default: class {
        async call(_, getRequest) {
          const request = getRequest();
          requests.push(request);
          if (request.type === 'config') return [null];
          if (state.gate) await state.gate;
          return [
            [result(state.normal), ...(request.pokemonList.length > 1 ? [result(state.mint)] : [])],
          ];
        }
        reject() {}
        close() {}
      },
    },
    '../pokemon-box/pokemon-box-worker?worker': { default: class {} },
    '../simulation/evaluate-table': { default: { load: async () => state.table } },
  };
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(
      readFileSync(
        new URL('../src/models/ocr/android-pokemon-registration.ts', import.meta.url),
        'utf8',
      ),
      {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      },
    ).outputText,
    { exports, require: (name) => dependencies[name] },
  );
  return { ...exports, saved, requests, state };
}

const pokemon = {
  pokemonName: 'ピカチュウ',
  name: 'ピカチュウ',
  lv: 30,
  mainSkillLv: 2,
  foodList: ['a', 'b', 'c'],
  subSkillList: ['1', '2', '3', '4', '5'],
  nature: 'いじっぱり',
};

test('登録条件3種類を通常・ミント後の全組み合わせで判定する', async () => {
  for (const condition of ['all', 'normal-or-mint', 'normal']) {
    for (const normal of [false, true])
      for (const mint of [false, true]) {
        const api = setup();
        Object.assign(api.state, { normal, mint });
        const registration = new api.default();
        await registration.initialize();
        const expected = condition === 'all' || normal || (condition === 'normal-or-mint' && mint);
        assert.equal(await registration.register(pokemon, condition), expected);
        assert.equal(api.saved.length, expected ? 1 : 0);
        if (expected) assert.equal(api.saved[0].nature, 'いじっぱり');
        if (condition === 'normal-or-mint') {
          assert.equal(api.requests.at(-1).pokemonList[1].nature, 'がんばりや');
        }
        registration.stop();
      }
  }
});

test('評価基準なし・評価結果なしでは登録しない', async () => {
  const api = setup();
  api.state.table = null;
  const registration = new api.default();
  await assert.rejects(registration.initialize(), /基準生成/);
  api.state.table = {};
  await registration.initialize();
  api.state.valid = false;
  await assert.rejects(registration.register(pokemon, 'all'), /厳選情報/);
  assert.equal(api.saved.length, 0);
  registration.stop();
});

test('計算中に中断した場合は、その個体を保存しない', async () => {
  const api = setup();
  let resume;
  api.state.gate = new Promise((resolve) => {
    resume = resolve;
  });
  const registration = new api.default();
  await registration.initialize();
  const pending = registration.register(pokemon, 'all');
  registration.stop();
  resume();
  assert.equal(await pending, false);
  assert.equal(api.saved.length, 0);
});
