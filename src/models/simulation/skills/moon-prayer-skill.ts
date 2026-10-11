import Berry from '../../../data/berry';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class MoonPrayerSkill implements SkillHandler {
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { config, effect, executor, helpBoostCount, mode, pokemonList } = context;
    let energyPerSkill = 0;
    if (mode == 3) {
      const { self, other } = effect.team[helpBoostCount! - 1];
      energyPerSkill =
        executor.berryEnergy * self +
        Math.max(
          Berry.map['マゴ'].energy + executor.lv - 1,
          Berry.map['マゴ'].energy * 1.025 ** (executor.lv - 1),
        ) *
          other *
          4;
    } else if (mode == 1) {
      const { self, other } = effect.team.at(-1);
      energyPerSkill = executor.berryEnergy * self * config.simulation.eventBonus.skill.berryBurst;
      executor.burstBonus = other * config.simulation.eventBonus.skill.berryBurst;
    } else {
      const { self, other } = effect.team[helpBoostCount! - 1];
      for (const subPokemon of pokemonList!)
        energyPerSkill += executor.berryEnergy * (executor == subPokemon ? self : other);
      energyPerSkill *= config.simulation.eventBonus.skill.berryBurst;
    }
    return { energyPerSkill };
  }
}
