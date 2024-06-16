const list = [
  { name: 'シーヤ', energy: 24, type: 'ひこう',     },
  { name: 'ラム',   energy: 24, type: 'むし',       },
  { name: 'ウブ',   energy: 25, type: 'でんき',     },
  { name: 'ブリー', energy: 26, type: 'ゴースト',   },
  { name: 'マゴ',   energy: 26, type: 'エスパー',   },
  { name: 'モモン', energy: 26, type: 'フェアリー', },
  { name: 'クラボ', energy: 27, type: 'かくとう',   },
  { name: 'ヒメリ', energy: 27, type: 'ほのお',     },
  { name: 'キー',   energy: 28, type: 'ノーマル',   },
  { name: 'フィラ', energy: 29, type: 'じめん',     },
  { name: 'オボン', energy: 30, type: 'いわ',       },
  { name: 'ドリ',   energy: 30, type: 'くさ',       },
  { name: 'ウイ',   energy: 31, type: 'あく',       },
  { name: 'オレン', energy: 31, type: 'みず',       },
  { name: 'カゴ',   energy: 32, type: 'どく',       },
  { name: 'チーゴ', energy: 32, type: 'こおり',     },
  { name: 'ベリブ', energy: 33, type: 'はがね',     },
  { name: 'ヤチェ', energy: 35, type: 'ドラゴン',   },
];

class Berry {
  static list = [];
  static map = {};
}

Berry.list = list;
Berry.map = list.reduce((a, x) => (a[x.name] = x, a), {});

export default Berry