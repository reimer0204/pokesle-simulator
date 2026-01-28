import type { SkillType } from "../type";
import { Food } from "./food_and_cooking";

/**
 * 効果量に幅があるものは平均の値を効果量として仮定
 * effectはスキルレベルの最大値としても参照しているので、設定不要でもnullの配列にする
 * genki: true にすると元気計算に使われる
 * team: true にすると厳選計算の2ステップ目に回される
 * metronome: false にするとゆびをふるから除外
 */
class Skill {
  static list: SkillType[] = [
    { name: 'エナジーチャージS' ,            effect: [400.0,  569.0,	 785.0,	1083.0,	1496.0,	2066.0,	3002.0], energyOnly: true },
    { name: 'エナジーチャージS(ランダム)',   effect: [500.0,  711.5,	 981.5,	1354.0,	1870.0,	2582.5,	3752.5], energyOnly: true },
    { name: 'たくわえる(エナジーチャージS)', effect: [587, 834, 1151, 1590, 2194, 3031, 4404], metronome: false, energyOnly: true },
    { name: 'エナジーチャージM',             effect: [800.0, 1251.0,	1726.0,	2383.0,	3290.0,	4546.0,	6409.0], energyOnly: true },
    {
      name: 'ナイトメア(エナジーチャージM)',
      effect: [
        { energy:  2640, other: -12 },
        { energy:  3753, other: -12 },
        { energy:  5178, other: -12 },
        { energy:  7149, other: -12 },
        { energy:  9870, other: -12 },
        { energy: 13638, other: -12 },
        { energy: 17304, other: -12 },
      ],
      metronome: false,
      genki: true,
    },
    {
      name: 'きのみバースト',    
      effect: [
        { self: 11, other: 1 },
        { self: 14, other: 2 },
        { self: 21, other: 2 },
        { self: 24, other: 3 },
        { self: 27, other: 4 },
        { self: 30, other: 5 },
      ],
      team: true,
      energyOnly: true,
    },
    {
      name: 'ばけのかわ(きのみバースト)',    
      effect: [
        { self: 8,  other: 1 },
        { self: 10, other: 2 },
        { self: 15, other: 2 },
        { self: 17, other: 3 },
        { self: 19, other: 4 },
        { self: 21, other: 5 },
      ],
      team: true,
      success: 0.2,
      energyOnly: true,
    },
    {
      name: 'げんきチャージS',
      effect: [12.0, 16.2, 21.2, 26.6, 33.6, 43.4].map(x => ({ self: x })),
      genki: true,
    },
    {
      name: 'つきのひかり(げんきチャージS)',
      effect: [
        { self: 12.0, other: 6.3 },
        { self: 16.2, other: 7.7 },
        { self: 21.2, other: 10.1 },
        { self: 26.6, other: 13.0 },
        { self: 33.6, other: 17.2 },
        { self: 43.4, other: 22.8 },
      ].map(x => ({ self: x.self, other: x.other * 0.5 / 5 })), // 大成功は50%、1匹だけなので/5
      genki: true,
      team: true,
    },
    {
      name: 'げんきエールS',
      effect: [12, 15, 20, 25, 33, 44].map(x => ({ other: x / 5 })),
      team: true,
      genki: true,
    },
    {
      name: 'ほっぺすりすり(げんきエールS)',
      effect: [9, 12, 16, 20, 27, 35].map(x => ({ other: x / 5 })),
      team: true,
      genki: true,
    },
    {
      name: 'げんきオールS',
      effect: [5.0, 7.0,	9.0,	11.4,	15.0, 18.1].map(x => ({ other: x })),
      team: true,
      genki: true,
    },
    {
      name: 'みかづきのいのり(げんきオールS)',
      effect: [
        { team: [{ self:  5, other: 1 }, { self:  7, other: 1 }, { self:  9, other: 1 }, { self: 12, other: 1 }, { self: 14, other: 2 }], other:  3.0 }, 
        { team: [{ self:  9, other: 1 }, { self: 12, other: 1 }, { self: 15, other: 1 }, { self: 16, other: 2 }, { self: 19, other: 3 }], other:  4.0 }, 
        { team: [{ self: 13, other: 1 }, { self: 17, other: 1 }, { self: 18, other: 2 }, { self: 20, other: 3 }, { self: 24, other: 4 }], other:  5.0 }, 
        { team: [{ self: 17, other: 1 }, { self: 19, other: 2 }, { self: 25, other: 2 }, { self: 28, other: 3 }, { self: 29, other: 5 }], other:  7.0 }, 
        { team: [{ self: 21, other: 1 }, { self: 24, other: 2 }, { self: 27, other: 3 }, { self: 28, other: 5 }, { self: 30, other: 7 }], other:  9.0 }, 
        { team: [{ self: 25, other: 1 }, { self: 29, other: 2 }, { self: 30, other: 4 }, { self: 31, other: 6 }, { self: 32, other: 9 }], other: 11.0 }, 
      ],
      team: true,
      genki: true,
    },
    {
      name: 'きのみジュース(げんきオールS)',
      effect: [5.0, 7.0,	9.0,	11.4,	15.0, 18.1].map(x => ({ other: x })),
      team: true,
      genki: true,
    },
    { name: '食材ゲットS',                   effect: [  6.0,    8.0,	  11.0,	  14.0,	  17.0,   21.0,   24.0] },
    {
      name: 'プラス(食材ゲットS)',
      effect: [
        { main:  5, sub:  6 },
        { main:  7, sub:  7 },
        { main:  9, sub:  8 },
        { main: 11, sub:  9 },
        { main: 13, sub: 10 },
        { main: 16, sub: 11 },
        { main: 18, sub: 12 },
      ],
    },
    { name: 'プレゼント(食材ゲットS)', effect: [4.0, 6.0, 8.0, 10.0, 12.0, 15.0, 17.0] },
    {
      name: '食材セレクトS',
      effect: [
        { food:  5 }, // 15%で仮定
        { food:  6 },
        { food:  8 },
        { food: 11 },
        { food: 13 },
        { food: 16 },
        { food: 18 },
      ],
      metronome: false,
      // 2026/1/28時点ではスキルコピーでも本人のではなく下記食材で固定
      foodList: ['つやつやアボカド', 'ほっこりポテト', 'ピュアなオイル'].map(x => Food.map[x]),
    },
    {
      name: 'きょううん(食材セレクトS)',
      effect: [
        { food:  5 * 0.84, shard:  500 * 2 * 0.16 }, // 少ない方:多い方(5倍)が3:1っぽいので(1 * 75% + 5 * 25%) = 2
        { food:  6 * 0.84, shard:  720 * 2 * 0.16 },
        { food:  8 * 0.84, shard: 1030 * 2 * 0.16 },
        { food: 11 * 0.84, shard: 1440 * 2 * 0.16 },
        { food: 13 * 0.84, shard: 2000 * 2 * 0.16 },
        { food: 16 * 0.84, shard: 2800 * 2 * 0.16 },
        { food: 18 * 0.84, shard: 4000 * 2 * 0.16 },
      ],
      foodList: ['あじわいキノコ', 'マメミート', 'ワカクサ大豆', 'めざましコーヒー'].map(x => Food.map[x]),
    },
    {
      name: 'かいりきバサミ(食材セレクトS)',
      effect: [
        { food:  5 * 1.15 }, // 15%で仮定
        { food:  6 * 1.15 },
        { food:  8 * 1.15 },
        { food: 11 * 1.15 },
        { food: 13 * 1.15 },
        { food: 16 * 1.15 },
        { food: 18 * 1.15 },
      ],
      foodList: ['あじわいキノコ', 'マメミート', 'ワカクサ大豆', 'めざましコーヒー'].map(x => Food.map[x]),
    },
    {
      name: 'おてつだいサポートS',
      effect: [
         6.0,
         7.0,
         8.0,
         9.0,
        10.0,
        11.0,
        12.0,
      ], team: true },
    {
      name: 'おてつだいブースト',
      effect: [
        { fix: 2, team: [0, 0, 1, 2, 4], max: 6 }, 
        { fix: 3, team: [0, 0, 1, 2, 4], max: 7 }, 
        { fix: 3, team: [0, 0, 2, 3, 5], max: 8 }, 
        { fix: 4, team: [0, 0, 2, 3, 5], max: 9 }, 
        { fix: 4, team: [0, 1, 3, 4, 6], max: 10 }, 
        { fix: 5, team: [0, 1, 3, 4, 6], max: 11 }, 
      ],
      team: true,
    },
    { name: '料理パワーアップS',             effect: [  7.0,   10.0,	  12.0,	  17.0,	  22.0,   27.0,   31.0] },
    {
      name: 'マイナス(料理パワーアップS)',
      effect: [
        { main:  5, other:  8 / 5 },
        { main:  7, other: 10 / 5 },
        { main:  9, other: 13 / 5 },
        { main: 12, other: 17 / 5 },
        { main: 16, other: 23 / 5 },
        { main: 20, other: 30 / 5 },
        { main: 24, other: 35 / 5 },
      ],
      team: true,
      genki: true,
    },
    { name: '料理チャンスS',                 effect: [  4.0,    5.0,    6.0,	   7.0,	   8.0,	  10.0] },
    { name: 'ゆめのかけらゲットS',           effect: [240.0,  340.0,	 480.0,	 670.0,	 920.0,	1260.0,	1800.0, 2500.0], shard: true },
    { name: 'ゆめのかけらゲットS(ランダム)', effect: [300.0,  425.0,	 600.0,	 837.5,	1150.0,	1575.0,	2250.0, 2875.0], shard: true },
    { name: 'へんしん(スキルコピー)',        effect: [ null,   null,    null,   null,   null,   null, null], metronome: false },
    { name: 'ものまね(スキルコピー)',        effect: [ null,   null,    null,   null,   null,   null, null], metronome: false },
    { name: 'ゆびをふる',                    effect: [ null,   null,    null,   null,   null,   null, null], team: true, },
  ];
  static map: { [key: string]: SkillType } = Skill.list.reduce((a: { [key: string]: SkillType }, x) => (a[x.name] = x, a), {});;
  static metronomeTarget = Skill.list.filter(x => x.name != 'ゆびをふる' && x.metronome !== false);
  static metronomeWeightList = Skill.metronomeTarget.map(x => ({ skill: x, weight: 1 / Skill.metronomeTarget.length}));
  static metronomeNonTeamTarget = Skill.metronomeTarget.filter(x => !x.team);
  static metronomeTeamTarget = Skill.metronomeTarget.filter(x => x.team);
  static genkiSkillList = Skill.list.filter(x => x.genki);
}

Skill.map['へんしん(スキルコピー)'].evaluateEnergy = Skill.map['へんしん(スキルコピー)'].effect.map((_, i): number => Skill.map['エナジーチャージM'].effect[i])
Skill.map['ものまね(スキルコピー)'].evaluateEnergy = Skill.map['ものまね(スキルコピー)'].effect.map((_, i): number => Skill.map['エナジーチャージM'].effect[i])
Skill.map['ほっぺすりすり(げんきエールS)'].evaluateEnergy = Skill.map['ほっぺすりすり(げんきエールS)'].effect.map((_, i): number => Math.round(Skill.map['エナジーチャージM'].effect.at(-1) * (1 - (1 - 0.15) ** (i + 1))))

export default Skill;