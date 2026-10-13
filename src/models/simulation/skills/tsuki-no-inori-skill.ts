import { SkillDefinition } from './skill-definition';
import Berry from '../../../data/berry';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';
import { teamBerrySpecification } from './team-berry-specification';

export default class MoonPrayerSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { config, effect, executor, helpBoostCount, mode, pokemonList } = context;
    let energyPerSkill = 0;
    if (mode == PokemonSimulatorMode.SELECT) {
      const { self, other } = effect.team[helpBoostCount! - 1];
      energyPerSkill =
        executor.berryEnergy * self +
        Math.max(
          Berry.map['マゴ'].energy + executor.lv - 1,
          Berry.map['マゴ'].energy * 1.025 ** (executor.lv - 1),
        ) *
          other *
          4;
    } else if (mode == PokemonSimulatorMode.ABOUT) {
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

MoonPrayerSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'みかづきのいのり(げんきオールS)',
    effect: [
      {
        team: [
          { self: 5, other: 1 },
          { self: 7, other: 1 },
          { self: 9, other: 1 },
          { self: 12, other: 1 },
          { self: 14, other: 2 },
        ],
        other: 3.0,
      },
      {
        team: [
          { self: 9, other: 1 },
          { self: 12, other: 1 },
          { self: 15, other: 1 },
          { self: 16, other: 2 },
          { self: 19, other: 3 },
        ],
        other: 4.0,
      },
      {
        team: [
          { self: 13, other: 1 },
          { self: 17, other: 1 },
          { self: 18, other: 2 },
          { self: 20, other: 3 },
          { self: 24, other: 4 },
        ],
        other: 5.0,
      },
      {
        team: [
          { self: 17, other: 1 },
          { self: 19, other: 2 },
          { self: 25, other: 2 },
          { self: 28, other: 3 },
          { self: 29, other: 5 },
        ],
        other: 7.0,
      },
      {
        team: [
          { self: 21, other: 1 },
          { self: 24, other: 2 },
          { self: 27, other: 3 },
          { self: 28, other: 5 },
          { self: 30, other: 7 },
        ],
        other: 9.0,
      },
      {
        team: [
          { self: 25, other: 1 },
          { self: 29, other: 2 },
          { self: 30, other: 4 },
          { self: 31, other: 6 },
          { self: 32, other: 9 },
        ],
        other: 11.0,
      },
    ],
    team: true,
    genki: true,
    category: 'heal',
  }),
];

export const skillDefinitions = MoonPrayerSkill.skillDefinitions;

for (const definition of skillDefinitions) {
  definition.specification = (level) =>
    teamBerrySpecification(
      definition,
      definition.effect[level] as { team: { self: number; other: number }[]; bonus?: number },
      'moon',
    );
}
