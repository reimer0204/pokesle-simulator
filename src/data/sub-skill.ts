import type { SubSkillType } from "../type";

const list = [
  { id:  1, name: 'きのみの数S',          rarity: 3, short: 'きのみS',  katakana: 'キノミノカズS',             inputSort: 0, next: null},
  { id:  2, name: 'げんき回復ボーナス',   rarity: 3, short: 'げんボ',   katakana: 'ゲンキカイフクボーナス',    inputSort: 0, next: null},
  { id:  3, name: 'ゆめのかけらボーナス', rarity: 3, short: 'ゆめボ',   katakana: 'ユメノカケラボーナス',      inputSort: 0, next: null},
  { id:  4, name: 'リサーチEXPボーナス',  rarity: 3, short: 'リサボ',   katakana: 'リサーチEXPボーナス',       inputSort: 0, next: null},
  { id:  5, name: '睡眠EXPボーナス',      rarity: 3, short: '睡眠ボ',   katakana: 'スイミンEXPボーナス',       inputSort: 0, next: null},
  { id:  6, name: 'おてつだいボーナス',   rarity: 3, short: 'おてボ',   katakana: 'オテツダイボーナス',        inputSort: 0, next: null},
  { id:  7, name: 'スキルレベルアップM',  rarity: 3, short: 'スキLvM',  katakana: 'スキルレベルアップM',       inputSort: 2, next: null},
  { id:  8, name: 'スキル確率アップM',    rarity: 2, short: 'スキ確M',  katakana: 'スキルカクリツアップM',     inputSort: 1, next: null},
  { id:  9, name: '食材確率アップM',      rarity: 2, short: '食確M',    katakana: 'ショクザイカクリツアップM', inputSort: 0, next: null},
  { id: 10, name: 'スキルレベルアップS',  rarity: 2, short: 'スキLvS',  katakana: 'スキルレベルアップS',       inputSort: 2, next: 'スキルレベルアップM',  },
  { id: 11, name: 'おてつだいスピードM',  rarity: 2, short: 'おてｽﾋﾟM', katakana: 'オテツダイスピードM',       inputSort: 0, next: null},
  { id: 12, name: '最大所持数アップL',    rarity: 2, short: '所持L',    katakana: 'サイダイショジスウアップL', inputSort: 0, next: null},
  { id: 13, name: '最大所持数アップM',    rarity: 2, short: '所持M',    katakana: 'サイダイショジスウアップM', inputSort: 0, next: '最大所持数アップL',    },
  { id: 14, name: 'スキル確率アップS',    rarity: 1, short: 'スキ確S',  katakana: 'スキルカクリツアップS',     inputSort: 1, next: 'スキル確率アップM',    },
  { id: 15, name: '食材確率アップS',      rarity: 1, short: '食確S',    katakana: 'ショクザイカクリツアップS', inputSort: 0, next: '食材確率アップM',      },
  { id: 16, name: 'おてつだいスピードS',  rarity: 1, short: 'おてｽﾋﾟS', katakana: 'オテツダイスピードS',       inputSort: 0, next: 'おてつだいスピードM',  },
  { id: 17, name: '最大所持数アップS',    rarity: 1, short: '所持S',    katakana: 'サイダイショジスウアップS', inputSort: 0, next: '最大所持数アップM',    },
]

class SubSkill {
  static list: SubSkillType[] = list;
  static map: { [key: string]: SubSkillType } = list.reduce((a, x) => (a[x.name] = x, a), {});
  static idMap: { [key: number]: SubSkillType } = list.reduce((a, x) => (a[x.id] = x, a), {});
  static listForInput = SubSkill.list.toSorted((a, b) => a.inputSort - b.inputSort);

  static useSilverSeed(subSkillList: string[]): string[] {
    let tmp = subSkillList.join('/')
  
    if (tmp.includes('最大所持数アップM'  ) && !tmp.includes('最大所持数アップL'  )) { tmp = tmp.replace('最大所持数アップM'  , '最大所持数アップL'  ) };
    if (tmp.includes('最大所持数アップS'  ) && !tmp.includes('最大所持数アップL'  )) { tmp = tmp.replace('最大所持数アップS'  , '最大所持数アップL'  ) };
    if (tmp.includes('最大所持数アップS'  ) && !tmp.includes('最大所持数アップM'  )) { tmp = tmp.replace('最大所持数アップS'  , '最大所持数アップM'  ) };
    if (tmp.includes('スキルレベルアップS') && !tmp.includes('スキルレベルアップM')) { tmp = tmp.replace('スキルレベルアップS', 'スキルレベルアップM') };
    if (tmp.includes('スキル確率アップS'  ) && !tmp.includes('スキル確率アップM'  )) { tmp = tmp.replace('スキル確率アップS'  , 'スキル確率アップM'  ) };
    if (tmp.includes('食材確率アップS'    ) && !tmp.includes('食材確率アップM'    )) { tmp = tmp.replace('食材確率アップS'    , '食材確率アップM'    ) };
    if (tmp.includes('おてつだいスピードS') && !tmp.includes('おてつだいスピードM')) { tmp = tmp.replace('おてつだいスピードS', 'おてつだいスピードM') };
  
    return tmp.split('/')
  }
}

export default SubSkill;