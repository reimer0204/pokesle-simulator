import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class AuraSphereSkill implements SkillHandler {
  evaluate({ effect, executor, weight }: SkillEvaluationContext): SkillEvaluationResult {
    executor.shard += effect.shard * executor.skillPerDay * weight;
    return { energyPerSkill: effect.energy };
  }
}
