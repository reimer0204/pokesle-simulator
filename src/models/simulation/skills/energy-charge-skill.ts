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
      fixedSpecificationInput('effect', 'スキル効果量', effect, 'エナジー'),
      specificationInput('weight', '最終抽選の重み', 1, '倍'),
    ],
    modes: specificationModes(
      'スキルの基本評価 = スキル効果量\n最終評価 = スキルの基本評価 × 最終抽選の重み',
      {},
    ),
    resultLabel: 'スキル評価',
    resultUnit: 'エナジー/回',
    calculate: (values) => values.effect * values.weight,
  };
}

abstract class BaseEnergyChargeSkill implements SkillHandler {
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: effect };
  }
}

export class EnergyChargeSSkill extends BaseEnergyChargeSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'エナジーチャージS',
      effect: [400.0, 569.0, 785.0, 1083.0, 1496.0, 2066.0, 3212.0],
      energyOnly: true,
      category: 'energy',
    }),
  ];
}

export class RandomEnergyChargeSSkill extends BaseEnergyChargeSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'エナジーチャージS(ランダム)',
      effect: [500.0, 711.5, 981.5, 1354.0, 1870.0, 2582.5, 3915.0],
      energyOnly: true,
      category: 'energy',
    }),
  ];
}

export class EnergyChargeMSkill extends BaseEnergyChargeSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'エナジーチャージM',
      effect: [800.0, 1251.0, 1726.0, 2383.0, 3290.0, 4546.0, 6858.0],
      energyOnly: true,
      category: 'energy',
    }),
  ];
}

export const skillDefinitions = [
  ...EnergyChargeSSkill.skillDefinitions,
  ...RandomEnergyChargeSSkill.skillDefinitions,
  ...EnergyChargeMSkill.skillDefinitions,
];

for (const definition of skillDefinitions) {
  definition.specification = (level) => specification(definition.effect[level] as number);
}
