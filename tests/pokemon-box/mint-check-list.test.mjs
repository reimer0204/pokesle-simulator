import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// 実際のWorkerとチェックリストを接続し、シミュレーターだけを境界値の出力に置き換える。
function loadModule(path, dependencies, globals = {}) {
  const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      assert.ok(name in dependencies, `Unexpected import: ${name}`);
      return dependencies[name];
    },
    ...globals,
  });
  return exports;
}

const food = { name: 'とくせんリンゴ' };
const skill = { name: 'エナジーチャージS', effect: [1] };
const base = {
  name: 'テスト個体',
  afterList: ['テスト個体'],
  foodNameList: [food.name],
  foodList: [food],
  skill,
  specialty: '食材',
  evolveLv: 1,
  evolveCandyMap: {},
  isLast: true,
  fieldList: [1],
};
const Pokemon = { list: [base], map: { [base.name]: base } };
const masters = { Food: { list: [food] }, Cooking: { list: [] } };
const { CheckList, withMintChecked } = loadModule('../../src/models/check-list.ts', {
  '@/data/food_and_cooking': masters,
  '@/data/pokemon': { default: Pokemon },
  '@/data/skill': { default: { list: [skill] } },
  './pokemon-target': { matchesPokemonTarget: () => true },
});

class Simulator {
  fromEvaluate() {
    return { base };
  }
  selectEvaluate(pokemon, subSkills, nature) {
    const value = nature.name === 'がんばりや' ? 60 : 40;
    Object.assign(pokemon, {
      [food.name]: value,
      bEpD: value,
      berryNumPerDay: value,
      foodNumPerDay: value,
      skillPerDay: value,
      energyPerDay: value,
      foodList: [food],
    });
    return pokemon;
  }
  selectEvaluateToScore(pokemon) {
    return pokemon.energyPerDay;
  }
  fromBox(box) {
    return { base, box, lv: 30, energyPerDay: 1, shard: 0 };
  }
  calcStatus() {}
  calcTeamHeal() {}
  calcHelp() {}
  dump() {}
}

async function simulate(pureMint, nature = 'いじっぱり', withContext = false) {
  let listener;
  let result;
  loadModule(
    '../../src/models/pokemon-box/pokemon-box-worker.ts',
    {
      '../../data/food_and_cooking': masters,
      '../../data/pokemon': { default: Pokemon },
      '../../data/skill': {},
      '../../data/sub-skill': { default: { useSilverSeed: () => [], map: {} } },
      '../../data/nature': {
        default: {
          map: { いじっぱり: { name: 'いじっぱり' }, がんばりや: { name: 'がんばりや' } },
        },
      },
      '../help-rate': {},
      '../pokemon-filter': {},
      '../simulation/pokemon-simulator': { default: Simulator },
      '../check-list': { CheckList },
    },
    {
      addEventListener: (_, callback) => {
        listener = callback;
      },
      postMessage: (message) => {
        if (message.status === 'success') result = message.body;
      },
    },
  );
  const config = {
    cleaning: true,
    pureMint,
    pureMintNature: 'がんばりや',
    selectEvaluate: { levelList: { 30: true } },
    simulation: { selectType: 0, selectBorder: 0, fieldBonus: 0, shardWeight: 0 },
    summary: {
      checklist: {
        food: {
          borderLv: 30,
          borderRate: 1,
          borderValue: 100,
          targetValue: 100,
          borderType: 0,
          enableMap: { [food.name]: true },
        },
        skill: {
          borderLv: 30,
          borderRate: 1,
          borderValue: 100,
          targetValue: 100,
          enableMap: { [skill.name]: true },
        },
        pokemonCondition: {
          selectLv: 30,
          disablePokemonMap: {},
          list: [{ aaa: true, energyBorder: 50, alsoFoodAndSkill: true }],
        },
      },
    },
  };
  const percentile = [0, 50, 100];
  const evaluateTable = {
    [base.name]: {
      30: {
        '00': {
          energy: percentile,
          berry: percentile,
          food: percentile,
          skill: percentile,
          food1: percentile,
        },
      },
    },
    scoreForHealerEvaluate: { 30: { '': { energy: 1 } } },
    scoreForSupportEvaluate: { 30: { '': { energy: 1 } } },
  };
  await listener({ data: { type: 'config', config } });
  await listener({
    data: {
      type: 'basic',
      evaluateTable,
      pokemonList: [
        {
          name: base.name,
          lv: 30,
          foodList: [food.name, food.name, food.name],
          subSkillList: [],
          nature,
          index: 0,
        },
        {
          name: base.name,
          lv: 30,
          foodList: [food.name, food.name, food.name],
          subSkillList: [],
          nature: 'がんばりや',
          index: 1,
        },
      ],
    },
  });
  return withContext ? { result, config, evaluateTable } : result;
}

