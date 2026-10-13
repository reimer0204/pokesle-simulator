import type { SkillType } from '../type';
import { skillCategoryList, skillList } from '../models/simulation/skills/skill-list';

export { skillCategoryList };
export type { SkillCategory } from '../models/simulation/skills/skill-list';

class Skill {
  static list: SkillType[] = skillList;
  static map: { [key: string]: SkillType } = Skill.list.reduce(
    (a: { [key: string]: SkillType }, x) => ((a[x.name] = x), a),
    {},
  );
  static categoryList = skillCategoryList
    .map((category) => ({
      ...category,
      skillList: Skill.list.filter((skill) => skill.category === category.id),
    }))
    .filter((category) => category.skillList.length);
  static metronomeTarget = Skill.list.filter(
    (x) => x.name != 'ゆびをふる' && x.metronome !== false,
  );
  static metronomeWeightList = Skill.metronomeTarget.map((x) => ({
    skill: x,
    weight: 1 / Skill.metronomeTarget.length,
  }));
  static metronomeNonTeamTarget = Skill.metronomeTarget.filter((x) => !x.team);
  static metronomeTeamTarget = Skill.metronomeTarget.filter((x) => x.team);
  static genkiSkillList = Skill.list.filter((x) => x.genki);
}

Skill.map['へんしん(スキルコピー)'].evaluateEnergy = Skill.map['へんしん(スキルコピー)'].effect.map(
  (_, i): number => Skill.map['エナジーチャージM'].effect[i],
);
Skill.map['ものまね(スキルコピー)'].evaluateEnergy = Skill.map['ものまね(スキルコピー)'].effect.map(
  (_, i): number => Skill.map['エナジーチャージM'].effect[i],
);
Skill.map['ほっぺすりすり(げんきエールS)'].evaluateEnergy = Skill.map[
  'ほっぺすりすり(げんきエールS)'
].effect.map((_, i): number =>
  Math.round(Skill.map['エナジーチャージM'].effect.at(-1) * (1 - (1 - 0.15) ** (i + 2))),
);

export default Skill;
