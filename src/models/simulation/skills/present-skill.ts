import { Food } from '../../../data/food_and_cooking';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class PresentSkill implements SkillHandler {
  evaluate({ config, effect, mode }: SkillEvaluationContext): SkillEvaluationResult {
    return {
      energyPerSkill: mode == 3 ? config.selectEvaluate.energyPerCandy * 4 : 0,
      foodGet: effect,
      foodGetList: Food.list,
    };
  }
}
