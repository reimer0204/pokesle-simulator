import belueberry from '../img/berry/belueberry.png'
import blukberry from '../img/berry/blukberry.png'
import cheriberry from '../img/berry/cheriberry.png'
import chestoberry from '../img/berry/chestoberry.png'
import durinberry from '../img/berry/durinberry.png'
import figyberry from '../img/berry/figyberry.png'
import grepaberry from '../img/berry/grepaberry.png'
import leppaberry from '../img/berry/leppaberry.png'
import lumberry from '../img/berry/lumberry.png'
import magoberry from '../img/berry/magoberry.png'
import oranberry from '../img/berry/oranberry.png'
import pamtreberry from '../img/berry/pamtreberry.png'
import pechaberry from '../img/berry/pechaberry.png'
import persimberry from '../img/berry/persimberry.png'
import rawstberry from '../img/berry/rawstberry.png'
import sitrusberry from '../img/berry/sitrusberry.png'
import wikiberry from '../img/berry/wikiberry.png'
import yacheberry from '../img/berry/yacheberry.png'

const list = [
  { name: 'シーヤ', energy: 24, type: 'ひこう',     img: pamtreberry },
  { name: 'ラム',   energy: 24, type: 'むし',       img: lumberry },
  { name: 'ウブ',   energy: 25, type: 'でんき',     img: grepaberry },
  { name: 'ブリー', energy: 26, type: 'ゴースト',   img: blukberry },
  { name: 'マゴ',   energy: 26, type: 'エスパー',   img: magoberry },
  { name: 'モモン', energy: 26, type: 'フェアリー', img: pechaberry },
  { name: 'クラボ', energy: 27, type: 'かくとう',   img: cheriberry },
  { name: 'ヒメリ', energy: 27, type: 'ほのお',     img: leppaberry },
  { name: 'キー',   energy: 28, type: 'ノーマル',   img: persimberry },
  { name: 'フィラ', energy: 29, type: 'じめん',     img: figyberry },
  { name: 'オボン', energy: 30, type: 'いわ',       img: sitrusberry },
  { name: 'ドリ',   energy: 30, type: 'くさ',       img: durinberry },
  { name: 'ウイ',   energy: 31, type: 'あく',       img: wikiberry },
  { name: 'オレン', energy: 31, type: 'みず',       img: oranberry },
  { name: 'カゴ',   energy: 32, type: 'どく',       img: chestoberry },
  { name: 'チーゴ', energy: 32, type: 'こおり',     img: rawstberry },
  { name: 'ベリブ', energy: 33, type: 'はがね',     img: belueberry },
  { name: 'ヤチェ', energy: 35, type: 'ドラゴン',   img: yacheberry },
];

class Berry {
  static list = [];
  static map = {};
}

Berry.list = list;
Berry.map = list.reduce((a, x) => (a[x.name] = x, a), {});

export default Berry