test('ミント後だけ基準を満たす食材・スキル・厳選度は通常のチェックリストに混ざらない', async () => {
  const [before, after] = await simulate(true);
  assert.equal(before.hitCheckList.length, 0);
  assert.deepEqual(Array.from(after.hitCheckList, (item) => item.type).sort(), [
    'food',
    'pokemon',
    'skill',
  ]);
  assert.equal(before.evaluateResult[30][base.name].foodNumList[0], 40);
  assert.equal(after.evaluateResult[30][base.name].foodNumList[0], 60);
  assert.equal(before.evaluateResult[30][base.name].food.pureMint.value, 60);
});

test('ミント比較を有効にしても通常のチェックリスト判定結果は変わらない', async () => {
  for (const nature of ['いじっぱり', 'がんばりや']) {
    const [normal] = await simulate(false, nature);
    const [compared] = await simulate(true, nature);
    assert.equal(JSON.stringify(compared.hitCheckList), JSON.stringify(normal.hitCheckList));
    assert.equal(
      JSON.stringify(compared.evaluateResult[30][base.name].foodNumList),
      JSON.stringify(normal.evaluateResult[30][base.name].foodNumList),
    );
  }
});

test('3一覧はミント前の該当を優先し、ミント後のみ該当する場合に済（🌿）を表示する', async () => {
  const {
    result: [before, after],
    config,
    evaluateTable,
  } = await simulate(false, 'いじっぱり', true);
  before.foodCombination = after.foodCombination = 'AAA';
  const checkList = new CheckList(config, evaluateTable);
  function lists(pokemonList) {
    const foodList = checkList.foodCheckList(config, pokemonList);
    const skillList = checkList.skillCheckList(config, pokemonList);
    return [
      checkList.pokemonCheckList(config, pokemonList, null, foodList, skillList),
      foodList,
      skillList,
    ];
  }
  const beforeLists = lists([before]);
  const afterLists = lists([after]);
  const keys = [(row) => row.name, (row) => row.food.name, (row) => row.skill.name];
  for (let i = 0; i < 3; i++) {
    const display = (normal, mint) => {
      const merged = withMintChecked(normal, mint, keys[i]);
      return merged.columnList
        .find((column) => column.key === 'checked')
        .convert(merged.dataList[0]);
    };
    assert.equal(display(beforeLists[i], afterLists[i]), '済（🌿）');
    assert.equal(display(afterLists[i], afterLists[i]), '済');
    assert.equal(display(afterLists[i], beforeLists[i]), '済');
    assert.equal(display(beforeLists[i], beforeLists[i]), '');
    assert.equal(!!beforeLists[i].dataList[0].checked, false);
    assert.equal(beforeLists[i].dataList[0].mintChecked, undefined);
  }
});

test('食材またはスキル基準によるポケモンの厳選済もミント前後で分けて判定する', async () => {
  const {
    result: [before, after],
    config,
    evaluateTable,
  } = await simulate(false, 'いじっぱり', true);
  before.foodCombination = after.foodCombination = 'AAA';
  config.summary.checklist.pokemonCondition.list[0].energyBorder = 100;
  const checkList = new CheckList(config, evaluateTable);
  const create = (pokemon) =>
    checkList.pokemonCheckList(
      config,
      [pokemon],
      null,
      checkList.foodCheckList(config, [pokemon]),
      checkList.skillCheckList(config, [pokemon]),
    );
  const normal = create(before);
  const mint = create(after);
  const merged = withMintChecked(normal, mint, (row) => row.name);
  assert.equal(!!merged.dataList[0].checked, false);
  assert.equal(merged.dataList[0].mintChecked, true);
  assert.equal(
    merged.columnList.find((column) => column.key === 'checked').convert(merged.dataList[0]),
    '済（🌿）',
  );
});

