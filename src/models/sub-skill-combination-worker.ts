import SubSkill from "@/data/sub-skill";
import type { SubSkillType } from "@/type";

addEventListener('message', async (event) => {
  let config: any = event.data.config; 

  function toEffectList(subSkillList: SubSkillType[]) {
    let kinomiS = 0;
    let genbo = 0;
    let otebo = 0;
    let skillLv = 0;
    let skillProb = 0;
    let foodProb = 0;
    let speed = 0;
    let bag = 0;

    for(let subSkill of subSkillList) {
      if (subSkill.name === 'きのみの数S') kinomiS = 1;
      if (subSkill.name === 'げんき回復ボーナス') genbo = 1;
      if (subSkill.name === 'おてつだいボーナス') otebo = 1;
      
      if(subSkill.name === 'スキルレベルアップS') skillLv += 1;
      if(subSkill.name === 'スキルレベルアップM') skillLv += 2;

      if(subSkill.name === 'スキル確率アップS') skillProb += 18;
      if(subSkill.name === 'スキル確率アップM') skillProb += 36;

      if(subSkill.name === '食材確率アップS') foodProb += 18;
      if(subSkill.name === '食材確率アップM') foodProb += 36;

      if(subSkill.name === 'おてつだいスピードS') speed += 7;
      if(subSkill.name === 'おてつだいスピードM') speed += 14;

      if(subSkill.name === '最大所持数アップS') bag += 6;
      if(subSkill.name === '最大所持数アップM') bag += 12;
      if(subSkill.name === '最大所持数アップL') bag += 18;
    }

    return [kinomiS, genbo, otebo, skillLv, skillProb, foodProb, speed, bag].join('/')
  }

  let result: {
    [key: number]: {
      [key: string]: {
        s: number[],
        0?: number[],
        1?: number[],
        2?: number[]
      }
    }
  } = {
    1: {},
    2: {},
    3: {},
    4: {},
    5: {},
  };

  let silverSeedSubSkillList = SubSkill.hasNextList
    .filter(x => config.selectEvaluate.silverSeed[x.name]);
  
  const yumebo = SubSkill.list.find(x => x.name === 'ゆめのかけらボーナス')!;
  const risabo = SubSkill.list.find(x => x.name === 'リサーチEXPボーナス')!;

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
              SubSkill.list[s1],
              SubSkill.list[s2],
              SubSkill.list[s3],
              SubSkill.list[s4],
              SubSkill.list[s5],
            ];

            // 銀種をあげた場合の計算(上位のスキルから見ていくことで対応)
            subSkillList = SubSkill.useSilverSeed(
              subSkillList.map(x => x.name),
              config.selectEvaluate.silverSeed
            ).map(name => SubSkill.map[name])

            for(let i = 1; i <= 5; i++) {
              // let subSkillKey = subSkillList.slice(0, i).sort().join('/');
              let slicedSubSkillList = subSkillList.slice(0, i);

              // このサブスキルの組合せによる効果
              let subSkillKey = toEffectList(slicedSubSkillList)

              let afterCode = 0;
              if (slicedSubSkillList.includes(yumebo)) afterCode += 1;
              if (slicedSubSkillList.includes(risabo)) afterCode += 2;

              if (result[i][subSkillKey] === undefined) {
                // この効果をシミュレーションするためのサブスキルのIDリスト
                result[i][subSkillKey] = {
                  s: slicedSubSkillList.map(x => x.id)
                };
              }

              if(result[i][subSkillKey][afterCode] === undefined) {
                result[i][subSkillKey][afterCode] = [0, ...slicedSubSkillList.map(x => x.id)]
              }

              result[i][subSkillKey][afterCode][0]++;
            }
          }
        }
      }
    }
  }
  
  for(let key in result) {
    result[key] = Object.values(result[key]);
  }

  postMessage({
    status: 'success',
    body: result,
  })
})

export default {}