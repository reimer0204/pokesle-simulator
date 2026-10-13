import { SkillDefinition } from './skill-definition';
import Berry from '../../../data/berry';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';
import { teamBerrySpecification } from './team-berry-specification';

export default class MeteorShowerSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { config, effect, executor, helpBoostCount, mode, pokemonList } = context;
    let energyPerSkill = 0;
    if (mode == PokemonSimulatorMode.SELECT) {
      const { self, other } = effect.team[helpBoostCount! - 1];
      energyPerSkill =
        executor.berryEnergy * (self + effect.bonus) +
        Math.max(
          Berry.map['ヤチェ'].energy + executor.lv - 1,
          Berry.map['ヤチェ'].energy * 1.025 ** (executor.lv - 1),
        ) *
          other *
          4;
    } else if (mode == PokemonSimulatorMode.ABOUT) {
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

MeteorShowerSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'りゅうせいぐん(きのみバースト)',
    effect: [
      {
        team: [
          { self: 12, other: 1 },
          { self: 14, other: 1 },
          { self: 18, other: 1 },
          { self: 18, other: 2 },
          { self: 20, other: 2 },
        ],
        bonus: 2,
      },
      {
        team: [
          { self: 21, other: 1 },
          { self: 24, other: 1 },
          { self: 29, other: 1 },
          { self: 30, other: 2 },
          { self: 33, other: 2 },
        ],
        bonus: 4,
      },
      {
        team: [
          { self: 29, other: 1 },
          { self: 29, other: 2 },
          { self: 35, other: 2 },
          { self: 37, other: 3 },
          { self: 41, other: 3 },
        ],
        bonus: 6,
      },
      {
        team: [
          { self: 38, other: 1 },
          { self: 39, other: 2 },
          { self: 42, other: 3 },
          { self: 45, other: 4 },
          { self: 49, other: 4 },
        ],
        bonus: 8,
      },
      {
        team: [
          { self: 43, other: 2 },
          { self: 44, other: 3 },
          { self: 48, other: 4 },
          { self: 49, other: 5 },
          { self: 53, other: 5 },
        ],
        bonus: 9,
      },
      {
        team: [
          { self: 48, other: 3 },
          { self: 50, other: 4 },
          { self: 55, other: 4 },
          { self: 55, other: 5 },
          { self: 58, other: 5 },
        ],
        bonus: 10,
      },
    ],
    team: true,
    category: 'energy',
  }),
];

export const skillDefinitions = MeteorShowerSkill.skillDefinitions;

for (const definition of skillDefinitions) {
  definition.specification = (level) =>
    teamBerrySpecification(
      definition,
      definition.effect[level] as { team: { self: number; other: number }[]; bonus?: number },
      'meteor',
    );
}
