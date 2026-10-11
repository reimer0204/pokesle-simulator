import Pokemon from '../../../data/pokemon';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class PsychoBreakSkill implements SkillHandler {
  evaluate({
    boxPokemonList,
    config,
    effect,
    executor,
    mode,
  }: SkillEvaluationContext): SkillEvaluationResult {
    if (mode == 3) {
      const top5 = Pokemon.list
        .filter((x) => x.berry.name == executor.base.berry.name)
        .map(
          (x) =>
            ((x.specialty == 'きのみ' || x.specialty == 'オール' ? 3 : 2) * 86400) /
            (x.help * 0.65 * (1 - (executor.lv - 1) * 0.002)) /
            0.45,
        )
        .sort((a, b) => b - a)
        .slice(0, 5)
        .reduce((sum, num) => sum + num, 0);
      return {
        energyPerSkill:
          (((executor.base.berry.energy * 2 * 1.025 ** (executor.lv - 1) * top5 * 21) / 7) *
            effect.zone) /
            100 +
          effect.energy,
      };
    }
    const dayRate = config.teamSimulation.day >= 0 ? (6 - config.teamSimulation.day) / 2 : 1.5;
    const top5 = boxPokemonList
      .filter((x) => Pokemon.map[x.name]?.berry.name == executor.base.berry.name)
      .map(
        (x) =>
          ((Pokemon.map[x.name]?.specialty == 'きのみ' || Pokemon.map[x.name]?.specialty == 'オール'
            ? 3
            : 2) *
            86400) /
          (Pokemon.map[x.name].help * 0.65 * (1 - (x.lv - 1) * 0.002)) /
          0.45,
      )
      .sort((a, b) => b - a)
      .slice(0, 5)
      .reduce((sum, num) => sum + num, 0);
    return {
      energyPerSkill:
        (((executor.base.berry.energy * executor.berryRate) / 100) *
          1.025 ** (executor.lv - 1) *
          top5 *
          dayRate *
          effect.zone) /
          100 +
        effect.energy,
    };
  }
}
