import SubSkill from "../src/data/sub-skill.js";
import fs from "fs";

let subSkillCombinationMap = {
  n1: {},
  n2: {},
  n3: {},
  n4: {},
  n5: {},
  s1: {},
  s2: {},
  s3: {},
  s4: {},
  s5: {},
};

function toEffectList(subSkillList) {
  let kinomiS = subSkillList.includes('きのみの数S') ? 1 : 0;
  let genbo = subSkillList.includes('げんき回復ボーナス') ? 1 : 0;
  let otebo = subSkillList.includes('おてつだいボーナス') ? 1 : 0;
  let skillLv = 0
  if(subSkillList.includes('スキルレベルアップS')) skillLv += 1;
  if(subSkillList.includes('スキルレベルアップM')) skillLv += 2;

  let skillProb = 0;
  if(subSkillList.includes('スキル確率アップS')) skillProb += 18;
  if(subSkillList.includes('スキル確率アップM')) skillProb += 36;

  let foodProb = 0;
  if(subSkillList.includes('食材確率アップS')) foodProb += 18;
  if(subSkillList.includes('食材確率アップM')) foodProb += 36;

  let speed = 0;
  if(subSkillList.includes('おてつだいスピードS')) speed += 7;
  if(subSkillList.includes('おてつだいスピードM')) speed += 14;

  let bag = 0;
  if(subSkillList.includes('最大所持数アップS')) bag += 6;
  if(subSkillList.includes('最大所持数アップM')) bag += 12;
  if(subSkillList.includes('最大所持数アップL')) bag += 18;

  return [kinomiS, genbo, otebo, skillLv, skillProb, foodProb, speed, bag].join('/')
}

// 考えるのが嫌になったfor文
for(let s1 = 0; s1 < SubSkill.list.length; s1++) {
  for(let s2 = 0; s2 < SubSkill.list.length; s2++) {
    if (s1 == s2) continue;

    for(let s3 = 0; s3 < SubSkill.list.length; s3++) {
      if (s1 == s3 || s2 == s3) continue;

      for(let s4 = 0; s4 < SubSkill.list.length; s4++) {
        if (s1 == s4 || s2 == s4 || s3 == s4) continue;

        for(let s5 = 0; s5 < SubSkill.list.length; s5++) {
          if (s1 == s5 || s2 == s5 || s3 == s5 || s4 == s5) continue;

          let subSkillList = [
            SubSkill.list[s1].name,
            SubSkill.list[s2].name,
            SubSkill.list[s3].name,
            SubSkill.list[s4].name,
            SubSkill.list[s5].name,
          ];

          // そのままの組合せ
          for(let i = 1; i <= 5; i++) {
            // let subSkillKey = subSkillList.slice(0, i).sort().join('/');
            let mainKey = `n${i}`
            let slicedSubSkillList = subSkillList.slice(0, i);
            let subSkillKey = toEffectList(slicedSubSkillList)

            let afterCode = 0;
            if (slicedSubSkillList.includes('ゆめのかけらボーナス')) afterCode += 1;
            if (slicedSubSkillList.includes('リサーチEXPボーナス')) afterCode += 2;

            if (subSkillCombinationMap[mainKey][subSkillKey] === undefined) {
              subSkillCombinationMap[mainKey][subSkillKey] = {
                s: slicedSubSkillList.map(x => SubSkill.map[x].id)
              };
            }

            if(subSkillCombinationMap[mainKey][subSkillKey][afterCode] === undefined) {
              subSkillCombinationMap[mainKey][subSkillKey][afterCode] = 0
            }

            subSkillCombinationMap[mainKey][subSkillKey][afterCode]++;
          }

          // 銀種をあげた場合の計算
          for(let subSkill of SubSkill.list) {
            if (subSkill.next == null) continue;

            let index = subSkillList.indexOf(subSkill.name);
            if (index != -1 && !subSkillList.includes(subSkill.next)) {
              subSkillList[index] = subSkill.next;
            }
          }

          for(let i = 1; i <= 5; i++) {
            // let subSkillKey = subSkillList.slice(0, i).sort().join('/');
            let mainKey = `s${i}`
            let slicedSubSkillList = subSkillList.slice(0, i);
            let subSkillKey = toEffectList(slicedSubSkillList)

            let afterCode = 0;
            if (slicedSubSkillList.includes('ゆめのかけらボーナス')) afterCode += 1;
            if (slicedSubSkillList.includes('リサーチEXPボーナス')) afterCode += 2;

            if (subSkillCombinationMap[mainKey][subSkillKey] === undefined) {
              subSkillCombinationMap[mainKey][subSkillKey] = {
                s: slicedSubSkillList.map(x => SubSkill.map[x].id)
              };
            }

            if(subSkillCombinationMap[mainKey][subSkillKey][afterCode] === undefined) {
              subSkillCombinationMap[mainKey][subSkillKey][afterCode] = 0
            }

            subSkillCombinationMap[mainKey][subSkillKey][afterCode]++;
          }
        }
      }
    }
  }
}


for(let key in subSkillCombinationMap) {
  subSkillCombinationMap[key] = Object.values(subSkillCombinationMap[key]);
}
fs.writeFileSync(
  '../src/data/sub-skill-combination.js',
  'const SubSkillCombination = ' + JSON.stringify(subSkillCombinationMap) + ';\n'
  + '\n'
  + 'export default SubSkillCombination'
)