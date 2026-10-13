import { SkillDefinition } from './skill-definition';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import { specificationInput } from './specification-helpers';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

// ほっぺすりすりの追加発動は TeamSimulator が反復計算するため、ここでは評価しない。
function specification(evaluateEnergy: number): SkillSpecification {
  const configuredFormula =
    'スキルの基本評価 = スキル評価の設定値があればその値、なければこのスキルに登録された評価値\n最終評価 = スキルの基本評価 × 最終抽選の重み';
  return {
    inputs: [
      specificationInput(
        'configuredEnergy',
        '厳選・ボックス用の設定値',
        evaluateEnergy,
        'エナジー',
      ),
      specificationInput('weight', '最終抽選の重み', 1, '倍'),
    ],
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula: configuredFormula,
        description:
          '登録された評価値は、再発動の確率を用いてエナジーチャージM最大値から初期化されています。',
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula: configuredFormula,
        description: '厳選計算時と同じ分岐です。',
      },
      {
        id: PokemonSimulatorMode.TEAM,
        label: 'チーム計算時',
        formula:
          'スキルの基本評価 = 0\n追加発動の期待回数は、対象選択・再発動確率を使って最大10回反復し、対象スキル側へ加算します。',
        description: 'このハンドラはチーム計算の追加発動を直接評価しません。',
      },
    ],
    resultLabel: 'スキル評価',
    resultUnit: 'エナジー/回',
    calculate: (values, mode) =>
      mode === PokemonSimulatorMode.TEAM ? 0 : values.configuredEnergy * values.weight,
  };
}

export default class CheekRubSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate({ config, mode, skill, skillLv }: SkillEvaluationContext): SkillEvaluationResult {
    return {
      energyPerSkill:
        mode == PokemonSimulatorMode.TEAM
          ? 0
          : (config.selectEvaluate.skillEnergy[skill.name][skillLv] ??
            skill.evaluateEnergy![skillLv]),
    };
  }
}

CheekRubSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'ほっぺすりすり(げんきエールS)',
    effect: [9, 12, 16, 20, 27, 35].map((x) => ({ other: x / 5 })),
    team: true,
    genki: true,
    category: 'heal',
    specification: (level) =>
      specification(CheekRubSkill.skillDefinitions[0].evaluateEnergy?.[level] ?? 0),
  }),
];

export const skillDefinitions = CheekRubSkill.skillDefinitions;
