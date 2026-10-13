import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import type { SkillType } from '../../../type';
import Berry from '../../../data/berry';
import type {
  SkillSpecification,
  SkillSpecificationInput,
  SkillSpecificationMode,
} from './skill-specification-types';

const modeList: SkillSpecificationMode[] = [
  {
    id: PokemonSimulatorMode.SELECT,
    label: '厳選計算時',
    formula: '',
    description: '厳選評価用の代表値として計算します。',
  },
  {
    id: PokemonSimulatorMode.ABOUT,
    label: 'ボックス計算時',
    formula: '',
    description: 'ボックス一覧の概算評価で使う1回あたりの値として計算します。',
  },
  {
    id: PokemonSimulatorMode.TEAM,
    label: 'チーム計算時',
    formula: '',
    description: '編成中の対象数を反映する1回あたりの値として計算します。',
  },
];

function input(
  key: string,
  label: string,
  defaultValue: number,
  unit?: string,
): SkillSpecificationInput {
  return { key, label, defaultValue, step: 0.1, unit };
}

function fixedInput(
  key: string,
  label: string,
  defaultValue: number,
  unit?: string,
): SkillSpecificationInput {
  return { ...input(key, label, defaultValue, unit), editable: false };
}

function modes(formula: string, descriptions: Partial<Record<PokemonSimulatorMode, string>> = {}) {
  return modeList.map((mode) => ({
    ...mode,
    formula,
    description: descriptions[mode.id] ?? mode.description,
  }));
}
export function teamBerrySpecification(
  skill: SkillType,
  effect: { team: { self: number; other: number }[]; bonus?: number },
  type: 'meteor' | 'moon',
): SkillSpecification {
  const aboutEffect = effect.team.at(-1)!;
  const selectedEffect = effect.team.at(-1)!;
  const bonus = effect.bonus ?? 0;
  const isMeteor = type === 'meteor';
  return {
    inputs: [
      input('berryEnergy', '実行者のきのみエナジー', 100, 'エナジー'),
      fixedInput(
        'otherBerryBaseEnergy',
        `${isMeteor ? 'ヤチェ' : 'マゴ'}のみの基礎エナジー`,
        Berry.map[isMeteor ? 'ヤチェ' : 'マゴ'].energy,
        'エナジー',
      ),
      input('level', '実行者のレベル', 1, 'Lv'),
      fixedInput('self', '自身へのきのみ数', selectedEffect.self, '個'),
      fixedInput('other', '他者へのきのみ数', selectedEffect.other, '個'),
      fixedInput('bonus', '自身への追加きのみ数', bonus, '個'),
      fixedInput('otherCount', 'チーム内の他者数', 4, '匹'),
      input('eventRate', 'きのみバーストイベント補正', 1, '倍'),
      input('latiasInTeam', 'ラティアス編成時', 0, '（1: はい）'),
      input('weight', '最終抽選の重み', 1, '倍'),
    ],
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula: `他者きのみエナジー = max(${isMeteor ? 'ヤチェ' : 'マゴ'}のみ基礎エナジー + (レベル − 1), ${isMeteor ? 'ヤチェ' : 'マゴ'}のみ基礎エナジー × 1.025^(レベル − 1))\nスキルの基本評価 = 実行者のきのみエナジー × (自身へのきのみ数${isMeteor ? ' + 自身への追加きのみ数' : ''}) + 他者きのみエナジー × 他者へのきのみ数 × 4\n最終評価 = スキルの基本評価 × 最終抽選の重み`,
        description: '5匹編成時の自身用・他者用の個数を使用します。',
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula: `スキルの基本評価 = 実行者のきのみエナジー × (自身へのきのみ数${isMeteor ? ' + 自身への追加きのみ数' : ''}) × きのみバーストイベント補正\nburstBonus = 他者へのきのみ数 × きのみバーストイベント補正\n最終評価 = スキルの基本評価 × 最終抽選の重み`,
        description: '5匹編成時の値を使用し、他者分のきのみ数は別途保持します。',
      },
      {
        id: PokemonSimulatorMode.TEAM,
        label: 'チーム計算時',
        formula: `スキルの基本評価 = (実行者のきのみエナジー × ${isMeteor ? '(ラティアス編成時: 自身へのきのみ数、それ以外: 自身へのきのみ数 + 自身への追加きのみ数)' : '自身へのきのみ数'} + 実行者のきのみエナジー × 他者へのきのみ数 × チーム内の他者数) × きのみバーストイベント補正\n最終評価 = スキルの基本評価 × 最終抽選の重み`,
        description: '5匹編成時の値を使用し、編成中の各ポケモンを実装どおり合算します。',
      },
    ],
    resultLabel: 'スキル評価',
    resultUnit: 'エナジー/回',
    calculate: (values, mode) => {
      const otherBerryEnergy = Math.max(
        values.otherBerryBaseEnergy + values.level - 1,
        values.otherBerryBaseEnergy * 1.025 ** (values.level - 1),
      );
      let result;
      if (mode === PokemonSimulatorMode.SELECT) {
        result =
          values.berryEnergy * (values.self + (isMeteor ? values.bonus : 0)) +
          otherBerryEnergy * values.other * 4;
      } else if (mode === PokemonSimulatorMode.ABOUT) {
        result =
          values.berryEnergy * (values.self + (isMeteor ? values.bonus : 0)) * values.eventRate;
      } else {
        const self =
          isMeteor && values.latiasInTeam
            ? values.self
            : values.self + (isMeteor ? values.bonus : 0);
        result =
          (values.berryEnergy * self + values.berryEnergy * values.other * values.otherCount) *
          values.eventRate;
      }
      return result * values.weight;
    },
  };
}
