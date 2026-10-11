import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class HealingWaveSkill implements SkillHandler {
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { effect, executor, mode, pokemonList, scoreForSupportEvaluate, weight } = context;
    let energyPerSkill = 0;
    if (mode == 3) {
      energyPerSkill = scoreForSupportEvaluate! * effect.help2 * 2;
    } else if (mode == 2) {
      let helpCount = pokemonList!.some((x) => x.base.name == 'ラティオス')
        ? effect.help2
        : effect.help1;
      helpCount = (helpCount * 2) / 5;
      for (const subPokemon of pokemonList!) {
        energyPerSkill += subPokemon.bEpH * helpCount * (1 - subPokemon.foodRate);
        for (const food of subPokemon.foodList) {
          executor[food.name] =
            (executor[food.name] ?? 0) +
            (food.num / subPokemon.foodList.length) *
              helpCount *
              subPokemon.foodRate *
              executor.skillPerDay *
              weight;
        }
      }
    }
    return { energyPerSkill };
  }
}
