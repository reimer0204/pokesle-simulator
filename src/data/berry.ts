import type { BerryType } from '@/type'
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

class Berry {
  static list: BerryType[] = [
    { name: 'シーヤ', energy: 24, type: 'ひこう',     img: pamtreberry, typeColor: '#acdbfd'},
    { name: 'ラム',   energy: 24, type: 'むし',       img: lumberry,    typeColor: '#c4c947'},
    { name: 'ウブ',   energy: 25, type: 'でんき',     img: grepaberry,  typeColor: '#fde222'},
    { name: 'ブリー', energy: 26, type: 'ゴースト',   img: blukberry,   typeColor: '#9f71a2'},
    { name: 'マゴ',   energy: 26, type: 'エスパー',   img: magoberry,   typeColor: '#fd819d'},
    { name: 'モモン', energy: 26, type: 'フェアリー', img: pechaberry,  typeColor: '#fdc1fd'},
    { name: 'クラボ', energy: 27, type: 'かくとう',   img: cheriberry,  typeColor: '#fdb024'},
    { name: 'ヒメリ', energy: 27, type: 'ほのお',     img: leppaberry,  typeColor: '#fd8a51'},
    { name: 'キー',   energy: 28, type: 'ノーマル',   img: persimberry, typeColor: '#c2c4c3'},
    { name: 'フィラ', energy: 29, type: 'じめん',     img: figyberry,   typeColor: '#d9a35f'},
    { name: 'オボン', energy: 30, type: 'いわ',       img: sitrusberry, typeColor: '#c7c49b'},
    { name: 'ドリ',   energy: 30, type: 'くさ',       img: durinberry,  typeColor: '#63df46'},
    { name: 'ウイ',   energy: 31, type: 'あく',       img: wikiberry,   typeColor: '#827878'},
    { name: 'オレン', energy: 31, type: 'みず',       img: oranberry,   typeColor: '#4dbafd'},
    { name: 'カゴ',   energy: 32, type: 'どく',       img: chestoberry, typeColor: '#ba6ff0'},
    { name: 'チーゴ', energy: 32, type: 'こおり',     img: rawstberry,  typeColor: '#5de2fd'},
    { name: 'ベリブ', energy: 33, type: 'はがね',     img: belueberry,  typeColor: '#88c8eb'},
    { name: 'ヤチェ', energy: 35, type: 'ドラゴン',   img: yacheberry,  typeColor: '#7683f8'},
  ];
  static map: { [key: string]: BerryType } = this.list.reduce((a: { [key: string]: BerryType }, x) => (a[x.name] = x, a), {});
  static typeList: BerryType[] = [];
}
Berry.typeList = [
  'ノーマル', 'ほのお', 'みず', 'でんき', 'くさ', 'こおり',
  'かくとう', 'どく', 'じめん', 'ひこう', 'エスパー', 'むし',
  'いわ', 'ゴースト', 'ドラゴン', 'あく', 'はがね', 'フェアリー'
].map(t => Berry.list.find(x => x.type == t)!)

export default Berry