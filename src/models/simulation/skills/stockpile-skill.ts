import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class StockpileSkill implements SkillHandler {
  evaluate({ copy, effect, executor }: SkillEvaluationContext): SkillEvaluationResult {
    return {
      energyPerSkill:
        copy || executor.base.skill.name === 'ゆびをふる' ? effect.base : effect.expect,
    };
  }
}
