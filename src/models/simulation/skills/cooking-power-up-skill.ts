import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class CookingPowerUpSkill implements SkillHandler {
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: 0, cookingPowerUpEffect: effect };
  }
}
