import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class NightmareSkill implements SkillHandler {
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: effect.energy };
  }
}
