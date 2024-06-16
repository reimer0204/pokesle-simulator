const list = [
  { name: 'きのみの数S',          rarity: 3, short: 'きのみS',  katakana: 'キノミノカズS',             next: null},
  { name: 'げんき回復ボーナス',   rarity: 3, short: 'げんボ',   katakana: 'ゲンキカイフクボーナス',    next: null},
  { name: 'ゆめのかけらボーナス', rarity: 3, short: 'ゆめボ',   katakana: 'ユメノカケラボーナス',      next: null},
  { name: 'リサーチEXPボーナス',  rarity: 3, short: 'リサボ',   katakana: 'リサーチEXPボーナス',       next: null},
  { name: '睡眠EXPボーナス',      rarity: 3, short: '睡眠ボ',   katakana: 'スイミンEXPボーナス',       next: null},
  { name: 'おてつだいボーナス',   rarity: 3, short: 'おてボ',   katakana: 'オテツダイボーナス',        next: null},
  { name: 'スキルレベルアップM',  rarity: 3, short: 'スキLvM',  katakana: 'スキルレベルアップM',       next: null},
  { name: 'スキル確率アップM',    rarity: 2, short: 'スキ確M',  katakana: 'スキルカクリツアップM',     next: null},
  { name: '食材確率アップM',      rarity: 2, short: '食確M',    katakana: 'ショクザイカクリツアップM', next: null},
  { name: 'スキルレベルアップS',  rarity: 2, short: 'スキLvS',  katakana: 'スキルレベルアップS',       next: 'スキルレベルアップM',  },
  { name: 'おてつだいスピードM',  rarity: 2, short: 'おてｽﾋﾟM', katakana: 'オテツダイスピードM',       next: null},
  { name: '最大所持数アップL',    rarity: 2, short: '所持L',    katakana: 'サイダイショジスウアップL', next: null},
  { name: '最大所持数アップM',    rarity: 2, short: '所持M',    katakana: 'サイダイショジスウアップM', next: '最大所持数アップL',    },
  { name: 'スキル確率アップS',    rarity: 1, short: 'スキ確S',  katakana: 'スキルカクリツアップS',     next: 'スキル確率アップM',    },
  { name: '食材確率アップS',      rarity: 1, short: '食確S',    katakana: 'ショクザイカクリツアップS', next: '食材確率アップM',      },
  { name: 'おてつだいスピードS',  rarity: 1, short: 'おてｽﾋﾟS', katakana: 'オテツダイスピードS',       next: 'おてつだいスピードM',  },
  { name: '最大所持数アップS',    rarity: 1, short: '所持S',    katakana: 'サイダイショジスウアップS', next: '最大所持数アップM',    },
]

let map = list.reduce((a, x) => (a[x.name] = x, a), {});

class SubSkill {
  static list = [];
  static map = {};
}

SubSkill.list = list;
SubSkill.map = map;

export default SubSkill;