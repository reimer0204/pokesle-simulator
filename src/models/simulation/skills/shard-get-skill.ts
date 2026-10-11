import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class ShardGetSkill implements SkillHandler {
  evaluate({ effect, executor, weight }: SkillEvaluationContext): SkillEvaluationResult {
    executor.shard += effect * executor.skillPerDay * weight;
    return { energyPerSkill: 0 };
  }
}
