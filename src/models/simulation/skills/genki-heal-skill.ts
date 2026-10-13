import { SkillDefinition } from './skill-definition';
import { specificationInput, fixedSpecificationInput } from './specification-helpers';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

abstract class BaseHealSkill implements SkillHandler {
  evaluate(_context: SkillEvaluationContext): SkillEvaluationResult {
    return { energyPerSkill: 0 };
  }
}

function specification(effect: { self?: number; other?: number }): SkillSpecification {
  const formula =
    'スキル単体のエナジー評価 = 0\n自身への回復量 = 自身への回復量 × スキル抽選の重み\n他者への回復量 = 他者への回復量 × スキル抽選の重み';
  return {
    inputs: [
      fixedSpecificationInput('selfEffect', '自身への回復量', effect.self ?? 0, '%'),
      fixedSpecificationInput('otherEffect', '他者への回復量', effect.other ?? 0, '%'),
      specificationInput('weight', 'スキル抽選の重み', 1, '倍'),
    ],
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula: `${formula}\n他者への回復量があれば、昼夜のおてつだい倍率を求めて回復の評価へ換算する。`,
        description: '回復の評価はげんき時系列を計算する共通処理で求めます。',
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula: `${formula}\n編成確定後に回復効果をおてつだい倍率の計算へ渡す。`,
        description: 'スキル単体評価は0で、回復量を状態として保持します。',
      },
      {
        id: PokemonSimulatorMode.TEAM,
        label: 'チーム計算時',
        formula: `${formula}\n発動時刻を含む回復一覧を、おてつだい倍率の計算へ渡す。`,
        description: '回復量を時系列のげんき倍率として扱います。',
      },
    ],
    resultLabel: '状態へ記録する回復量',
    resultUnit: '%/回',
    calculate: (values) => (values.selfEffect + values.otherEffect) * values.weight,
  };
}

export class EnergyChargeHealSkill extends BaseHealSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'げんきチャージS',
      effect: [12.0, 16.2, 21.2, 26.6, 33.6, 43.4].map((x) => ({ self: x })),
      genki: true,
      selfHeal: true,
      category: 'heal',
      specification: (level) =>
        specification(EnergyChargeHealSkill.skillDefinitions[0].effect[level]),
    }),
  ];
}

export class MoonlightHealSkill extends BaseHealSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'つきのひかり(げんきチャージS)',
      effect: [
        { self: 12.0, other: 6.3 },
        { self: 16.2, other: 7.7 },
        { self: 21.2, other: 10.1 },
        { self: 26.6, other: 13.0 },
        { self: 33.6, other: 17.2 },
        { self: 43.4, other: 22.8 },
      ].map((x) => ({ self: x.self, other: (x.other * 0.5) / 5 })), // 大成功は50%、1匹だけなので/5
      genki: true,
      team: true,
      selfHeal: true,
      category: 'heal',
      specification: (level) => specification(MoonlightHealSkill.skillDefinitions[0].effect[level]),
    }),
  ];
}

export class EnergyCheerHealSkill extends BaseHealSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'げんきエールS',
      effect: [12, 15, 20, 25, 33, 44].map((x) => ({ other: x / 5 })),
      team: true,
      genki: true,
      category: 'heal',
      specification: (level) =>
        specification(EnergyCheerHealSkill.skillDefinitions[0].effect[level]),
    }),
  ];
}

export class EnergyAllHealSkill extends BaseHealSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'げんきオールS',
      effect: [5.0, 7.0, 9.0, 11.4, 15.0, 18.1].map((x) => ({ other: x })),
      team: true,
      genki: true,
      category: 'heal',
      specification: (level) => specification(EnergyAllHealSkill.skillDefinitions[0].effect[level]),
    }),
  ];
}

export class BerryJuiceHealSkill extends BaseHealSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'きのみジュース(げんきオールS)',
      effect: [5.0, 7.0, 9.0, 11.4, 15.0, 18.1].map((x) => ({ other: x })),
      team: true,
      genki: true,
      category: 'heal',
      specification: (level) =>
        specification(BerryJuiceHealSkill.skillDefinitions[0].effect[level]),
    }),
  ];
}

export const skillDefinitions = [
  ...EnergyChargeHealSkill.skillDefinitions,
  ...MoonlightHealSkill.skillDefinitions,
  ...EnergyCheerHealSkill.skillDefinitions,
  ...EnergyAllHealSkill.skillDefinitions,
  ...BerryJuiceHealSkill.skillDefinitions,
];
