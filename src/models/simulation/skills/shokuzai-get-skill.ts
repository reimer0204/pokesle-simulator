import { SkillDefinition } from './skill-definition';
import { Food } from '../../../data/food_and_cooking';
import { foodHandlerSpecification } from './food-specification';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class FoodGetSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: 0, foodGet: effect, foodGetList: Food.list };
  }
}

FoodGetSkill.skillDefinitions = [
  new SkillDefinition({
    name: '食材ゲットS',
    effect: [6.0, 8.0, 11.0, 14.0, 17.0, 21.0, 24.0],
    category: 'food',
    specification: (level) =>
      foodHandlerSpecification(FoodGetSkill.skillDefinitions[0].effect[level], 'allFood'),
  }),
];

export const skillDefinitions = FoodGetSkill.skillDefinitions;
