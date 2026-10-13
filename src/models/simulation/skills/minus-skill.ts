import { SkillDefinition } from './skill-definition';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import { specificationInput, fixedSpecificationInput } from './specification-helpers';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

function specification(effect: { main: number }): SkillSpecification {
  return {
    inputs: [
      fixedSpecificationInput('effect', '鍋拡張量', effect.main, '個'),
      specificationInput('skillPerDay', '1日の発動回数', 8, '回'),
      specificationInput('weight', '最終抽選の重み', 1, '倍'),
    ],
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula:
          'スキルの基本評価 = 0、鍋の拡張量 = 鍋拡張量\nプラスまたはマイナスが2匹以上いる場合、他のポケモンへの回復量も共通処理へ渡す。',
        description:
          '料理パワーアップSと同じ鍋拡張処理を行い、ペア条件を満たす場合は回復効果も加えます。',
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula: '拡張前後の最適料理の最終エナジー差を加算',
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

export default class MinusSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: 0, cookingPowerUpEffect: effect.main };
  }
}

MinusSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'マイナス(料理パワーアップS)',
    effect: [
      { main: 5, other: 8 / 5 },
      { main: 7, other: 10 / 5 },
      { main: 9, other: 13 / 5 },
      { main: 12, other: 17 / 5 },
      { main: 16, other: 23 / 5 },
      { main: 20, other: 30 / 5 },
      { main: 24, other: 35 / 5 },
    ],
    team: true,
    plusMinusPair: true,
    genki: true,
    category: 'cooking',
    specification: (level) => specification(MinusSkill.skillDefinitions[0].effect[level]),
  }),
];

export const skillDefinitions = MinusSkill.skillDefinitions;
