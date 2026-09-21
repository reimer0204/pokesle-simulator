import Skill from '@/data/skill';

const specialtyList = ['きのみ', '食材', 'スキル', 'オール'];

export function createEvaluateRuleSetting() {
  return {
    type: 'berryEnergyRate',
    skillName: null,
    value: 100,
    skillLvType: 1,
    skillLv: 1,
  };
}

export function createEvaluateRule() {
  return {
    target: {
      type: 'all',
      all: true,
      specialties: Object.fromEntries(specialtyList.map(specialty => [specialty, false])),
      skillNameList: [],
      pokemonNameList: [],
    },
    settingList: [createEvaluateRuleSetting()],
  };
}

function matchesTarget(target: any, pokemon: any) {
  if (target?.all) return true;
  if (target == null) return false;

  const selectedSpecialtyList = Object.entries(target.specialties ?? {})
    .filter(([_, enabled]) => enabled)
    .map(([specialty]) => specialty);
  if (selectedSpecialtyList.length && !selectedSpecialtyList.includes(pokemon.specialty)) return false;
  if (target.skillNameList?.length && !target.skillNameList.includes(pokemon.skill.name)) return false;
  if (target.pokemonNameList?.length && !target.pokemonNameList.includes(pokemon.name)) return false;

  return selectedSpecialtyList.length > 0 || target.skillNameList?.length > 0 || target.pokemonNameList?.length > 0;
}

export function getPokemonEvaluateSetting(evaluateConfig: any, pokemon: any) {
  const specialtyConfig = evaluateConfig.specialty[pokemon.specialty];
  const result = {
    berryEnergyRate: specialtyConfig.berryEnergyRate,
    foodEnergyRate: specialtyConfig.foodEnergyRate,
    foodGetRate: specialtyConfig.foodGetRate,
    skillLv: {
      type: specialtyConfig.skillLvType ?? (pokemon.specialty === 'きのみ' || pokemon.specialty === '食材' ? 1 : 2),
      lv: 1,
    },
  };

  if (evaluateConfig.maxSkillLvSkillNameList?.includes(pokemon.skill.name)) {
    result.skillLv = { type: 2, lv: 1 };
  }

  for (const rule of evaluateConfig.ruleList ?? []) {
    if (!matchesTarget(rule.target, pokemon)) continue;
    for (const setting of rule.settingList ?? []) {
      if (setting.type === 'berryEnergyRate') result.berryEnergyRate = setting.value;
      if (setting.type === 'foodEnergyRate') result.foodEnergyRate = setting.value;
      if (setting.type === 'foodGetRate') result.foodGetRate = setting.value;
      if (setting.type === 'skillLv' && setting.skillName === pokemon.skill.name) {
        result.skillLv = { type: setting.skillLvType, lv: setting.skillLv };
      }
    }
  }

  return result;
}

function addSkillLvRule(ruleList: any[], ruleMap: Map<string, any>, targetKey: string, target: any, skillName: string, skillLvSetting: any) {
  let rule = ruleMap.get(targetKey);
  if (rule == null) {
    rule = { target, settingList: [] };
    ruleMap.set(targetKey, rule);
    ruleList.push(rule);
  }

  rule.settingList.push({
    type: 'skillLv',
    skillName,
    value: null,
    skillLvType: skillLvSetting.type,
    skillLv: skillLvSetting.lv,
  });
}

function createSpecialtyTarget(specialty: string) {
  const rule = createEvaluateRule();
  rule.target.type = 'condition';
  rule.target.all = false;
  rule.target.specialties[specialty] = true;
  return rule.target;
}

