import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class HelpSkill implements SkillHandler {
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const {
      effect,
      executor,
      helpBoostCount,
      mode,
      pokemonList,
      scoreForSupportEvaluate,
      skill,
      weight,
    } = context;
    let energyPerSkill = 0;
    if (mode == 3) {
      energyPerSkill =
        scoreForSupportEvaluate! * (skill.name == 'おてつだいブースト' ? effect.max * 5 : effect);
    } else if (mode == 2) {
      const helpCount =
        skill.name == 'おてつだいサポートS'
          ? effect / 5
          : effect.fix + effect.team[helpBoostCount! - 1];
      for (const subPokemon of pokemonList!) {
        energyPerSkill += subPokemon.bEpH4Spt * helpCount * (1 - subPokemon.foodRate);
        for (const food of subPokemon.foodList) {
          executor[food.name] =
            (executor[food.name] ?? 0) +
            (food.baseNum / subPokemon.foodList.length) *
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
