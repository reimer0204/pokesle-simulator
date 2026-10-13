import { SkillDefinition } from './skill-definition';
import Berry from '../../../data/berry';
import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import {
  specificationInput,
  specificationSelectInput,
  fixedSpecificationInput,
} from './specification-helpers';
import type { SkillSpecification } from './skill-specification-types';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

function berryBurstSpecification(effect: { self: number; other: number }): SkillSpecification {
  const ruby = (value: number, unit: string, label: string) =>
    `<ruby>${value}${unit}<rt>${label}</rt></ruby>`;
  const yamacheEnergy = ruby(Berry.map['ヤチェ'].energy, 'エナジー', 'ヤチェのみの基礎エナジー');
  const selfBerryNum = ruby(effect.self, '個', '自身へのきのみ数');
  const otherBerryNum = ruby(effect.other, '個', '他者へのきのみ数');
  const otherCount = ruby(4, '匹', 'チーム内の他者数');
  const defaultExecutorBerry = Berry.list.findIndex((berry) => berry.name === 'ヤチェ');
  const defaultExecutorBerryEnergy = Math.max(
    Berry.list[defaultExecutorBerry].energy + 70 - 1,
    Berry.list[defaultExecutorBerry].energy * 1.025 ** (70 - 1),
  );

  return {
    effectList: [
      { label: '自身へのきのみ数', value: effect.self, unit: '個' },
      { label: '他者へのきのみ数', value: effect.other, unit: '個' },
    ],
    inputs: [
      specificationSelectInput(
        'executorBerryIndex',
        '実行者のきのみ',
        defaultExecutorBerry,
        Berry.list.map((berry, index) => ({ label: berry.name, value: index })),
      ),
      {
        ...specificationInput('level', '実行者のレベル', 70, 'Lv'),
        step: 1,
      },
      fixedSpecificationInput(
        'otherBerryBaseEnergy',
        'ヤチェのみの基礎エナジー',
        Berry.map['ヤチェ'].energy,
        'エナジー',
      ),
      fixedSpecificationInput('self', '自身へのきのみ数', effect.self, '個'),
      fixedSpecificationInput('other', '他者へのきのみ数', effect.other, '個'),
      {
        ...specificationInput(
          'otherBerryEnergySum',
          '他4匹のきのみエナジー合計',
          Math.round(defaultExecutorBerryEnergy * 4 * 1000) / 1000,
          'エナジー',
        ),
        step: 1,
        visibleModes: [PokemonSimulatorMode.TEAM],
      },
      {
        ...specificationInput('eventRate', 'きのみバーストイベント補正', 1, '倍'),
        visibleModes: [PokemonSimulatorMode.ABOUT, PokemonSimulatorMode.TEAM],
      },
      specificationInput('weight', '最終抽選の重み', 1, '倍'),
    ],
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula:
          '実行者のきのみエナジー = max(実行者のきのみの基礎エナジー + (実行者のレベル − 1), 実行者のきのみの基礎エナジー × 1.025^(実行者のレベル − 1))\n他者きのみエナジー = max(ヤチェのみの基礎エナジー + (実行者のレベル − 1), ヤチェのみの基礎エナジー × 1.025^(実行者のレベル − 1))\n評価 = 実行者のきのみエナジー × 自身へのきのみ数 + 他者きのみエナジー × 他者へのきのみ数 × チーム内の他者数\n最終評価 = 評価 × 最終抽選の重み',
        formulaHtml: `実行者のきのみエナジー = max(実行者のきのみの基礎エナジー + (実行者のレベル − 1), 実行者のきのみの基礎エナジー × 1.025^(実行者のレベル − 1))\n他者きのみエナジー = max(${yamacheEnergy} + (実行者のレベル − 1), ${yamacheEnergy} × 1.025^(実行者のレベル − 1))\n評価 = 実行者のきのみエナジー × ${selfBerryNum} + 他者きのみエナジー × ${otherBerryNum} × ${otherCount}\n最終評価 = 評価 × 最終抽選の重み`,
        description: '他者4匹はヤチェのみを基準に評価します。イベント補正は適用しません。',
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula:
          '実行者のきのみエナジー = max(実行者のきのみの基礎エナジー + (実行者のレベル − 1), 実行者のきのみの基礎エナジー × 1.025^(実行者のレベル − 1))\nスキルの基本評価 = 実行者のきのみエナジー × 自身へのきのみ数 × きのみバーストイベント補正\n他者への効果量 = 他者へのきのみ数 × きのみバーストイベント補正\n他者分の評価 = 実行者以外の上位4匹のきのみエナジー合計 × 他者への効果量 × 最終抽選の重み\n最終評価 = スキルの基本評価 × 最終抽選の重み + 他者分の評価',
        formulaHtml: `実行者のきのみエナジー = max(実行者のきのみの基礎エナジー + (実行者のレベル − 1), 実行者のきのみの基礎エナジー × 1.025^(実行者のレベル − 1))\nスキルの基本評価 = 実行者のきのみエナジー × ${selfBerryNum} × きのみバーストイベント補正\n他者への効果量 = ${otherBerryNum} × きのみバーストイベント補正\n他者分の評価 = 実行者以外の上位4匹のきのみエナジー合計 × 他者への効果量 × 最終抽選の重み\n最終評価 = スキルの基本評価 × 最終抽選の重み + 他者分の評価`,
        description: '他者分は、他のポケモンへの効果として別途保持します。',
      },
      {
        id: PokemonSimulatorMode.TEAM,
        label: 'チーム計算時',
        formula:
          '実行者のきのみエナジー = max(実行者のきのみの基礎エナジー + (実行者のレベル − 1), 実行者のきのみの基礎エナジー × 1.025^(実行者のレベル − 1))\nスキルの基本評価 = (実行者のきのみエナジー × 自身へのきのみ数 + Σ(他4匹それぞれのきのみエナジー × 他者へのきのみ数)) × きのみバーストイベント補正\n最終評価 = スキルの基本評価 × 最終抽選の重み',
        formulaHtml: `実行者のきのみエナジー = max(実行者のきのみの基礎エナジー + (実行者のレベル − 1), 実行者のきのみの基礎エナジー × 1.025^(実行者のレベル − 1))\nスキルの基本評価 = (実行者のきのみエナジー × ${selfBerryNum} + Σ(他4匹それぞれのきのみエナジー × ${otherBerryNum})) × きのみバーストイベント補正\n最終評価 = スキルの基本評価 × 最終抽選の重み`,
        description:
          '実行者分と、他4匹それぞれのきのみエナジーに他者用の個数を掛けた値を合算します。',
      },
    ],
    resultLabel: 'スキル評価',
    resultUnit: 'エナジー/回',
    calculate: (values, mode) => {
      const executorBerryBaseEnergy = Berry.list[values.executorBerryIndex].energy;
      const executorBerryEnergy = Math.max(
        executorBerryBaseEnergy + values.level - 1,
        executorBerryBaseEnergy * 1.025 ** (values.level - 1),
      );
      const other = Math.max(
        values.otherBerryBaseEnergy + values.level - 1,
        values.otherBerryBaseEnergy * 1.025 ** (values.level - 1),
      );
      const result =
        mode === PokemonSimulatorMode.SELECT
          ? executorBerryEnergy * effect.self + other * effect.other * 4
          : mode === PokemonSimulatorMode.ABOUT
            ? executorBerryEnergy * effect.self * values.eventRate
            : (executorBerryEnergy * effect.self + values.otherBerryEnergySum * effect.other) *
              values.eventRate;
      return result * values.weight;
    },
  };
}

