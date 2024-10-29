/**
 * 効果量に幅があるものは平均の値を効果量として仮定
 */

const list = [
  { name: 'エナジーチャージS' ,            effect: [400.0,  569.0,	 785.0,	1083.0,	1496.0,	2066.0,	3002.0] },
  { name: 'エナジーチャージS(ランダム)',   effect: [500.0,  711.5,	 981.5,	1354.0,	1870.0,	2582.5,	3752.5] },
  { name: 'エナジーチャージM',             effect: [800.0, 1251.0,	1726.0,	2383.0,	3290.0,	4546.0,	6409.0] },
  { name: 'ばけのかわ(きのみバースト)',    effect: [    8,     10,	    15,	    17,	    19,	    21], team: true, metronome: false },
  { name: 'げんきチャージS',               effect: [ 12.0,   16.0,	  21.0,	  27.0,	  34.0,   43.0] },
  { name: 'げんきエールS',                 effect: [ 14.0,   17.0,	  23.0,	  29.0,	  38.0,   51.0], team: true },
  { name: 'げんきオールS',                 effect: [  5.0,    7.0,	   9.0,	  11.0,	  15.0,   18.0], team: true },
  { name: '食材ゲットS',                   effect: [  6.0,    8.0,	  11.0,	  14.0,	  17.0,   21.0,   24.0] },
  { name: 'おてつだいサポートS',           effect: [  5.0,    6.0,	   7.0,	   8.0,	   9.0,   10.0,   11.0], team: true },
  { name: 'おてつだいブースト',            effect: [  6.0,    7.0,    8.0,	   9.0,	  10.0,	  11.0], team: true },
  { name: '料理パワーアップS',             effect: [  7.0,   10.0,	  12.0,	  17.0,	  22.0,   27.0,   31.0] },
  { name: '料理チャンスS',                 effect: [  4.0,    5.0,    6.0,	   7.0,	   8.0,	  10.0] },
  { name: 'ゆめのかけらゲットS',           effect: [240.0,  340.0,	 480.0,	 670.0,	 920.0,	1260.0,	1800.0], shard: true },
  { name: 'ゆめのかけらゲットS(ランダム)', effect: [300.0,  425.0,	 600.0,	 837.5,	1150.0,	1575.0,	2250.0], shard: true },
  { name: 'ゆびをふる',                    effect: [ null,   null,    null,   null,   null,   null], team: true, },
]

class Skill {
  static list = [];
  static map = {};
}
Skill.list = list;
Skill.map = list.reduce((a, x) => (a[x.name] = x, a), {});
Skill.metronomeTarget = Skill.list.filter(x => x.name != 'ゆびをふる' && x.metronome !== false);
Skill.metronomeNonTeamTarget = Skill.metronomeTarget.filter(x => !x.team);
Skill.metronomeTeamTarget = Skill.metronomeTarget.filter(x => x.team);

export default Skill;