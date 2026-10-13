import { SkillDefinition } from './skill-definition';
import Pokemon from '../../../data/pokemon';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import { specificationInput, fixedSpecificationInput } from './specification-helpers';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

function specification(effect: { energy: number; zone: number }): SkillSpecification {
  const baseInputs = [
    fixedSpecificationInput('effect', '固定エナジー', effect.energy, 'エナジー'),
    specificationInput('berryEnergy', 'きのみの基礎エナジー', 100, 'エナジー'),
    specificationInput('berryRate', 'きのみ評価倍率', 100, '%'),
    specificationInput('level', '実行者のレベル', 1, 'Lv'),
    specificationInput('top5Help', '上位5匹のおてつだい回数合計', 100, '回'),
    fixedSpecificationInput('zoneRate', 'きのみゾーン倍率', effect.zone, '倍'),
    specificationInput('dayRate', '日付補正', 1, '倍'),
    specificationInput('weight', '最終抽選の重み', 1, '倍'),
  ];
  const boxFormula =
    '日付補正 = day が0以上なら (6 − day) ÷ 2、それ以外は1.5\nスキルの基本評価 = ((きのみ基礎エナジー × きのみ評価倍率 ÷ 100 × 1.025^(レベル − 1) × 上位5匹のおてつだい回数合計 × 日付補正 × きのみゾーン倍率) ÷ 100) + 固定エナジー\n最終評価 = スキルの基本評価 × 最終抽選の重み';
  return {
    inputs: baseInputs,
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula:
          'スキルの基本評価 = ((きのみ基礎エナジー × 2 × 1.025^(レベル − 1) × 上位5匹のおてつだい回数合計 × 21 ÷ 7) × きのみゾーン倍率 ÷ 100) + 固定エナジー\n最終評価 = スキルの基本評価 × 最終抽選の重み',
        description:
          '同じきのみを持つ全ポケモンから、計算したおてつだい回数が上位の5匹を選びます。',
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula: boxFormula,
        description: 'ボックス内から同じきのみを持つ上位5匹を選びます。',
      },
      {
        id: PokemonSimulatorMode.TEAM,
        label: 'チーム計算時',
        formula: boxFormula,
        description: 'ボックス内から同じきのみを持つ上位5匹を選びます。',
      },
    ],
    resultLabel: 'きのみゾーン評価',
    resultUnit: 'エナジー/回',
    calculate: (values, mode) => {
      const berryRate = mode === PokemonSimulatorMode.SELECT ? 2 : values.berryRate / 100;
      const dayRate = mode === PokemonSimulatorMode.SELECT ? 3 : values.dayRate;
      return (
        (values.effect +
          (values.berryEnergy *
            berryRate *
            1.025 ** (values.level - 1) *
            values.top5Help *
            dayRate *
            values.zoneRate) /
            100) *
        values.weight
      );
    },
  };
}

export default class PsychoBreakSkill implements SkillHandler {
  static skillDefinitions: SkillDefinition[];
  evaluate({
    boxPokemonList,
    config,
    effect,
    executor,
    mode,
  }: SkillEvaluationContext): SkillEvaluationResult {
    if (mode == PokemonSimulatorMode.SELECT) {
      const top5 = Pokemon.list
        .filter((x) => x.berry.name == executor.base.berry.name)
        .map(
          (x) =>
            ((x.specialty == 'きのみ' || x.specialty == 'オール' ? 3 : 2) * 86400) /
            (x.help * 0.65 * (1 - (executor.lv - 1) * 0.002)) /
            0.45,
        )
        .sort((a, b) => b - a)
        .slice(0, 5)
        .reduce((sum, num) => sum + num, 0);
      return {
        energyPerSkill:
          (((executor.base.berry.energy * 2 * 1.025 ** (executor.lv - 1) * top5 * 21) / 7) *
            effect.zone) /
            100 +
          effect.energy,
      };
    }
    const dayRate = config.teamSimulation.day >= 0 ? (6 - config.teamSimulation.day) / 2 : 1.5;
    const top5 = boxPokemonList
      .filter((x) => Pokemon.map[x.name]?.berry.name == executor.base.berry.name)
      .map(
        (x) =>
          ((Pokemon.map[x.name]?.specialty == 'きのみ' || Pokemon.map[x.name]?.specialty == 'オール'
            ? 3
            : 2) *
            86400) /
          (Pokemon.map[x.name].help * 0.65 * (1 - (x.lv - 1) * 0.002)) /
          0.45,
      )
      .sort((a, b) => b - a)
      .slice(0, 5)
      .reduce((sum, num) => sum + num, 0);
    return {
      energyPerSkill:
        (((executor.base.berry.energy * executor.berryRate) / 100) *
          1.025 ** (executor.lv - 1) *
          top5 *
          dayRate *
          effect.zone) /
          100 +
        effect.energy,
    };
  }
}

PsychoBreakSkill.skillDefinitions = [
  new SkillDefinition({
    name: 'サイコブレイク(きのみゾーン)',
    effect: [
      { energy: 1408, zone: 0.6 },
      { energy: 2002, zone: 0.8 },
      { energy: 2762, zone: 1.0 },
      { energy: 3813, zone: 1.2 },
      { energy: 5264, zone: 1.6 },
      { energy: 7274, zone: 2.0 },
    ],
    metronome: false,
    copyable: false,
    category: 'energy',
    specification: (level) => specification(PsychoBreakSkill.skillDefinitions[0].effect[level]),
  }),
];

export const skillDefinitions = PsychoBreakSkill.skillDefinitions;
