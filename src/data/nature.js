const list = [
  { name: 'さみしがり', good: '手伝いスピード',       weak: 'げんき回復量',         goodShort: '手', weakShort: '元'},
  { name: 'いじっぱり', good: '手伝いスピード',       weak: '食材お手伝い確率',     goodShort: '手', weakShort: '食'},
  { name: 'やんちゃ',   good: '手伝いスピード',       weak: 'メインスキル発生確率', goodShort: '手', weakShort: 'ス'},
  { name: 'ゆうかん',   good: '手伝いスピード',       weak: 'EXP獲得量',            goodShort: '手', weakShort: 'EX'},
  { name: 'ずぶとい',   good: 'げんき回復量',         weak: '手伝いスピード',       goodShort: '元', weakShort: '手'},
  { name: 'わんぱく',   good: 'げんき回復量',         weak: '食材お手伝い確率',     goodShort: '元', weakShort: '食'},
  { name: 'のうてんき', good: 'げんき回復量',         weak: 'メインスキル発生確率', goodShort: '元', weakShort: 'ス'},
  { name: 'のんき',     good: 'げんき回復量',         weak: 'EXP獲得量',            goodShort: '元', weakShort: 'EX'},
  { name: 'ひかえめ',   good: '食材お手伝い確率',     weak: '手伝いスピード',       goodShort: '食', weakShort: '手'},
  { name: 'おっとり',   good: '食材お手伝い確率',     weak: 'げんき回復量',         goodShort: '食', weakShort: '元'},
  { name: 'うっかりや', good: '食材お手伝い確率',     weak: 'メインスキル発生確率', goodShort: '食', weakShort: 'ス'},
  { name: 'れいせい',   good: '食材お手伝い確率',     weak: 'EXP獲得量',            goodShort: '食', weakShort: 'EX'},
  { name: 'おだやか',   good: 'メインスキル発生確率', weak: '手伝いスピード',       goodShort: 'ス', weakShort: '手'},
  { name: 'おとなしい', good: 'メインスキル発生確率', weak: 'げんき回復量',         goodShort: 'ス', weakShort: '元'},
  { name: 'しんちょう', good: 'メインスキル発生確率', weak: '食材お手伝い確率',     goodShort: 'ス', weakShort: '食'},
  { name: 'なまいき',   good: 'メインスキル発生確率', weak: 'EXP獲得量',            goodShort: 'ス', weakShort: 'EX'},
  { name: 'おくびょう', good: 'EXP獲得量',            weak: '手伝いスピード',       goodShort: 'EX', weakShort: '手'},
  { name: 'せっかち',   good: 'EXP獲得量',            weak: 'げんき回復量',         goodShort: 'EX', weakShort: '元'},
  { name: 'ようき',     good: 'EXP獲得量',            weak: '食材お手伝い確率',     goodShort: 'EX', weakShort: '食'},
  { name: 'むじゃき',   good: 'EXP獲得量',            weak: 'メインスキル発生確率', goodShort: 'EX', weakShort: 'ス'},
  { name: 'てれや', },
  { name: 'がんばりや', },
  { name: 'すなお', },
  { name: 'きまぐれ', },
  { name: 'まじめ', },
]

class Nature {
  static list = [];
  static map = {};
}
Nature.list = list;
Nature.map = list.reduce((a, x) => (a[x.name] = x, a), {});

export default Nature;