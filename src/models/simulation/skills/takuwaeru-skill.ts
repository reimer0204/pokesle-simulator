import { SkillDefinition } from './skill-definition';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

function specification(effect: { base: number; expect: number }): SkillSpecification {
  return {
    inputs: [
      {
        key: 'base',
        label: '基本エナジー',
        defaultValue: effect.base,
        step: 0.1,
        unit: 'エナジー',
        editable: false,
      },
      {
        key: 'expect',
        label: '通常時の期待エナジー',
        defaultValue: effect.expect,
        step: 0.1,
        unit: 'エナジー',
        editable: false,
      },
      {
        key: 'copyOrMetronome',
        label: 'コピーまたはゆびをふる時',
        defaultValue: 0,
        step: 0.1,
        unit: '（1: はい）',
      },
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
          'スキルの基本評価 = コピー中 または 元スキルがゆびをふる なら 基本エナジー、それ以外は通常時の期待エナジー\n最終評価 = スキルの基本評価 × 最終抽選の重み',
        description: 'コピー・メトロノーム時だけ基本値を使用します。',
      }),
    ),
    resultLabel: 'スキル評価',
    resultUnit: 'エナジー/回',
    calculate: (values) => (values.copyOrMetronome ? values.base : values.expect) * values.weight,
  };
}

export default class StockpileSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate({ copy, effect, fromMetronome }: SkillEvaluationContext): SkillEvaluationResult {
    return {
      energyPerSkill: copy || fromMetronome ? effect.base : effect.expect,
    };
  }
}

StockpileSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'たくわえる(エナジーチャージS)',
    effect: [
      { base: 600, expect: 587 },
      { base: 853, expect: 834 },
      { base: 1177, expect: 1151 },
      { base: 1625, expect: 1590 },
      { base: 2243, expect: 2194 },
      { base: 3099, expect: 3031 },
      { base: 4502, expect: 4404 },
    ],
    metronome: false,
    energyOnly: true,
    category: 'energy',
    specification: (level) => specification(StockpileSkill.skillDefinitions[0].effect[level]),
  }),
];

export const skillDefinitions = StockpileSkill.skillDefinitions;
