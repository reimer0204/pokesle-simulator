import { SkillDefinition } from './skill-definition';
import { Cooking } from '../../../data/food_and_cooking';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import { specificationInput, fixedSpecificationInput } from './specification-helpers';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

const weekEffectFormula =
  '週の料理回数 = 21回（平日18回、日曜3回）\n週効果量が0の場合、週の料理期待値 = 18 × (1 + 0.1) + 3 × (1 + 0.3 × 2) = 24.6\n週効果量が0より大きい場合、1回あたりの上昇量 p = min(週効果量 ÷ 21, 0.7)\nr₀ = 1\ni回目（i = 1 … 21）の基礎成功率 qᵢ = i ≤ 18 なら0.1、それ以外は0.3\ni回目の成功時の追加倍率 bᵢ = i ≤ 18 なら1、それ以外は2\nrᵢ = Σ[j = 1 … i] {(qᵢ + min(p × j, 0.7)) × rᵢ₋ⱼ × Π[k = i − j + 1 … i − 1] (1 − rₖ)}\n週の料理期待値 = Σ[i = 1 … 21] (1 + bᵢ × rᵢ)\n（空の積 Π は1とする）';
const defaultCookingEnergyFormula =
  '使用する料理エナジーの既定値 = max(全料理の基礎エナジー) × 最大レシピLvボーナス';

function specification(effect: number): SkillSpecification {
  return {
    inputs: [
      fixedSpecificationInput('effect', '料理チャンス効果量', effect, '%'),
      specificationInput('skillPerDay', '1日の発動回数', 8, '回'),
      specificationInput('weight', '最終抽選の重み', 1, '倍'),
      specificationInput('cookingEnergy', '使用する料理エナジー', Cooking.maxEnergy, 'エナジー'),
      specificationInput('cookingWeight', '料理評価倍率', 1, '倍'),
    ],
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula: `${defaultCookingEnergyFormula}\n週効果量 = 効果量 ÷ 100 × 1日の発動回数 × 最終抽選の重み × 7\n${weekEffectFormula}\nハンドラ加算値 = (週の料理期待値 − 24.6) ÷ 7 × 使用する料理エナジー ÷ 1日の発動回数 ÷ 最終抽選の重み\n最終評価 = ハンドラ加算値 × 最終抽選の重み`,
        description: '週の料理期待値の通常時からの増分を、1日・1発動あたりへ換算します。',
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula: `${defaultCookingEnergyFormula}\n週効果量 = 効果量 ÷ 100 × 1日の発動回数 × 最終抽選の重み × 7\n${weekEffectFormula}\nハンドラ加算値 = (週の料理期待値 − 24.6) ÷ 7 × 使用する料理エナジー ÷ 1日の発動回数 × 料理評価倍率 ÷ 最終抽選の重み\n最終評価 = ハンドラ加算値 × 最終抽選の重み`,
        description: '日曜準備時は概算評価を行いません。',
      },
      {
        id: PokemonSimulatorMode.TEAM,
        label: 'チーム計算時',
        formula: '料理チャンスの蓄積値 = 効果量 ÷ 100 × 1日の発動回数 × 最終抽選の重み',
        description: '料理処理用の状態を蓄積し、スキル単体の評価は0です。',
      },
    ],
    resultLabel: '料理チャンスの評価',
    resultUnit: 'エナジー/回',
    calculate: (values, mode) => {
      if (mode === PokemonSimulatorMode.TEAM) return 0;
      if (mode === PokemonSimulatorMode.ABOUT && !values.skillPerDay) return 0;

      const totalEffect = (values.effect / 100) * values.skillPerDay * values.weight * 7;
      const weeklyIncrease = (Cooking.getChanceWeekEffect(totalEffect).total - 24.6) / 7;
      return (
        (weeklyIncrease *
          values.cookingEnergy *
          (mode === PokemonSimulatorMode.ABOUT ? values.cookingWeight : 1)) /
        values.skillPerDay
      );
    },
  };
}

export default class CookingChanceSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate({ effect }: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: 0, cookingChance: effect };
  }
}

CookingChanceSkill.skillDefinitions = [
  new SkillDefinition({
    name: '料理チャンスS',
    effect: [4.0, 5.0, 6.0, 7.0, 8.0, 10.0],
    category: 'cooking',
    specification: (level) => specification(CookingChanceSkill.skillDefinitions[0].effect[level]),
  }),
];

export const skillDefinitions = CookingChanceSkill.skillDefinitions;
