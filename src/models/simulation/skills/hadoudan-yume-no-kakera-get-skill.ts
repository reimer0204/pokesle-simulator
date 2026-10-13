import { SkillDefinition } from './skill-definition';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

function specification(effect: { shard: number; energy: number }): SkillSpecification {
  return {
    inputs: [
      {
        key: 'energy',
        label: '固定エナジー',
        defaultValue: effect.energy,
        step: 0.1,
        unit: 'エナジー',
        editable: false,
      },
      {
        key: 'shard',
        label: 'ゆめのかけら',
        defaultValue: effect.shard,
        step: 0.1,
        unit: 'かけら',
        editable: false,
      },
      { key: 'skillPerDay', label: '1日の発動回数', defaultValue: 8, step: 0.1, unit: '回' },
      { key: 'weight', label: '最終抽選の重み', defaultValue: 1, step: 0.1, unit: '倍' },
    ],
    modes: [PokemonSimulatorMode.SELECT, PokemonSimulatorMode.ABOUT, PokemonSimulatorMode.TEAM].map(
      (id) => ({
        id,
        label:
          id === PokemonSimulatorMode.SELECT
            ? '厳選計算時'
            : id === PokemonSimulatorMode.ABOUT
              ? 'ボックス計算時'
              : 'チーム計算時',
        formula:
          'ゆめのかけら = ゆめのかけら × 1日の発動回数 × 最終抽選の重み\nスキルの基本評価 = 固定エナジー\n最終評価 = スキルの基本評価 × 最終抽選の重み',
        description: 'ゆめのかけらは実行者の状態へ記録します。',
      }),
    ),
    resultLabel: 'スキル評価',
    resultUnit: 'エナジー/回',
    calculate: (values) => values.energy * values.weight,
  };
}

export default class AuraSphereSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate({ effect, executor, weight }: SkillEvaluationContext): SkillEvaluationResult {
    executor.shard += effect.shard * executor.skillPerDay * weight;
    return { energyPerSkill: effect.energy };
  }
}

AuraSphereSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'はどうだん(ゆめのかけらゲットS)',
    effect: [
      { shard: 240.0, energy: 200 },
      { shard: 340.0, energy: 285 },
      { shard: 480.0, energy: 393 },
      { shard: 670.0, energy: 542 },
      { shard: 920.0, energy: 748 },
      { shard: 1260.0, energy: 1033 },
      { shard: 1800.0, energy: 1501 },
      { shard: 2500.0, energy: 2042 },
    ],
    shard: true,
    category: 'shard',
    specification: (level) => specification(AuraSphereSkill.skillDefinitions[0].effect[level]),
  }),
];

export const skillDefinitions = AuraSphereSkill.skillDefinitions;