test('ミントONでは最良値とボックスに両方を含め、OFFでは通常個体だけを表示する', async () => {
  const {
    result: [before, after],
    config,
    evaluateTable,
  } = await simulate(false, 'いじっぱり', true);
  before.foodCombination = after.foodCombination = 'AAA';
  after.box.useMint = true;
  const checkList = new CheckList(config, evaluateTable);
  const lists = (pokemonList) => {
    const foods = checkList.foodCheckList(config, pokemonList);
    const skills = checkList.skillCheckList(config, pokemonList);
    return [checkList.pokemonCheckList(config, pokemonList, null, foods, skills), foods, skills];
  };
  const normal = lists([before]);
  const mint = lists([after]);
  const combined = lists([before, after]);
  const keys = [(row) => row.name, (row) => row.food.name, (row) => row.skill.name];
  for (let i = 0; i < 3; i++) {
    const displayed = withMintChecked(normal[i], mint[i], keys[i], combined[i]);
    assert.equal(displayed.dataList[0].pokemon, after);
    assert.equal(displayed.dataList[0].pokemon.box.useMint, true);
    assert.equal(displayed.dataList[0].table.dataList.length, 2);
    assert.equal(displayed.dataList[0].table.dataList[0].pokemon, after);
    assert.equal(displayed.dataList[0].table.dataList[1].pokemon, before);
    assert.equal(
      displayed.columnList
        .find((column) => column.key === 'checked')
        .convert(displayed.dataList[0]),
      '済（🌿）',
    );
    assert.equal(normal[i].dataList[0].pokemon, before);
    assert.equal(normal[i].dataList[0].table.dataList.length, 1);
    assert.equal(
      normal[i].columnList
        .find((column) => column.key === 'checked')
        .convert(normal[i].dataList[0]),
      '',
    );
  }
});

test('ミント後もフィールド別から除外する設定は3種の候補リストだけを切り替える', async () => {
  const {
    result: [before, after],
    config,
    evaluateTable,
  } = await simulate(false, 'いじっぱり', true);
  before.foodCombination = after.foodCombination = 'AAA';
  after.box.useMint = true;
  const checkList = new CheckList(config, evaluateTable);
  const lists = (pokemonList) => {
    const foods = checkList.foodCheckList(config, pokemonList);
    const skills = checkList.skillCheckList(config, pokemonList);
    return [checkList.pokemonCheckList(config, pokemonList, null, foods, skills), foods, skills];
  };
  const normal = lists([before]);
  const mint = lists([after]);
  const combined = lists([before, after]);
  const keys = [(row) => row.name, (row) => row.food.name, (row) => row.skill.name];
  for (let i = 0; i < 3; i++) {
    const retained = withMintChecked(normal[i], mint[i], keys[i], combined[i], false);
    const excluded = withMintChecked(normal[i], mint[i], keys[i], combined[i], true);
    assert.ok(retained.targetPokemonList.includes(base.name));
    assert.equal(excluded.targetPokemonList.length, 0);
    assert.equal(retained.dataList[0].mintChecked, true);
    assert.equal(excluded.dataList[0].mintChecked, true);
    assert.equal(retained.dataList[0].pokemon, excluded.dataList[0].pokemon);
    assert.ok(normal[i].targetPokemonList.includes(base.name));
  }
  const checkedNormal = lists([after]);
  for (let i = 0; i < 3; i++) {
    for (const exclude of [false, true]) {
      const displayed = withMintChecked(
        checkedNormal[i],
        mint[i],
        keys[i],
        checkedNormal[i],
        exclude,
      );
      assert.equal(displayed.targetPokemonList.length, 0);
    }
  }
});
