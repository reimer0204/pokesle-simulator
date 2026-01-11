export type FieldItem = {
  name: string,
  berryList: (string|null)[],
  ex: boolean,
}

const list: FieldItem[] = [
  { name: 'ワカクサ本島',     berryList: [null], ex: true },
  { name: 'シアンの砂浜',     berryList: ['オレン', 'モモン', 'シーヤ'], ex: false },
  { name: 'トープ洞窟',       berryList: ['フィラ', 'ヒメリ', 'オボン'], ex: false },
  { name: 'ウノハナ雪原',     berryList: ['チーゴ', 'キー', 'ウイ'], ex: false },
  { name: 'ラピスラズリ湖畔', berryList: ['ドリ', 'マゴ', 'クラボ'], ex: false },
  { name: 'ゴールド旧発電所', berryList: ['ウブ', 'ベリブ', 'ブリー'], ex: false },
  { name: 'アンバー渓谷',     berryList: ['カゴ', 'ラム', 'ヤチェ'], ex: false },
];

class Field {
  static list: FieldItem[] = [];
  static map: { [key: string]: FieldItem } = {};
}

Field.list = list;
Field.map = list.reduce((a: { [key: string]: FieldItem }, x) => (a[x.name] = x, a), {});

export default Field;