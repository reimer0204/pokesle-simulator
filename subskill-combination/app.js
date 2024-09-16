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
          for(let i = 1; i <= 5; i++) {
            let subSkillKey = subSkillList.slice(0, i).sort().join('/');
            subSkillCombinationMap[`n${i}`][subSkillKey] = (subSkillCombinationMap[`n${i}`][subSkillKey] ?? 0) + 1;
          }

          for(let subSkill of SubSkill.list) {
            if (subSkill.next == null) continue;

            let index = subSkillList.indexOf(subSkill.name);
            if (index != -1 && !subSkillList.includes(subSkill.next)) {
              subSkillList[index] = subSkill.next;
            }
          }
          
          for(let i = 1; i <= 5; i++) {
            let subSkillKey = subSkillList.slice(0, i).sort().join('/');
            subSkillCombinationMap[`s${i}`][subSkillKey] = (subSkillCombinationMap[`s${i}`][subSkillKey] ?? 0) + 1;
          }
        }
      }
    }
  }
}

let result = {};
for(let key in subSkillCombinationMap) {
  let list = Object.entries(subSkillCombinationMap[key]).map(([key, value]) => ({ subSkill: key.split('/').map(name => SubSkill.map[name].id), value }));
  // if (key != 's1' && key != 'n1') continue;

  let max = Math.floor(Math.sqrt(Math.min(...list.map(x => x.value))));

  let hit = false;

  do {
    hit = false;
    for(let i = 2; i <= max; i++) {
      if (list.every(({key, value}) => value % i == 0)) {
        list.forEach(item => item.value /= i);
        hit = true;
        break;
      }
    }
  } while(hit);

  result[key] = list.map(item => [...item.subSkill, item.value]);
}

fs.writeFileSync(
  '../src/data/sub-skill-combination.js',
  'const SubSkillCombination = ' + JSON.stringify(result) + ';\n'
  + '\n'
  + 'export default SubSkillCombination'
)

// export default SubSkillCombination

console.log(result);
// console.log(subSkillCombinationMap.s1);

// console.log(combination(SubSkill.list.length, 2));

// for(const indexes of combination(SubSkill.list.length, subSkillNum)) {
//   let subSkillList = indexes.map(i => SubSkill.list[i].name);
// }