import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import type { SkillSpecificationInput, SkillSpecificationMode } from './skill-specification-types';

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

export function specificationInput(
  key: string,
  label: string,
  defaultValue: number,
  unit?: string,
): SkillSpecificationInput {
  return { key, label, defaultValue, step: 0.1, unit };
}

export function specificationSelectInput(
  key: string,
  label: string,
  defaultValue: number,
  options: { label: string; value: number }[],
): SkillSpecificationInput {
  return { key, label, defaultValue, type: 'select', options };
}

export function fixedSpecificationInput(
  key: string,
  label: string,
  defaultValue: number,
  unit?: string,
): SkillSpecificationInput {
  return { ...specificationInput(key, label, defaultValue, unit), editable: false };
}

export function specificationModes(
  formula: string,
  descriptions: Partial<Record<PokemonSimulatorMode, string>> = {},
): SkillSpecificationMode[] {
  return modeList.map((mode) => ({
    ...mode,
    formula,
    description: descriptions[mode.id] ?? mode.description,
  }));
}
