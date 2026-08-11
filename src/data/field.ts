import Berry from "./berry";

export type ExBuff = {
  speed?: number,
  skillLv?: number,
  bag?: number,
}
export type FieldItem = {
  name: string,
  berryList?: string[],
  berryOptionList?: string[][],
  ex?: boolean,
  exBuff?: {
    match: ExBuff,
    notMatch: ExBuff,
  },
}

const allBerry = Berry.list.map(x => x.name);
const list: FieldItem[] = [
  { name: 'ワカクサ本島',     berryOptionList: [allBerry, allBerry, allBerry] },
  { name: 'シアンの砂浜',     berryList: ['オレン', 'モモン', 'シーヤ'] },
  { name: 'トープ洞窟',       berryList: ['フィラ', 'ヒメリ', 'オボン'] },
  { name: 'ウノハナ雪原',     berryList: ['チーゴ', 'キー', 'ウイ'] },
  { name: 'ラピスラズリ湖畔', berryList: ['ドリ', 'マゴ', 'クラボ'] },
  { name: 'ゴールド旧発電所', berryList: ['ウブ', 'ベリブ', 'ブリー'] },
  { name: 'アンバー渓谷',     berryList: ['カゴ', 'ラム', 'ヤチェ'] },
  {
    name: 'ワカクサ本島EX',
    berryOptionList: [allBerry, allBerry, allBerry],
    ex: true,
    exBuff: {
      match: {
        speed: 0.9,
        skillLv: 1,
      },
      notMatch: {
        speed: 1.15
      },
    },
  },
  {
    name: 'シアンの砂浜EX',
    berryOptionList: [
      Berry.list.filter(b => ['オレン', 'モモン', 'シーヤ'].includes(b.name)).map(b => b.name),
      allBerry, allBerry
    ],
    ex: true,
    exBuff: {
      match: {
        speed: 0.8,
        skillLv: 1,
        bag: 5,
      },
      notMatch: {
        speed: 1.35,
      },
    },
  },
];

class Field {
  static list: FieldItem[] = [];
  static map: { [key: string]: FieldItem } = {};
}

Field.list = list;
Field.map = list.reduce((a: { [key: string]: FieldItem }, x) => (a[x.name] = x, a), {});

export default Field;