import Field from '../data/field';

export const FIELD_SETTING_MIGRATION_VERSION = 20261123;

export interface FieldSetting {
  bonus: number;
  shardEfficiency: number;
}

type ResearchConfig = {
  sleepTime: number;
  simulation: {
    field: string;
    fieldSettings: Record<string, FieldSetting>;
  };
};

export function createFieldSettings(bonus = 0): Record<string, FieldSetting> {
  return Object.fromEntries(
    Field.list.map((field) => [field.name, { bonus, shardEfficiency: field.ex ? 10000 : 12000 }]),
  );
}

export function migrateFieldSettings(savedConfig: any) {
  if ((Number(savedConfig.v) || 0) >= FIELD_SETTING_MIGRATION_VERSION) return;
  savedConfig.simulation ??= {};
  const simulation = savedConfig.simulation;
  simulation.fieldSettings = createFieldSettings(simulation.fieldBonus ?? 0);
  delete simulation.fieldBonus;
}

export function getFieldSetting(config: ResearchConfig): FieldSetting {
  return config.simulation.fieldSettings[config.simulation.field];
}

// 曜日による累積エナジーの倍率は呼び出し元で適用する。
export function getResearchShardRate(config: ResearchConfig): number {
  const sleepScore = Math.min(Math.max(config.sleepTime / 8.5, 0), 1) * 100;
  return sleepScore / getFieldSetting(config).shardEfficiency;
}

export function getResearchShardToEnergy(config: ResearchConfig, dayRate = 4): number {
  const rate = getResearchShardRate(config);
  return rate > 0 ? 1 / rate / dayRate : 0;
}
