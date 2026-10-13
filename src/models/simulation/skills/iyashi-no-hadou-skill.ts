import { SkillDefinition } from './skill-definition';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import { specificationInput, fixedSpecificationInput } from './specification-helpers';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

function specification(effect: { help1: number; help2: number }): SkillSpecification {
  return {
    inputs: [
      specificationInput('supportScore', 'サポート役の基準値', 100, 'エナジー'),
      fixedSpecificationInput('help1', 'ラティオス不在時の追加おてつだい数', effect.help1, '回'),
      fixedSpecificationInput('help2', 'ラティオス編成時の追加おてつだい数', effect.help2, '回'),
      specificationInput('berryEnergyPerHelp', '対象全員のきのみ評価/手伝い合計', 100, 'エナジー'),
      specificationInput('foodRate', '対象全員の食材確率の平均', 0, '（0〜1）'),
      specificationInput('latiosInTeam', 'ラティオス編成時', 0, '（1: はい）'),
      specificationInput('weight', '最終抽選の重み', 1, '倍'),
    ],
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula:
          'スキルの基本評価 = サポート役の基準値 × help2 × 2\n最終評価 = スキルの基本評価 × 最終抽選の重み',
        description: 'このモードでは常に help2 を使用します。',
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula: 'スキルの基本評価 = 0\n最終評価 = 0',
        description: 'このモードでは直接評価せず、チーム計算で扱います。',
      },
      {
        id: PokemonSimulatorMode.TEAM,
        label: 'チーム計算時',
        formula:
          'helpCount = (ラティオス編成時なら help2、それ以外はhelp1) × 2 ÷ 5\nきのみ評価(合計) = 対象全員の bEpH × helpCount × (1 − foodRate) を合算',
        description: '食材個数は各対象へ別途加算します。',
      },
    ],
    resultLabel: 'きのみ部分のスキル評価',
    resultUnit: 'エナジー/回',
    calculate: (values, mode) =>
      mode === PokemonSimulatorMode.SELECT
        ? values.supportScore * values.help2 * 2 * values.weight
        : mode === PokemonSimulatorMode.ABOUT
          ? 0
          : values.berryEnergyPerHelp *
            (((values.latiosInTeam ? values.help2 : values.help1) * 2) / 5) *
            (1 - values.foodRate) *
            values.weight,
  };
}

export default class HealingWaveSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { effect, executor, mode, pokemonList, scoreForSupportEvaluate, weight } = context;
    let energyPerSkill = 0;
    if (mode == PokemonSimulatorMode.SELECT) {
      energyPerSkill = scoreForSupportEvaluate! * effect.help2 * 2;
    } else if (mode == PokemonSimulatorMode.TEAM) {
      let helpCount = pokemonList!.some((x) => x.base.name == 'ラティオス')
        ? effect.help2
        : effect.help1;
      helpCount = (helpCount * 2) / 5;
      for (const subPokemon of pokemonList!) {
        energyPerSkill += subPokemon.bEpH * helpCount * (1 - subPokemon.foodRate);
        for (const food of subPokemon.foodList) {
          executor[food.name] =
            (executor[food.name] ?? 0) +
            (food.num / subPokemon.foodList.length) *
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

HealingWaveSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'いやしのはどう(げんきエールS)',
    effect: [
      { other: 6, help1: 1, help2: 2 },
      { other: 8, help1: 2, help2: 3 },
      { other: 10, help1: 2, help2: 4 },
      { other: 13, help1: 3, help2: 5 },
      { other: 17, help1: 4, help2: 6 },
      { other: 22, help1: 4, help2: 7 },
    ].map((x) => ({ ...x, other: (x.other * 2) / 5 })),
    team: true,
    genki: true,
    category: 'heal',
    specification: (level) => specification(HealingWaveSkill.skillDefinitions[0].effect[level]),
  }),
];

export const skillDefinitions = HealingWaveSkill.skillDefinitions;
