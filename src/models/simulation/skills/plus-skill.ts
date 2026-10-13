import { SkillDefinition } from './skill-definition';
import { Cooking, Food } from '../../../data/food_and_cooking';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import { foodHandlerSpecification } from './food-specification';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class PlusSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { copy, effect, executor, foodEnergyMap, foodEnergyWeight, mode, pokemonList, weight } =
      context;
    const energyFood = Food.map[executor.foodList[0].name];
    const num = Math.round(effect.sub / energyFood.energy) + 6;
    let energyPerSkill = 0;

    if (mode == PokemonSimulatorMode.SELECT) {
      energyPerSkill = energyFood.energy * energyFood.bestRate * Cooking.maxRecipeBonus * num;
    } else if (mode == PokemonSimulatorMode.ABOUT && foodEnergyWeight > 0) {
      executor[energyFood.name] =
        Number(executor[energyFood.name] ?? 0) + num * executor.skillPerDay * weight;
      energyPerSkill = foodEnergyMap[energyFood.name].max * num * foodEnergyWeight;
    } else if (
      mode == PokemonSimulatorMode.TEAM &&
      pokemonList!.filter((x) => x.base.skill.plusMinusPair).length >= 2
    ) {
      const getFood = Food.map[copy ? copy.foodList[0].name : executor.foodList[0].name];
      executor[getFood.name] =
        Number(executor[getFood.name] ?? 0) + num * executor.skillPerDay * weight;
    }
    return { energyPerSkill, foodGet: effect.main, foodGetList: Food.list };
  }
}

PlusSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'プラス(食材ゲットS)',
    effect: [
      { main: 5, sub: 0 },
      { main: 7, sub: 125 },
      { main: 9, sub: 300 },
      { main: 11, sub: 425 },
      { main: 13, sub: 600 },
      { main: 16, sub: 725 },
      { main: 18, sub: 850 },
    ],
    category: 'food',
    plusMinusPair: true,
    specification: (level) => {
      const effect = PlusSkill.skillDefinitions[0].effect[level];
      const result = foodHandlerSpecification(effect.main, 'plus');
      result.inputs.find((input) => input.key === 'subEffect')!.defaultValue = effect.sub;
      return result;
    },
  }),
];

export const skillDefinitions = PlusSkill.skillDefinitions;
