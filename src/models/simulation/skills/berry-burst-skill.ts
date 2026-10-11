import Berry from '../../../data/berry';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

const MODE_ABOUT = 1;
const MODE_TEAM = 2;

export default class BerryBurstSkill implements SkillHandler {
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { config, copy, effect, executor, mode, pokemonList, skill, weight } = context;
    let energyPerSkill = 0;

    if (mode == MODE_ABOUT) {
      energyPerSkill =
        executor.berryEnergy * effect.self * config.simulation.eventBonus.skill.berryBurst;
      executor.burstBonus = effect.other * weight * config.simulation.eventBonus.skill.berryBurst;
    } else if (mode == MODE_TEAM) {
      for (const subPokemon of pokemonList!) {
        energyPerSkill +=
          executor.berryEnergy *
          (executor == subPokemon ? effect.self : effect.other) *
          config.simulation.eventBonus.skill.berryBurst;
      }
    } else {
      energyPerSkill =
        executor.berryEnergy * effect.self +
        Math.max(
          Berry.map['ヤチェ'].energy + executor.lv - 1,
          Berry.map['ヤチェ'].energy * 1.025 ** (executor.lv - 1),
        ) *
          effect.other *
          4;
    }

    if (
      skill.name == 'ばけのかわ(きのみバースト)' &&
      !copy &&
      executor.base.skill.name !== 'ゆびをふる'
    ) {
      const success = 1 - (1 - skill.success) ** executor.skillPerDay;
      energyPerSkill *=
        (success * (executor.skillPerDay + 2) + (1 - success) * executor.skillPerDay) /
        executor.skillPerDay;
    }
    return { energyPerSkill };
  }
}
