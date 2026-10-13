import { SkillDefinition } from './skill-definition';
import Skill from '../../../data/skill';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

function specification(evaluateEnergy: number): SkillSpecification {
  return {
    inputs: [
      {
        key: 'selectEnergy',
        label: '厳選・ボックス用の設定値',
        defaultValue: evaluateEnergy,
        step: 0.1,
        unit: 'エナジー',
      },
      {
        key: 'teamEnergy',
        label: 'チーム用エナジーチャージS効果',
        defaultValue: 400,
        step: 0.1,
        unit: 'エナジー',
      },
      { key: 'weight', label: '最終抽選の重み', defaultValue: 1, step: 0.1, unit: '倍' },
    ],
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula:
          'スキルの基本評価 = スキル評価の設定値があればその値、なければこのスキルに登録された評価値\n最終評価 = スキルの基本評価 × 最終抽選の重み',
        description: '登録された評価値は、エナジーチャージMの同じスキルLvの値です。',
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula:
          'スキルの基本評価 = スキル評価の設定値があればその値、なければこのスキルに登録された評価値\n最終評価 = スキルの基本評価 × 最終抽選の重み',
        description: '厳選計算時と同じ分岐です。',
      },
      {
        id: PokemonSimulatorMode.TEAM,
        label: 'チーム計算時',
        formula:
          'スキルの基本評価 = エナジーチャージS.effect[スキルLv]\n最終評価 = スキルの基本評価 × 最終抽選の重み',
        description: 'チームではコピー先を直接評価せず、同レベルのエナジーチャージSを使用します。',
      },
    ],
    resultLabel: 'コピー後の評価',
    resultUnit: 'エナジー/回',
    calculate: (values, mode) =>
      (mode === PokemonSimulatorMode.TEAM ? values.teamEnergy : values.selectEnergy) *
      values.weight,
  };
}

abstract class BaseCopySkill implements SkillHandler {
  evaluate({ config, mode, skill, skillLv }: SkillEvaluationContext): SkillEvaluationResult {
    return {
      energyPerSkill:
        mode == PokemonSimulatorMode.TEAM
          ? Skill.map['エナジーチャージS'].effect[skillLv]
          : (config.selectEvaluate.skillEnergy[skill.name][skillLv] ??
            skill.evaluateEnergy![skillLv]),
    };
  }
}

export class TransformCopySkill extends BaseCopySkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'へんしん(スキルコピー)',
      effect: [null, null, null, null, null, null, null],
      metronome: false,
      copyable: false,
      specification: (level) =>
        specification(TransformCopySkill.skillDefinitions[0].evaluateEnergy?.[level] ?? 0),
    }),
  ];
}

export class MimicCopySkill extends BaseCopySkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'ものまね(スキルコピー)',
      effect: [null, null, null, null, null, null, null],
      metronome: false,
      copyable: false,
      specification: (level) =>
        specification(MimicCopySkill.skillDefinitions[0].evaluateEnergy?.[level] ?? 0),
    }),
  ];
}

export const skillDefinitions = [
  ...TransformCopySkill.skillDefinitions,
  ...MimicCopySkill.skillDefinitions,
];
