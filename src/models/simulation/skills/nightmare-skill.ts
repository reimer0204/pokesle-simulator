import { SkillDefinition } from './skill-definition';
import {
  specificationInput,
  fixedSpecificationInput,
  specificationModes,
} from './specification-helpers';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

function specification(effect: number): SkillSpecification {
  return {
    inputs: [
      fixedSpecificationInput('effect', '固定エナジー', effect, 'エナジー'),
      specificationInput('weight', '最終抽選の重み', 1, '倍'),
    ],
    modes: specificationModes(
      'スキルの基本評価 = 固定エナジー\n最終評価 = スキルの基本評価 × 最終抽選の重み',
      {},
    ),
    resultLabel: 'スキル評価',
    resultUnit: 'エナジー/回',
    calculate: (values) => values.effect * values.weight,
  };
}

export default class NightmareSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: effect.energy };
  }
}

NightmareSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'ナイトメア(エナジーチャージM)',
    effect: [
      { energy: 2640, other: -12 },
      { energy: 3753, other: -12 },
      { energy: 5178, other: -12 },
      { energy: 7149, other: -12 },
      { energy: 9870, other: -12 },
      { energy: 13638, other: -12 },
      { energy: 18515, other: -12 },
    ],
    metronome: false,
    copyable: false,
    genki: true,
    category: 'energy',
  }),
];

export const skillDefinitions = NightmareSkill.skillDefinitions;

for (const definition of skillDefinitions) {
  definition.specification = (level) =>
    specification((definition.effect[level] as { energy: number }).energy);
}
