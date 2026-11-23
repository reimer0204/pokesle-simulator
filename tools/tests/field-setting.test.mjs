import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const { outputFiles } = await build({
  entryPoints: ['src/models/field-setting.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  loader: { '.png': 'dataurl' },
});
const {
  createFieldSettings,
  migrateFieldSettings,
  getFieldSetting,
  getResearchShardRate,
  getResearchShardToEnergy,
  FIELD_SETTING_MIGRATION_VERSION,
} = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
);

test('旧共通ボーナスを全フィールドへ移行し、新形式は再移行しない', () => {
  for (const bonus of [0, 85]) {
    const saved = { v: 20260928, simulation: { fieldBonus: bonus } };
    migrateFieldSettings(saved);
    assert.ok(
      Object.values(saved.simulation.fieldSettings).every((field) => field.bonus === bonus),
    );
    assert.equal('fieldBonus' in saved.simulation, false);
    saved.v = FIELD_SETTING_MIGRATION_VERSION;
    saved.simulation.fieldSettings['ワカクサ本島'].bonus = 25;
    migrateFieldSettings(saved);
    assert.equal(saved.simulation.fieldSettings['ワカクサ本島'].bonus, 25);
    assert.equal(saved.simulation.fieldSettings['シアンの砂浜'].bonus, bonus);
  }
});

test('通常・EXの効率と睡眠時間で報酬を求め、8.5時間以上は100で固定する', () => {
  const config = {
    sleepTime: 8.5,
    simulation: { field: 'ワカクサ本島', fieldSettings: createFieldSettings() },
  };
  const energy = 120000;
  for (const [field, expected] of [
    ['ワカクサ本島', 1000],
    ['ワカクサ本島EX', 1200],
  ]) {
    config.simulation.field = field;
    assert.equal(getFieldSetting(config).bonus, 0);
    for (const [sleepTime, factor] of [
      [4.25, 0.5],
      [8.5, 1],
      [10, 1],
    ]) {
      config.sleepTime = sleepTime;
      const rate = getResearchShardRate(config);
      assert.equal(energy * rate, expected * factor);
      // 週の4倍・月曜の残り7日・日曜の残り1日が従来どおり換算できる。
      for (const dayRate of [4, 7, 1]) {
        assert.ok(
          Math.abs(energy * dayRate * rate * getResearchShardToEnergy(config, dayRate) - energy) <
            1e-8,
        );
      }
    }
  }
  config.sleepTime = 8.5;
  config.simulation.fieldSettings['ワカクサ本島EX'].shardEfficiency = 20000;
  assert.equal(energy * getResearchShardRate(config), 600);
  config.simulation.field = 'ワカクサ本島';
  assert.equal(energy * getResearchShardRate(config), 1000);
});