function disguiseBerryBurstSpecification(
  skill: SkillDefinition,
  effect: { self: number; other: number },
): SkillSpecification {
  const specification = berryBurstSpecification(effect);
  const disguiseFormula =
    '大成功発生率 = 1 − (1 − 大成功確率)^1日のスキル発動回数\nばけのかわ補正 = (大成功発生率 × (1日のスキル発動回数 + 2) + (1 − 大成功発生率) × 1日のスキル発動回数) ÷ 1日のスキル発動回数';
  const addDisguiseFormula = (formula: string) =>
    formula.replace('\n最終評価 = ', `\n${disguiseFormula}\n最終評価 = ばけのかわ補正 × (`) + ')';

  return {
    ...specification,
    inputs: [
      ...specification.inputs,
      specificationInput('skillPerDay', '1日のスキル発動回数', 8, '回'),
      specificationInput('successRate', '大成功確率', skill.success ?? 0),
    ],
    modes: specification.modes.map((mode) => ({
      ...mode,
      formula: addDisguiseFormula(mode.formula),
      formulaHtml: mode.formulaHtml ? addDisguiseFormula(mode.formulaHtml) : undefined,
      description: `${mode.description} 大成功による追加2回分は、ばけのかわ補正として最終評価へ反映します。`,
    })),
    calculate: (values, mode) => {
      const result = specification.calculate(values, mode);
      const additionalRate = 1 - (1 - values.successRate) ** values.skillPerDay;
      const disguiseRate =
        (additionalRate * (values.skillPerDay + 2) + (1 - additionalRate) * values.skillPerDay) /
        values.skillPerDay;
      return result * disguiseRate;
    },
  };
}

