import { SkillDefinition } from './skill-definition';
import {
  specificationInput,
  fixedSpecificationInput,
  specificationModes,
} from './specification-helpers';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

abstract class BaseShardGetSkill implements SkillHandler {
  evaluate({ effect, executor, weight }: SkillEvaluationContext): SkillEvaluationResult {
    executor.shard += effect * executor.skillPerDay * weight;
    return { energyPerSkill: 0 };
  }
}

function specification(effect: number): SkillSpecification {
  return {
    inputs: [
      fixedSpecificationInput('effect', 'スキル効果量', effect, 'かけら'),
      specificationInput('skillPerDay', '1日の発動回数', 8, '回'),
      specificationInput('weight', '抽選の重み', 1, '倍'),
    ],
    modes: specificationModes('ゆめのかけら = スキル効果量 × 1日の発動回数 × 抽選の重み'),
    resultLabel: '獲得ゆめのかけら',
    resultUnit: 'かけら/日',
    calculate: (values) => values.effect * values.skillPerDay * values.weight,
  };
}

export class ShardGetSkill extends BaseShardGetSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'ゆめのかけらゲットS',
      effect: [240.0, 340.0, 480.0, 670.0, 920.0, 1260.0, 1800.0, 2500.0],
      shard: true,
      category: 'shard',
      specification: (level) => specification(ShardGetSkill.skillDefinitions[0].effect[level]),
    }),
  ];
}

export class RandomShardGetSkill extends BaseShardGetSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'ゆめのかけらゲットS(ランダム)',
      effect: [300.0, 425.0, 600.0, 837.5, 1150.0, 1575.0, 2250.0, 2875.0],
      shard: true,
      category: 'shard',
      specification: (level) =>
        specification(RandomShardGetSkill.skillDefinitions[0].effect[level]),
    }),
  ];
}

export const skillDefinitions = [
  ...ShardGetSkill.skillDefinitions,
  ...RandomShardGetSkill.skillDefinitions,
];
