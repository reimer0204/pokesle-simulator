import { SkillDefinition } from './skill-definition';
import { Food } from '../../../data/food_and_cooking';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import { foodHandlerSpecification } from './food-specification';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class PresentSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate({ config, effect, mode }: SkillEvaluationContext): SkillEvaluationResult {
    return {
      energyPerSkill:
        mode == PokemonSimulatorMode.SELECT ? config.selectEvaluate.energyPerCandy * 4 : 0,
      foodGet: effect,
      foodGetList: Food.list,
    };
  }
}

PresentSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'プレゼント(食材ゲットS)',
    effect: [4.0, 6.0, 8.0, 10.0, 12.0, 15.0, 17.0],
    category: 'food',
    specification: (level) =>
      foodHandlerSpecification(PresentSkill.skillDefinitions[0].effect[level], 'present'),
  }),
];

export const skillDefinitions = PresentSkill.skillDefinitions;
