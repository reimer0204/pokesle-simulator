const list = [
  { name: 'ワカクサ本島',     berryList: [null]},
  { name: 'シアンの砂浜',     berryList: ['オレン', 'モモン', 'シーヤ']},
  { name: 'トープ洞窟',       berryList: ['フィラ', 'ヒメリ', 'オボン']},
  { name: 'ウノハナ雪原',     berryList: ['チーゴ', 'キー', 'ウイ']},
  { name: 'ラピスラズリ湖畔', berryList: ['ドリ', 'マゴ', 'クラボ']},
  { name: 'ゴールド旧発電所', berryList: ['ウブ', 'ベリブ', 'ブリー']},
  { name: '？？？', berryList: ['カゴ', 'ラム', 'ヤチェ']},
];

class Field {
  static list = [];
  static map = {};
}

Field.list = list;
Field.map = list.reduce((a, x) => (a[x.name] = x, a), {});

export default Field