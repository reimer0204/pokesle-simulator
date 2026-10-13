import type { PokemonSimulatorMode } from '../pokemon-simulator-mode';

export interface SkillSpecificationInput {
  key: string;
  label: string;
  defaultValue: number;
  type?: 'number' | 'select';
  options?: { label: string; value: number }[];
  step?: number;
  unit?: string;
  editable?: boolean;
  labelByMode?: Partial<Record<PokemonSimulatorMode, string>>;
  visibleModes?: PokemonSimulatorMode[];
  fixedValue?: (values: Record<string, number>, mode: PokemonSimulatorMode) => number | null;
}

export interface SkillSpecificationEffect {
  label: string;
  value: number | string;
  unit?: string;
}

export interface SkillSpecificationMode {
  id: PokemonSimulatorMode;
  label: string;
  formula: string;
  formulaHtml?: string;
  description: string;
}

export interface SkillSpecification {
  effectList?: SkillSpecificationEffect[];
  inputs: SkillSpecificationInput[];
  modes: SkillSpecificationMode[];
  resultLabel: string;
  resultUnit: string;
  calculate: (values: Record<string, number>, mode: PokemonSimulatorMode) => number;
}

export type SkillSpecificationFactory = (level: number) => SkillSpecification;
