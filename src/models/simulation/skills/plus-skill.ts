import { Cooking, Food } from '../../../data/food_and_cooking';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class PlusSkill implements SkillHandler {
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { copy, effect, executor, foodEnergyMap, foodEnergyWeight, mode, pokemonList, weight } =
      context;
    const energyFood = Food.map[executor.foodList[0].name];
    const num = Math.round(effect.sub / energyFood.energy) + 6;
    let energyPerSkill = 0;

    if (mode == 3) {
      energyPerSkill = energyFood.energy * energyFood.bestRate * Cooking.maxRecipeBonus * num;
    } else if (mode == 1 && foodEnergyWeight > 0) {
      executor[energyFood.name] =
        Number(executor[energyFood.name] ?? 0) + num * executor.skillPerDay * weight;
      energyPerSkill = foodEnergyMap[energyFood.name].max * num * foodEnergyWeight;
    } else if (
      mode == 2 &&
      pokemonList!.filter(
        (x) =>
          x.base.skill.name == 'プラス(食材ゲットS)' ||
          x.base.skill.name == 'マイナス(料理パワーアップS)',
      ).length >= 2
    ) {
      const getFood = Food.map[copy ? copy.foodList[0].name : executor.foodList[0].name];
      executor[getFood.name] =
        Number(executor[getFood.name] ?? 0) + num * executor.skillPerDay * weight;
    }
    return { energyPerSkill, foodGet: effect.main, foodGetList: Food.list };
  }
}
