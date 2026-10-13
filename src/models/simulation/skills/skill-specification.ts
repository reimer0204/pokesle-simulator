import type { SkillType } from '../../../type';
import type { SkillSpecification } from './skill-specification-types';

export type {
  SkillSpecification,
  SkillSpecificationEffect,
  SkillSpecificationInput,
  SkillSpecificationMode,
} from './skill-specification-types';

/** 仕様ページの入口。スキル固有の説明・式は各 SkillDefinition に置く。 */
export function getSkillSpecification(skill: SkillType, level: number): SkillSpecification {
  if (!skill.specification) throw new Error(`スキル仕様が未定義です: ${skill.name}`);
  return skill.specification(level);
}
