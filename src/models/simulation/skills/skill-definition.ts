import type { SkillType } from '../../../type';

export type SkillDefinitionInput = Omit<SkillType, 'category'> & {
  category?: SkillType['category'];
};

/**
 * スキルマスターとシミュレーション実装を接続する基底クラス。
 * 既存の呼び出し側は SkillType としてそのまま扱える。
 */
export class SkillDefinition implements SkillType {
  name: string;
  effect: any[];
  category: SkillType['category'];
  success?: number;
  metronome?: boolean;
  copyable?: boolean;
  genki?: boolean;
  selfHeal?: boolean;
  isMetronomeSkill?: boolean;
  plusMinusPair?: boolean;
  specification?: import('./skill-specification-types').SkillSpecificationFactory;
  team?: boolean;
  shard?: boolean;
  energyOnly?: boolean;
  skillSpecialtyOnly?: boolean;
  foodList?: any[];
  evaluateEnergy?: number[];

  constructor({ specification, ...definition }: SkillDefinitionInput) {
    Object.assign(this, { category: 'etc', ...definition });
    // ポケモンのマスターを Worker へ返す際、仕様ページ専用の関数を構造化複製の対象にしない。
    Object.defineProperty(this, 'specification', {
      value: specification,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}
