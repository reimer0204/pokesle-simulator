import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class EnergyChargeSkill implements SkillHandler {
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: effect };
  }
}
