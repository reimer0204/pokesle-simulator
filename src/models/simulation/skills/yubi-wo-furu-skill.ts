import { SkillDefinition } from './skill-definition';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import type { SkillSpecification } from './skill-specification-types';

function specification(): SkillSpecification {
  return {
    inputs: [
      {
        key: 'targetEnergy',
        label: '抽選先スキルの評価',
        defaultValue: 0,
        step: 0.1,
        unit: 'エナジー',
      },
      { key: 'targetWeight', label: '抽選先の重み', defaultValue: 1, step: 0.1, unit: '倍' },
    ],
    modes: [PokemonSimulatorMode.SELECT, PokemonSimulatorMode.ABOUT, PokemonSimulatorMode.TEAM].map(
      (id) => ({
        id,
        label:
          id === PokemonSimulatorMode.SELECT
            ? '厳選計算時'
            : id === PokemonSimulatorMode.ABOUT
              ? 'ボックス計算時'
              : 'チーム計算時',
        formula:
          '抽選対象は、ゆびをふるで発動できるスキルの一覧とする。\n各抽選先の重み = 1 ÷ 抽選対象スキル数\n各抽選先のスキル効果と共通後処理をそのまま計算する。\n期待評価 = Σ(抽選先スキルの評価 × 抽選先の重み)',
        description: '抽選先の評価を均等な重みで合算します。',
      }),
    ),
    resultLabel: '抽選先1件の寄与',
    resultUnit: 'エナジー/回',
    calculate: (values) => values.targetEnergy * values.targetWeight,
  };
}

export default class MetronomeSkill {
  static skillDefinitions: SkillDefinition[];
}

MetronomeSkill.skillDefinitions = [
  new SkillDefinition({
    category: 'etc',
    name: 'ゆびをふる',
    effect: [null, null, null, null, null, null, null],
    team: true,
    isMetronomeSkill: true,
    specification: () => specification(),
  }),
];

export const skillDefinitions = MetronomeSkill.skillDefinitions;
