import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

// ほっぺすりすりの追加発動は TeamSimulator が反復計算するため、ここでは評価しない。
export default class CheekRubSkill implements SkillHandler {
  evaluate({ config, mode, skill, skillLv }: SkillEvaluationContext): SkillEvaluationResult {
    return {
      energyPerSkill:
        mode == 2
          ? 0
          : (config.selectEvaluate.skillEnergy[skill.name][skillLv] ??
            skill.evaluateEnergy![skillLv]),
    };
  }
}
