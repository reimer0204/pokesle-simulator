import { SkillDefinition } from './skill-definition';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import { specificationInput, fixedSpecificationInput } from './specification-helpers';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

function specification(effect: number): SkillSpecification {
  return {
    inputs: [
      fixedSpecificationInput('effect', '鍋拡張量', effect, '個'),
      specificationInput('skillPerDay', '1日の発動回数', 8, '回'),
      specificationInput('weight', '最終抽選の重み', 1, '倍'),
    ],
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula:
          'スキルの基本評価 = 0、鍋の拡張量 = 鍋拡張量\n鍋拡張回数を3回の料理へ分配し、料理エナジー差から1発動あたりへ戻す',
        description: '最大鍋に意味がある枠と余剰枠を分けて計算します。',
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula:
          'スキルの基本評価 = 0、鍋の拡張量 = 鍋拡張量\n拡張前後の最適料理の最終エナジー差を加算',
        description: '鍋サイズの差を料理エナジーへ換算します。',
      },
      {
        id: PokemonSimulatorMode.TEAM,
        label: 'チーム計算時',
        formula: '鍋の拡張量を蓄積し、各料理時刻で鍋サイズへ加算する。',
        description: 'スキル単体のエナジーは返しません。',
      },
    ],
    resultLabel: '鍋拡張の評価',
    resultUnit: 'エナジー/回',
    calculate: () => 0,
  };
}

export default class CookingPowerUpSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: 0, cookingPowerUpEffect: effect };
  }
}

CookingPowerUpSkill.skillDefinitions = [
  new SkillDefinition({
    name: '料理パワーアップS',
    effect: [7.0, 10.0, 12.0, 17.0, 22.0, 27.0, 31.0],
    category: 'cooking',
    specification: (level) => specification(CookingPowerUpSkill.skillDefinitions[0].effect[level]),
  }),
];

export const skillDefinitions = CookingPowerUpSkill.skillDefinitions;
