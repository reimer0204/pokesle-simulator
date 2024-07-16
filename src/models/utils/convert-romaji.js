const map = {
  '': ['ア',   'イ',   'ウ',   'エ',   'オ'  ],
   B: ['バ',   'ビ',   'ブ',   'ベ',   'ボ'  ],
   C: ['カ',   'シ',   'ク',   'セ',   'コ'  ],
   D: ['ダ',   'ヂ',   'ヅ',   'デ',   'ド'  ],
   F: ['ファ', 'フィ', 'フ',   'フェ', 'フォ'],
   G: ['ガ',   'ギ',   'グ',   'ゲ',   'ゴ'  ],
   H: ['ハ',   'ヒ',   'フ',   'ヘ',   'ホ'  ],
   J: ['ジャ', 'ジ',   'ジュ', 'ジェ', 'ジョ'],
   K: ['カ',   'キ',   'ク',   'ケ',   'コ'  ],
   M: ['マ',   'ミ',   'ム',   'メ',   'モ'  ],
   N: ['ナ',   'ニ',   'ヌ',   'ネ',   'ノ'  ],
   P: ['パ',   'ピ',   'プ',   'ペ',   'ポ'  ],
   Q: ['クァ', 'クィ', 'ク',   'クェ', 'クォ'],
   R: ['ラ',   'リ',   'ル',   'レ',   'ロ'  ],
   S: ['サ',   'シ',   'ス',   'セ',   'ソ'  ],
   T: ['タ',   'チ',   'ツ',   'テ',   'ト'  ],
   V: ['ヴァ', 'ヴィ', 'ヴ',   'ヴェ', 'ヴォ'],
   W: ['ワ',   null,   null,   null,   null  ],
   Y: ['ヤ',   null,   'ユ',   null,   'ヨ'  ],
   Z: ['ザ',   'ジ',   'ズ',   'ゼ',   'ゾ'  ],

  CH: ['チャ', 'チ',   'チュ', 'チェ', 'チョ'],
  DH: ['デャ', 'ディ', 'デュ', 'デェ', 'デョ'],
  SH: ['シャ', 'シ',   'シュ', 'シェ', 'ショ'],
  TH: ['テャ', 'ティ', 'テュ', 'テェ', 'テョ'],
  WH: ['ウァ', 'ウィ', 'ウ',   'ウェ', 'ウォ'],
  TS: ['ツァ', 'ツィ', 'ツ',   'ツェ', 'ツォ'],

  KY: ['キャ', 'キィ', 'キュ', 'キェ', 'キョ'],
  SY: ['シャ', 'シ',   'シュ', 'シェ', 'ショ'],
  TY: ['チャ', 'チ',   'チュ', 'チェ', 'チョ'],
  NY: ['ニャ', 'ニィ', 'ニュ', 'ニェ', 'ニョ'],
  HY: ['ヒャ', 'ヒィ', 'ヒュ', 'ヒェ', 'ヒョ'],
  MY: ['ミャ', 'ミィ', 'ミュ', 'ミェ', 'ミョ'],
  RY: ['リャ', 'リィ', 'リュ', 'リェ', 'リョ'],
  GY: ['ギャ', 'ギィ', 'ギュ', 'ギェ', 'ギョ'],
  ZY: ['ジャ', 'ジ',   'ジュ', 'ジェ', 'ジョ'],
  DY: ['ヂャ', 'ヂィ', 'ヂュ', 'ヂェ', 'ヂョ'],
  BY: ['ビャ', 'ビィ', 'ビュ', 'ビェ', 'ビョ'],
  PY: ['ピャ', 'ピィ', 'ピュ', 'ピェ', 'ピョ'],

   L: ['ァ',   'ィ',   'ゥ',   'ェ',   'ォ'  ],
   X: ['ァ',   'ィ',   'ゥ',   'ェ',   'ォ'  ],
  LK: ['ヵ',   null,   null,   'ヶ',   null  ],
  XK: ['ヵ',   null,   null,   'ヶ',   null  ],
  LY: ['ャ',   'ィ',   'ュ',   'ェ',   'ョ'  ],
  XY: ['ャ',   'ィ',   'ュ',   'ェ',   'ョ'  ],
  LT: [null,   null,   'ッ',   null,   null  ],
  XT: [null,   null,   'ッ',   null,   null  ],
  LTS: [null,   null,   'ッ',   null,   null  ],
  XTS: [null,   null,   'ッ',   null,   null  ],
}
let vowel = ['A', 'I', 'U', 'E', 'O'];
let consonantRegExpList = 'BCDFGHJKLMNPQRSTVWXYZ'.split('').map(x => new RegExp(x + '{2,}', 'gi'))

let romajiMap = Object.fromEntries(Object.entries(map).flatMap(([consonant, list]) => {
  return list.map((letter, vowelIndex) => {
    if (letter) {
      return [consonant + vowel[vowelIndex], letter]
    } else {
      return null;
    }
  }).filter(x => x)
}))
romajiMap.NN = 'ン'
romajiMap.N = 'ン'
romajiMap['-'] = 'ー'

let convertList = Object.entries(romajiMap)
  .map(([romaji, letter]) => ({ romaji, letter, exp: new RegExp(romaji.toLowerCase(), 'g') }))
  .sort((a, b) => b.romaji.length - a.romaji.length)

function convertRomaji(romaji) {
  if (romaji == null) return '';

  for(let consonantRegExp of consonantRegExpList) {
    romaji = romaji.replace(consonantRegExp, (match) => 'ッ'.repeat(match.length - 1) + match[0])
  }
  for(let convert of convertList) {
    romaji = romaji.replace(convert.exp, convert.letter);
  }
  return romaji;
}

export default convertRomaji