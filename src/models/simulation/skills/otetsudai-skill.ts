import { SkillDefinition } from './skill-definition';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import { specificationInput, fixedSpecificationInput } from './specification-helpers';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

function helpSpecification(effect: any, isBoost: boolean): SkillSpecification {
  const fix = isBoost ? effect.fix : effect;
  const team = isBoost ? effect.team.at(-1) : effect;
  const max = isBoost ? effect.max : effect;
  return {
    inputs: [
      fixedSpecificationInput(
        'effect',
        isBoost ? '固定おてつだい数' : '追加おてつだい数',
        fix,
        '回',
      ),
      fixedSpecificationInput('teamEffect', 'チーム人数による追加数', team - fix, '回'),
      fixedSpecificationInput('maxEffect', '厳選用の最大おてつだい数', max, '回'),
      specificationInput('supportScore', 'サポート役の基準値', 100, 'エナジー'),
      specificationInput('berryEnergyPerHelp', '対象全員のきのみ評価/手伝い合計', 100, 'エナジー'),
      specificationInput('foodRate', '対象全員の食材確率の平均', 0, '（0〜1）'),
      specificationInput('weight', '最終抽選の重み', 1, '倍'),
    ],
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula: `スキルの基本評価 = サポート役の基準値 × ${isBoost ? '厳選用の最大おてつだい数 × 5' : '追加おてつだい数'}\n最終評価 = スキルの基本評価 × 最終抽選の重み`,
        description: 'おてつだいブーストは effect.max × 5、それ以外は effect を使用します。',
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula: 'スキルの基本評価 = 0\n最終評価 = 0',
        description: 'チームシミュレーション側の支援処理で扱います。',
      },
      {
        id: PokemonSimulatorMode.TEAM,
        label: 'チーム計算時',
        formula: `1匹あたりのおてつだい数 = ${isBoost ? '固定おてつだい数 + チーム人数による追加数' : '追加おてつだい数 ÷ 5'}\nきのみ評価(合計) = 対象全員のきのみ評価/手伝い合計 × 1匹あたりのおてつだい数 × (1 − 食材確率)`,
        description: 'きのみ評価と食材個数を別々に加算します。',
      },
    ],
    resultLabel: 'きのみ部分のスキル評価',
    resultUnit: 'エナジー/回',
    calculate: (values, mode) =>
      mode === PokemonSimulatorMode.SELECT
        ? values.supportScore * (isBoost ? values.maxEffect * 5 : values.effect) * values.weight
        : mode === PokemonSimulatorMode.ABOUT
          ? 0
          : values.berryEnergyPerHelp *
            (isBoost ? values.effect + values.teamEffect : values.effect / 5) *
            (1 - values.foodRate) *
            values.weight,
  };
}

abstract class BaseHelpSkill implements SkillHandler {
  protected abstract selectHelpCount(context: SkillEvaluationContext): number;
  protected abstract teamHelpCount(context: SkillEvaluationContext): number;

  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { effect, executor, helpBoostCount, mode, pokemonList, scoreForSupportEvaluate, weight } =
      context;
    let energyPerSkill = 0;
    if (mode == PokemonSimulatorMode.SELECT) {
      energyPerSkill = scoreForSupportEvaluate! * this.selectHelpCount(context);
    } else if (mode == PokemonSimulatorMode.TEAM) {
      const helpCount = this.teamHelpCount(context);
      for (const subPokemon of pokemonList!) {
        energyPerSkill += subPokemon.bEpH4Spt * helpCount * (1 - subPokemon.foodRate);
        for (const food of subPokemon.foodList) {
          executor[food.name] =
            (executor[food.name] ?? 0) +
            (food.baseNum / subPokemon.foodList.length) *
              helpCount *
              subPokemon.foodRate *
              executor.skillPerDay *
              weight;
        }
      }
    }
    return { energyPerSkill };
  }
}

export class HelpSupportSkill extends BaseHelpSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'おてつだいサポートS',
      effect: [6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0],
      team: true,
      category: 'support',
    }),
  ];

  protected selectHelpCount({ effect }: SkillEvaluationContext): number {
    return effect;
  }

  protected teamHelpCount({ effect }: SkillEvaluationContext): number {
    return effect / 5;
  }
}

export class HelpBoostSkill extends BaseHelpSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'おてつだいブースト',
      effect: [
        { fix: 2, team: [0, 0, 1, 2, 4], max: 6 },
        { fix: 3, team: [0, 0, 1, 2, 4], max: 7 },
        { fix: 3, team: [0, 0, 2, 3, 5], max: 8 },
        { fix: 4, team: [0, 0, 2, 3, 5], max: 9 },
        { fix: 4, team: [0, 1, 3, 4, 6], max: 10 },
        { fix: 5, team: [0, 1, 3, 4, 6], max: 11 },
      ],
      team: true,
      category: 'support',
    }),
  ];
  protected selectHelpCount({ effect }: SkillEvaluationContext): number {
    return effect.max * 5;
  }

  protected teamHelpCount({ effect, helpBoostCount }: SkillEvaluationContext): number {
    return effect.fix + effect.team[helpBoostCount! - 1];
  }
}

export const skillDefinitions = [
  ...HelpSupportSkill.skillDefinitions,
  ...HelpBoostSkill.skillDefinitions,
];

for (const definition of HelpSupportSkill.skillDefinitions) {
  definition.specification = (level) => helpSpecification(definition.effect[level], false);
}
for (const definition of HelpBoostSkill.skillDefinitions) {
  definition.specification = (level) => helpSpecification(definition.effect[level], true);
}
