import { Food } from '../../../data/food_and_cooking';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class BuildUpSkill implements SkillHandler {
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return {
      energyPerSkill: 0,
      foodGet: effect.main,
      foodGetList: Food.list,
      cookingChance: effect.sub,
    };
  }
}
