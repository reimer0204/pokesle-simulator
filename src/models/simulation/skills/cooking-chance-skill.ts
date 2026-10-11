import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class CookingChanceSkill implements SkillHandler {
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: 0, cookingChance: effect };
  }
}
