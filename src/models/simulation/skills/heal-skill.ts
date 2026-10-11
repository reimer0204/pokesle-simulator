import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class HealSkill implements SkillHandler {
  evaluate(_context: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: 0 };
  }
}