abstract class BaseBerryBurstSkill implements SkillHandler {
  protected abstract applyBonus(context: SkillEvaluationContext, energyPerSkill: number): number;

  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { config, effect, executor, mode, pokemonList, weight } = context;
    let energyPerSkill = 0;

    if (mode == PokemonSimulatorMode.ABOUT) {
      energyPerSkill =
        executor.berryEnergy * effect.self * config.simulation.eventBonus.skill.berryBurst;
      executor.burstBonus = effect.other * weight * config.simulation.eventBonus.skill.berryBurst;
    } else if (mode == PokemonSimulatorMode.TEAM) {
      for (const subPokemon of pokemonList!) {
        energyPerSkill +=
          subPokemon.berryEnergy *
          (executor == subPokemon ? effect.self : effect.other) *
          config.simulation.eventBonus.skill.berryBurst;
      }
    } else {
      energyPerSkill =
        executor.berryEnergy * effect.self +
        Math.max(
          Berry.map['ヤチェ'].energy + executor.lv - 1,
          Berry.map['ヤチェ'].energy * 1.025 ** (executor.lv - 1),
        ) *
          effect.other *
          4;
    }

    return { energyPerSkill: this.applyBonus(context, energyPerSkill) };
  }
}

export class BerryBurstSkill extends BaseBerryBurstSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'きのみバースト',
      effect: [
        { self: 11, other: 1 },
        { self: 14, other: 2 },
        { self: 21, other: 2 },
        { self: 24, other: 3 },
        { self: 27, other: 4 },
        { self: 30, other: 5 },
      ],
      team: true,
      energyOnly: true,
      category: 'energy',
    }),
  ];

  protected applyBonus(_context: SkillEvaluationContext, energyPerSkill: number): number {
    return energyPerSkill;
  }
}

export class DisguiseBerryBurstSkill extends BaseBerryBurstSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'ばけのかわ(きのみバースト)',
      effect: [
        { self: 8, other: 1 },
        { self: 10, other: 2 },
        { self: 15, other: 2 },
        { self: 17, other: 3 },
        { self: 19, other: 4 },
        { self: 21, other: 5 },
      ],
      team: true,
      success: 0.2,
      energyOnly: true,
      category: 'energy',
    }),
  ];

  protected applyBonus(
    { copy, executor, fromMetronome, skill }: SkillEvaluationContext,
    energyPerSkill: number,
  ): number {
    if (copy || fromMetronome) return energyPerSkill;
    const success = 1 - (1 - skill.success) ** executor.skillPerDay;
    return (
      energyPerSkill *
      ((success * (executor.skillPerDay + 2) + (1 - success) * executor.skillPerDay) /
        executor.skillPerDay)
    );
  }
}

export const skillDefinitions = [
  ...BerryBurstSkill.skillDefinitions,
  ...DisguiseBerryBurstSkill.skillDefinitions,
];

for (const definition of BerryBurstSkill.skillDefinitions) {
  definition.specification = (level) =>
    berryBurstSpecification(definition.effect[level] as { self: number; other: number });
}
for (const definition of DisguiseBerryBurstSkill.skillDefinitions) {
  definition.specification = (level) =>
    disguiseBerryBurstSpecification(
      definition,
      definition.effect[level] as { self: number; other: number },
    );
}
