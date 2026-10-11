import Skill from '../../../data/skill';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class CopySkill implements SkillHandler {
  evaluate({ config, mode, skill, skillLv }: SkillEvaluationContext): SkillEvaluationResult {
    return {
      energyPerSkill:
        mode == 2
          ? Skill.map['エナジーチャージS'].effect[skillLv]
          : (config.selectEvaluate.skillEnergy[skill.name][skillLv] ??
            skill.evaluateEnergy![skillLv]),
    };
  }
}
