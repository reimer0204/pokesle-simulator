import Berry from '../../../data/berry';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class MeteorShowerSkill implements SkillHandler {
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { config, effect, executor, helpBoostCount, mode, pokemonList } = context;
    let energyPerSkill = 0;
    if (mode == 3) {
      const { self, other } = effect.team[helpBoostCount! - 1];
      energyPerSkill =
        executor.berryEnergy * (self + effect.bonus) +
        Math.max(
          Berry.map['ヤチェ'].energy + executor.lv - 1,
          Berry.map['ヤチェ'].energy * 1.025 ** (executor.lv - 1),
        ) *
          other *
          4;
    } else if (mode == 1) {
      const { self, other } = effect.team.at(-1);
      energyPerSkill =
        executor.berryEnergy *
        (self + effect.bonus) *
        config.simulation.eventBonus.skill.berryBurst;
      executor.burstBonus = other * config.simulation.eventBonus.skill.berryBurst;
    } else {
      const { self, other } = effect.team[helpBoostCount! - 1];
      const withLatias = pokemonList!.some((x) => x.base.name == 'ラティアス');
      for (const subPokemon of pokemonList!) {
        energyPerSkill +=
          executor.berryEnergy *
          (executor == subPokemon ? (withLatias ? self : self + effect.bonus) : other);
      }
      energyPerSkill *= config.simulation.eventBonus.skill.berryBurst;
    }
    return { energyPerSkill };
  }
}
