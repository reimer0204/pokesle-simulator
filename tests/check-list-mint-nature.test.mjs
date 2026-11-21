import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { parse, compileScript } from '@vue/compiler-sfc';
import * as Vue from 'vue';
import { renderToString } from '@vue/server-renderer';

test('一覧とボックス確認の個体表示は、ミント個体のせいかくを🌿に置き換える', async () => {
  for (const path of [
    '../src/pages/check-list/pokemon-info.vue',
    '../src/pages/box-summary/pokemon-info.vue',
  ]) {
    const { descriptor } = parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
    const source = compileScript(descriptor, { id: 'test', inlineTemplate: true }).content;
    const exports = {};
    vm.runInNewContext(
      ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText,
      {
        exports,
        require(name) {
          if (name === 'vue') return Vue;
          if (name.endsWith('/nature-info.vue'))
            return {
              default: {
                props: ['nature'],
                setup: (props) => () => Vue.h('span', props.nature.name),
              },
            };
          return { default: {}, Food: { map: {} } };
        },
      },
    );
    for (const useMint of [false, true]) {
      const app = Vue.createSSRApp(exports.default, {
        nature: true,
        pokemon: {
          box: { index: 0, foodList: [], useMint },
          foodList: [],
          base: {},
          nature: { name: useMint ? 'がんばりや' : 'いじっぱり' },
        },
      });
      for (const name of ['NameLabel', 'LvLabel', 'SubSkillLabelList'])
        app.component(name, { render: () => Vue.h('span') });
      const html = await renderToString(app);
      if (useMint) {
        assert.match(html, /🌿/);
        assert.doesNotMatch(html, /がんばりや/);
      } else {
        assert.match(html, /いじっぱり/);
        assert.doesNotMatch(html, /🌿/);
      }
    }
  }
});
