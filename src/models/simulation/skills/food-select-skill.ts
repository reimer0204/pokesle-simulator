import { Food } from '../../../data/food_and_cooking';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class FoodSelectSkill implements SkillHandler {
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { copy, effect, executor, skill, weight } = context;
    if (skill.name == 'きょううん(食材セレクトS)') {
      executor.shard += effect.shard * executor.skillPerDay * weight;
    }
    return {
      energyPerSkill: 0,
      foodGet: effect.food,
      foodGetList: copy
        ? copy.base.foodList.map((x: any) => Food.map[x.name])
        : (skill.foodList ?? executor.base.foodList.map((x: any) => Food.map[x.name])),
    };
  }
}
