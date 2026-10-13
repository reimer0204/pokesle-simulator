import { SkillDefinition } from './skill-definition';
import { Food } from '../../../data/food_and_cooking';
import { foodHandlerSpecification } from './food-specification';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

export default class BuildUpSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return {
      energyPerSkill: 0,
      foodGet: effect.main,
      foodGetList: Food.list,
      cookingChance: effect.sub,
    };
  }
}

BuildUpSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'ビルドアップ(料理アシストS)',
    effect: [
      { main: 6, sub: 1 },
      { main: 8, sub: 2 },
      { main: 11, sub: 2 },
      { main: 14, sub: 3 },
      { main: 17, sub: 3 },
      { main: 21, sub: 4 },
      { main: 24, sub: 5 },
    ],
    category: 'food',
    specification: (level) => {
      const effect = BuildUpSkill.skillDefinitions[0].effect[level];
      const result = foodHandlerSpecification(effect.main, 'buildUp');
      result.modes = result.modes.map((mode) => ({
        ...mode,
        formula: `${mode.formula}\n料理チャンス効果量 = ${effect.sub}%。料理チャンスの共通後処理も実行する。`,
      }));
      return result;
    },
  }),
];

export const skillDefinitions = BuildUpSkill.skillDefinitions;