// 旧とくい別スキルLv設定を、同じ結果になる対象条件付きルールへ移行する。
export function migrateEvaluateConfig(evaluateConfig: any) {
  if (evaluateConfig?.ruleList != null) {
    evaluateConfig.maxSkillLvSkillNameList ??= [];
    const ruleList: any[] = [];
    const skillLvRuleMap = new Map<string, any>();

    for (const rule of evaluateConfig.ruleList) {
      if (rule.target.type == null || (rule.target.type === 'all' && !rule.target.all)) {
        rule.target.type = rule.target.all ? 'all' : rule.target.pokemonNameList?.length ? 'pokemon' : 'condition';
      }
      if (!Array.isArray(rule.settingList)) {
        rule.settingList = rule.setting == null ? [] : [rule.setting];
        delete rule.setting;
      }

      if (rule.target.type === 'all') {
        const maxSkillLvSettingList = rule.settingList.filter(setting => setting.type === 'skillLv' && setting.skillLvType === 2);
        for (const setting of maxSkillLvSettingList) {
          if (!evaluateConfig.maxSkillLvSkillNameList.includes(setting.skillName)) {
            evaluateConfig.maxSkillLvSkillNameList.push(setting.skillName);
          }
        }
        rule.settingList = rule.settingList.filter(setting => !maxSkillLvSettingList.includes(setting));
      }
      if (!rule.settingList.length) continue;

      const isSkillLvOnly = rule.settingList.every(setting => setting.type === 'skillLv');
      const targetKey = JSON.stringify({
        type: rule.target.type,
        specialties: rule.target.specialties,
        skillNameList: [...(rule.target.skillNameList ?? [])].sort(),
        pokemonNameList: [...(rule.target.pokemonNameList ?? [])].sort(),
      });
      const sameTargetRule = isSkillLvOnly ? skillLvRuleMap.get(targetKey) : null;
      if (sameTargetRule != null) {
        sameTargetRule.settingList.push(...rule.settingList);
        continue;
      }

      ruleList.push(rule);
      if (isSkillLvOnly) skillLvRuleMap.set(targetKey, rule);
    }
    evaluateConfig.ruleList = ruleList;
    return;
  }

  const oldSpecialtyConfig = evaluateConfig?.specialty;
  if (oldSpecialtyConfig == null) return;
  const ruleList: any[] = [];
  const ruleMap = new Map<string, any>();
  evaluateConfig.maxSkillLvSkillNameList ??= [];

  for (const skill of Skill.list) {
    const oldSettingList = specialtyList.map(specialty => oldSpecialtyConfig[specialty]?.skillLv?.[skill.name]);
    if (oldSettingList.some(setting => setting == null)) continue;

    const isAllMax = oldSettingList.every(setting => setting.type === 2);
    const isAllSameSpecifiedLevel = oldSettingList.every(setting => setting.type === 3 && setting.lv === oldSettingList[0].lv);
    if (isAllMax) {
      evaluateConfig.maxSkillLvSkillNameList.push(skill.name);
      continue;
    }
    if (isAllSameSpecifiedLevel) {
      addSkillLvRule(ruleList, ruleMap, 'all', createEvaluateRule().target, skill.name, oldSettingList[0]);
      continue;
    }

    for (const specialty of ['きのみ', '食材']) {
      const oldSetting = oldSpecialtyConfig[specialty].skillLv?.[skill.name];
      if (oldSetting != null && oldSetting.type !== 1) addSkillLvRule(ruleList, ruleMap, specialty, createSpecialtyTarget(specialty), skill.name, oldSetting);
    }
    for (const specialty of ['スキル', 'オール']) {
      const oldSetting = oldSpecialtyConfig[specialty].skillLv?.[skill.name];
      if (oldSetting != null && oldSetting.type !== 2) addSkillLvRule(ruleList, ruleMap, specialty, createSpecialtyTarget(specialty), skill.name, oldSetting);
    }
  }

  evaluateConfig.ruleList = ruleList;
  for (const specialty of specialtyList) {
    const config = oldSpecialtyConfig[specialty];
    if (config == null) continue;
    config.skillLvType = specialty === 'きのみ' || specialty === '食材' ? 1 : 2;
    delete config.skillLv;
  }
}
