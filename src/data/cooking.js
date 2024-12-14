const list = [
	{ type: 'カレー', name: 'ごちゃまぜカレー', rate: 1, foodList: [] },
	{
		type: 'カレー', name: 'とくせんリンゴカレー', rate: 1.06, foodList: [
			{ name: 'とくせんリンゴ', num: 7 },]
	},
	{
		type: 'カレー', name: 'たんじゅんホワイトシチュー', rate: 1.06, foodList: [
			{ name: 'モーモーミルク', num: 7 },]
	},
	{
		type: 'カレー', name: 'ベイビィハニーカレー', rate: 1.06, foodList: [
			{ name: 'あまいミツ', num: 7 },]
	},
	{
		type: 'カレー', name: 'マメバーグカレー', rate: 1.06, foodList: [
			{ name: 'マメミート', num: 7 },]
	},
	{
		type: 'カレー', name: '満腹チーズバーグカレー', rate: 1.11, foodList: [
			{ name: 'モーモーミルク', num: 8 },
			{ name: 'マメミート', num: 8 },]
	},
	{
		type: 'カレー', name: 'ひでりカツカレー', rate: 1.11, foodList: [
			{ name: 'マメミート', num: 10 },
			{ name: 'ピュアなオイル', num: 5 },]
	},
	{
		type: 'カレー', name: 'サンパワートマトカレー', rate: 1.11, foodList: [
			{ name: 'げきからハーブ', num: 5 },
			{ name: 'あんみんトマト', num: 10 },]
	},
	{
		type: 'カレー', name: 'とけるオムカレー', rate: 1.11, foodList: [
			{ name: 'とくせんエッグ', num: 10 },
			{ name: 'あんみんトマト', num: 6 },]
	},
	{
		type: 'カレー', name: 'ほっこりホワイトシチュー', rate: 1.17, foodList: [
			{ name: 'モーモーミルク', num: 10 },
			{ name: 'ほっこりポテト', num: 8 },
			{ name: 'あじわいキノコ', num: 4 },]
	},
	{
		type: 'カレー', name: 'ビルドアップマメカレー', rate: 1.17, foodList: [
			{ name: 'ワカクサ大豆', num: 12 },
			{ name: 'マメミート', num: 6 },
			{ name: 'とくせんエッグ', num: 4 },
			{ name: 'げきからハーブ', num: 4 },]
	},
	{
		type: 'カレー', name: 'キノコのほうしカレー', rate: 1.17, foodList: [
			{ name: 'あじわいキノコ', num: 14 },
			{ name: 'ほっこりポテト', num: 9 },]
	},
	{
		type: 'カレー', name: 'おやこあいカレー', rate: 1.25, foodList: [
			{ name: 'あまいミツ', num: 12 },
			{ name: 'とくせんエッグ', num: 8 },
			{ name: 'とくせんリンゴ', num: 11 },
			{ name: 'ほっこりポテト', num: 4 },]
	},
	{
		type: 'カレー', name: 'からくちネギもりカレー', rate: 1.25, foodList: [
			{ name: 'ふといながねぎ', num: 14 },
			{ name: 'あったかジンジャー', num: 10 },
			{ name: 'げきからハーブ', num: 8 },]
	},
	{
		type: 'カレー', name: 'ニンジャカレー', rate: 1.48, foodList: [
			{ name: 'ワカクサ大豆', num: 24 },
			{ name: 'ふといながねぎ', num: 12 },
			{ name: 'マメミート', num: 9 },
			{ name: 'あじわいキノコ', num: 5 },]
	},
	{
		type: 'カレー', name: 'あぶりテールカレー', rate: 1.25, foodList: [
			{ name: 'おいしいシッポ', num: 8 },
			{ name: 'げきからハーブ', num: 25 },]
	},
	{
		type: 'カレー', name: 'じゅうなんコーンシチュー', rate: 1.25, foodList: [
			{ name: 'ワカクサコーン', num: 14 },
			{ name: 'モーモーミルク', num: 8 },
			{ name: 'ほっこりポテト', num: 8 },]
	},
	{
		type: 'カレー', name: 'ぜったいねむりバターカレー', rate: 1.35, foodList: [
			{ name: 'リラックスカカオ', num: 12 },
			{ name: 'モーモーミルク', num: 10 },
			{ name: 'ほっこりポテト', num: 18 },
			{ name: 'あんみんトマト', num: 15 },]
	},
	{
		type: 'カレー', name: 'れんごくコーンキーマカレー', rate: 1.48, foodList: [
			{ name: 'げきからハーブ', num: 27 },
			{ name: 'マメミート', num: 24 },
			{ name: 'ワカクサコーン', num: 14 },
			{ name: 'あったかジンジャー', num: 12 },]
	},
	{
		type: 'カレー', name: 'めざめるパワーシチュー', rate: 1.61, foodList: [
			{ name: 'ワカクサ大豆', num: 28 },
			{ name: 'あんみんトマト', num: 25 },
			{ name: 'あじわいキノコ', num: 23 },
			{ name: 'めざましコーヒー', num: 16 },]
	},
	{
		type: 'カレー', name: 'ピヨピヨパンチ辛口カレー', rate: 1.35, foodList: [
			{ name: 'げきからハーブ', num: 11 },
			{ name: 'あまいミツ', num: 11 },
			{ name: 'めざましコーヒー', num: 11 },
		]
	},

	{ type: 'サラダ', name: 'ごちゃまぜサラダ', rate: 1, foodList: [] },
	{
		type: 'サラダ', name: 'とくせんリンゴサラダ', rate: 1.06, foodList: [
			{ name: 'とくせんリンゴ', num: 8 },]
	},
	{
		type: 'サラダ', name: 'マメハムサラダ', rate: 1.06, foodList: [
			{ name: 'マメミート', num: 8 },]
	},
	{
		type: 'サラダ', name: 'あんみんトマトサラダ', rate: 1.06, foodList: [
			{ name: 'あんみんトマト', num: 8 },]
	},
	{
		type: 'サラダ', name: 'ゆきかきシーザーサラダ', rate: 1.11, foodList: [
			{ name: 'モーモーミルク', num: 10 },
			{ name: 'マメミート', num: 6 },]
	},
	{
		type: 'サラダ', name: 'うるおいとうふサラダ', rate: 1.25, foodList: [
			{ name: 'ワカクサ大豆', num: 15 },
			{ name: 'あんみんトマト', num: 9 },]
	},
	{
		type: 'サラダ', name: 'ねっぷうとうふサラダ', rate: 1.11, foodList: [
			{ name: 'ワカクサ大豆', num: 10 },
			{ name: 'げきからハーブ', num: 6 },]
	},
	{
		type: 'サラダ', name: 'めんえきねぎサラダ', rate: 1.11, foodList: [
			{ name: 'あったかジンジャー', num: 5 },
			{ name: 'ふといながねぎ', num: 10 },]
	},
	{
		type: 'サラダ', name: 'メロメロりんごのチーズサラダ', rate: 1.17, foodList: [
			{ name: 'モーモーミルク', num: 5 },
			{ name: 'ピュアなオイル', num: 3 },
			{ name: 'とくせんリンゴ', num: 15 },]
	},
	{
		type: 'サラダ', name: 'モーモーカプレーゼ', rate: 1.17, foodList: [
			{ name: 'モーモーミルク', num: 12 },
			{ name: 'ピュアなオイル', num: 5 },
			{ name: 'あんみんトマト', num: 6 },]
	},
	{
		type: 'サラダ', name: 'ばかぢからワイルドサラダ', rate: 1.17, foodList: [
			{ name: 'マメミート', num: 9 },
			{ name: 'あったかジンジャー', num: 6 },
			{ name: 'とくせんエッグ', num: 5 },
			{ name: 'ほっこりポテト', num: 3 },]
	},
	{
		type: 'サラダ', name: 'ムラっけチョコミートサラダ', rate: 1.17, foodList: [
			{ name: 'リラックスカカオ', num: 14 },
			{ name: 'マメミート', num: 9 },]
	},
	{
		type: 'サラダ', name: 'くいしんぼうポテトサラダ', rate: 1.25, foodList: [
			{ name: 'ほっこりポテト', num: 14 },
			{ name: 'とくせんエッグ', num: 9 },
			{ name: 'マメミート', num: 7 },
			{ name: 'とくせんリンゴ', num: 6 },]
	},
	{
		type: 'サラダ', name: 'オーバーヒートサラダ', rate: 1.25, foodList: [
			{ name: 'げきからハーブ', num: 17 },
			{ name: 'あんみんトマト', num: 8 },
			{ name: 'あったかジンジャー', num: 10 },]
	},
	{
		type: 'サラダ', name: 'キノコのほうしサラダ', rate: 1.25, foodList: [
			{ name: 'あじわいキノコ', num: 17 },
			{ name: 'ピュアなオイル', num: 8 },
			{ name: 'あんみんトマト', num: 8 },]
	},
	{
		type: 'サラダ', name: 'ヤドンテールのペッパーサラダ', rate: 1.25, foodList: [
			{ name: 'げきからハーブ', num: 10 },
			{ name: 'ピュアなオイル', num: 15 },
			{ name: 'おいしいシッポ', num: 10 },]
	},
	{
		type: 'サラダ', name: 'みだれづきコーンサラダ', rate: 1.25, foodList: [
			{ name: 'ワカクサコーン', num: 9 },
			{ name: 'ピュアなオイル', num: 8 },]
	},
	{
		type: 'サラダ', name: 'ニンジャサラダ', rate: 1.48, foodList: [
			{ name: 'あったかジンジャー', num: 11 },
			{ name: 'ワカクサ大豆', num: 19 },
			{ name: 'あじわいキノコ', num: 12 },
			{ name: 'ふといながねぎ', num: 15 },]
	},
	{
		type: 'サラダ', name: 'めいそうスイートサラダ', rate: 1.48, foodList: [
			{ name: 'とくせんリンゴ', num: 21 },
			{ name: 'あまいミツ', num: 16 },
			{ name: 'ワカクサコーン', num: 12 },]
	},
	{
		type: 'サラダ', name: 'ワカクササラダ', rate: 1.48, foodList: [
			{ name: 'ピュアなオイル', num: 22 },
			{ name: 'ワカクサコーン', num: 17 },
			{ name: 'あんみんトマト', num: 14 },
			{ name: 'ほっこりポテト', num: 9 },]
	},
	{
		type: 'サラダ', name: 'まけんきコーヒーサラダ', rate: 1.61, foodList: [
			{ name: 'マメミート', num: 28 },
			{ name: 'ほっこりポテト', num: 22 },
			{ name: 'ピュアなオイル', num: 22 },
			{ name: 'めざましコーヒー', num: 28 },]
	},
	{
		type: 'サラダ', name: 'クロスチョップドサラダ', rate: 1.35, foodList: [
			{ name: 'マメミート', num: 15 },
			{ name: 'とくせんエッグ', num: 20 },
			{ name: 'あんみんトマト', num: 10 },
			{ name: 'ワカクサコーン', num: 11 },]
	},


	{ type: 'デザート', name: 'ごちゃまぜドリンク', rate: 1, foodList: [] },
	{
		type: 'デザート', name: 'とくせんリンゴジュース', rate: 1.06, foodList: [
			{ name: 'とくせんリンゴ', num: 8 },]
	},
	{
		type: 'デザート', name: 'モーモーホットミルク', rate: 1.06, foodList: [
			{ name: 'モーモーミルク', num: 7 },]
	},
	{
		type: 'デザート', name: 'クラフトサイコソーダ', rate: 1.06, foodList: [
			{ name: 'あまいミツ', num: 9 },]
	},
	{
		type: 'デザート', name: 'ねがいごとアップルパイ', rate: 1.11, foodList: [
			{ name: 'モーモーミルク', num: 4 },
			{ name: 'とくせんリンゴ', num: 12 },]
	},
	{
		type: 'デザート', name: 'じゅくせいスイートポテト', rate: 1.11, foodList: [
			{ name: 'モーモーミルク', num: 5 },
			{ name: 'ほっこりポテト', num: 9 },]
	},
	{
		type: 'デザート', name: 'ひのこジンジャーティー', rate: 1.11, foodList: [
			{ name: 'とくせんリンゴ', num: 7 },
			{ name: 'あったかジンジャー', num: 9 },]
	},
	{
		type: 'デザート', name: 'マイペースやさいジュース', rate: 1.11, foodList: [
			{ name: 'とくせんリンゴ', num: 7 },
			{ name: 'あんみんトマト', num: 9 },]
	},
	{
		type: 'デザート', name: 'かるわざソイケーキ', rate: 1.11, foodList: [
			{ name: 'ワカクサ大豆', num: 7 },
			{ name: 'とくせんエッグ', num: 8 },]
	},
	{
		type: 'デザート', name: 'はりきりプロテインスムージー', rate: 1.17, foodList: [
			{ name: 'ワカクサ大豆', num: 15 },
			{ name: 'リラックスカカオ', num: 8 },]
	},
	{
		type: 'デザート', name: 'ちからもちソイドーナッツ', rate: 1.35, foodList: [
			{ name: 'ワカクサ大豆', num: 16 },
			{ name: 'リラックスカカオ', num: 7 },
			{ name: 'ピュアなオイル', num: 12 },]
	},
	{
		type: 'デザート', name: 'あまいかおりチョコケーキ', rate: 1.17, foodList: [
			{ name: 'リラックスカカオ', num: 8 },
			{ name: 'モーモーミルク', num: 7 },
			{ name: 'あまいミツ', num: 9 },]
	},
	{
		type: 'デザート', name: 'おおきいマラサダ', rate: 1.17, foodList: [
			{ name: 'モーモーミルク', num: 7 },
			{ name: 'ピュアなオイル', num: 10 },
			{ name: 'あまいミツ', num: 6 },]
	},
	{
		type: 'デザート', name: 'あくまのキッスフルーツオレ', rate: 1.25, foodList: [
			{ name: 'リラックスカカオ', num: 8 },
			{ name: 'モーモーミルク', num: 9 },
			{ name: 'とくせんリンゴ', num: 11 },
			{ name: 'あまいミツ', num: 7 },]
	},
	{
		type: 'デザート', name: 'ふくつのジンジャークッキー', rate: 1.25, foodList: [
			{ name: 'リラックスカカオ', num: 5 },
			{ name: 'とくせんエッグ', num: 4 },
			{ name: 'あまいミツ', num: 14 },
			{ name: 'あったかジンジャー', num: 12 },]
	},
	{
		type: 'デザート', name: 'ネロリのデトックスティー', rate: 1.25, foodList: [
			{ name: 'とくせんリンゴ', num: 15 },
			{ name: 'あったかジンジャー', num: 11 },
			{ name: 'あじわいキノコ', num: 9 },]
	},
	{
		type: 'デザート', name: 'はなびらのまいチョコタルト', rate: 1.25, foodList: [
			{ name: 'リラックスカカオ', num: 11 },
			{ name: 'とくせんリンゴ', num: 11 },]
	},
	{
		type: 'デザート', name: 'プリンのプリンアラモード', rate: 1.35, foodList: [
			{ name: 'モーモーミルク', num: 10 },
			{ name: 'とくせんリンゴ', num: 10 },
			{ name: 'とくせんエッグ', num: 15 },
			{ name: 'あまいミツ', num: 20 },]
	},
	{
		type: 'デザート', name: 'だいばくはつポップコーン', rate: 1.35, foodList: [
			{ name: 'ワカクサコーン', num: 15 },
			{ name: 'ピュアなオイル', num: 14 },
			{ name: 'モーモーミルク', num: 7 },]
	},
	{
		type: 'デザート', name: 'おちゃかいコーンスコーン', rate: 1.48, foodList: [
			{ name: 'とくせんリンゴ', num: 20 },
			{ name: 'あったかジンジャー', num: 20 },
			{ name: 'ワカクサコーン', num: 18 },
			{ name: 'モーモーミルク', num: 9 },]
	},
	{
		type: 'デザート', name: 'フラワーギフトマカロン', rate: 1.48, foodList: [
			{ name: 'リラックスカカオ', num: 25 },
			{ name: 'とくせんエッグ', num: 25 },
			{ name: 'あまいミツ', num: 17 },
			{ name: 'モーモーミルク', num: 10 },]
	},
	{
		type: 'デザート', name: 'スパークスパイスコーラ', rate: 1.61, foodList: [
			{ name: 'ふといながねぎ', num: 20 },
			{ name: 'とくせんリンゴ', num: 35 },
			{ name: 'あったかジンジャー', num: 20 },
			{ name: 'めざましコーヒー', num: 12 },]
	},
	{
		type: 'デザート', name: 'はやおきコーヒーゼリー', rate: 1.35, foodList: [
			{ name: 'モーモーミルク', num: 14 },
			{ name: 'あまいミツ', num: 12 },
			{ name: 'めざましコーヒー', num: 16 },
		]
	},
]

let map = list.reduce((a, x) => (a[x.name] = x, a), {});

class Cooking {
	static list = [];
	static map = {};
}
Cooking.list = list;
Cooking.map = map;

Cooking.potMax = 69;

Cooking.recipeLvs = {1: { bonus: 1, totalExp: 0 }, 2: { bonus: 1.02, totalExp: 1080 }, 3: { bonus: 1.04, totalExp: 2324 }, 4: { bonus: 1.06, totalExp: 3936 }, 5: { bonus: 1.08, totalExp: 5545 }, 6: { bonus: 1.09, totalExp: 7341 }, 7: { bonus: 1.11, totalExp: 9712 }, 8: { bonus: 1.13, totalExp: 12760 }, 9: { bonus: 1.16, totalExp: 16426 }, 10: { bonus: 1.18, totalExp: 20791 }, 11: { bonus: 1.19, totalExp: 25639 }, 12: { bonus: 1.21, totalExp: 30911 }, 13: { bonus: 1.23, totalExp: 36621 }, 14: { bonus: 1.24, totalExp: 42922 }, 15: { bonus: 1.26, totalExp: 49882 }, 16: { bonus: 1.28, totalExp: 57551 }, 17: { bonus: 1.3, totalExp: 66001 }, 18: { bonus: 1.31, totalExp: 75131 }, 19: { bonus: 1.33, totalExp: 84981 }, 20: { bonus: 1.35, totalExp: 95642 }, 21: { bonus: 1.37, totalExp: 107159 }, 22: { bonus: 1.4, totalExp: 119576 }, 23: { bonus: 1.42, totalExp: 132938 }, 24: { bonus: 1.45, totalExp: 147309 }, 25: { bonus: 1.47, totalExp: 162621 }, 26: { bonus: 1.5, totalExp: 178929 }, 27: { bonus: 1.52, totalExp: 196563 }, 28: { bonus: 1.55, totalExp: 215605 }, 29: { bonus: 1.58, totalExp: 236149 }, 30: { bonus: 1.61, totalExp: 258299 }, 31: { bonus: 1.64, totalExp: 281955 }, 32: { bonus: 1.67, totalExp: 306759 }, 33: { bonus: 1.7, totalExp: 332769 }, 34: { bonus: 1.74, totalExp: 360469 }, 35: { bonus: 1.77, totalExp: 389943 }, 36: { bonus: 1.81, totalExp: 421521 }, 37: { bonus: 1.84, totalExp: 455380 }, 38: { bonus: 1.88, totalExp: 491055 }, 39: { bonus: 1.92, totalExp: 528663 }, 40: { bonus: 1.96, totalExp: 568918 }, 41: { bonus: 2, totalExp: 611541 }, 42: { bonus: 2.04, totalExp: 656646 }, 43: { bonus: 2.08, totalExp: 704344 }, 44: { bonus: 2.13, totalExp: 754748 }, 45: { bonus: 2.17, totalExp: 807184 }, 46: { bonus: 2.22, totalExp: 862205 }, 47: { bonus: 2.27, totalExp: 920936 }, 48: { bonus: 2.32, totalExp: 983590 }, 49: { bonus: 2.37, totalExp: 1050391 }, 50: { bonus: 2.42, totalExp: 1121582 }, 51: { bonus: 2.48, totalExp: 1196687 }, 52: { bonus: 2.53, totalExp: 1319485 }, 53: { bonus: 2.59, totalExp: 1471363 }, 54: { bonus: 2.65, totalExp: 1672589 }, 55: { bonus: 2.71, totalExp: 1930878 }, 56: { bonus: 2.77, totalExp: 2231322 }, 57: { bonus: 2.83, totalExp: 2579312 }, 58: { bonus: 2.9, totalExp: 2977994 }, 59: { bonus: 2.97, totalExp: 3413120 }, 60: { bonus: 3.03, totalExp: 3891145 },}
Cooking.maxRecipeLv = Object.values(Cooking.recipeLvs).length;
Cooking.maxRecipeBonus = Math.max(...Object.values(Cooking.recipeLvs).map(x => x.bonus))

// 週に料理チャンスでn%上がる時、どのくらい期待値があるか
// TODO: こんなfor回さんでも計算できない？頑張ってみたけど無理だった…
Cooking.getChanceWeekEffect = (effect, day = null) => {
	if (effect == 0) {
		if (day == null) {

			return {
				total: 24.6,
				successProbabilityList: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.3, 0.3, 0.3]
			}
		} else if (day == 6){
			return {
				total: 3.9,
				successProbabilityList: [0.3, 0.3, 0.3]
			}
		} else {
			return {
				total: 3.3,
				successProbabilityList: [0.1, 0.1, 0.1]
			}
		}
	}

	if (day == null) {
		// 1週間の場合
		let p = Math.min(effect / 21, 0.7);

		let result = 0;
		let pList = [1];

		// 料理回数
		for(let i = 1; i <= 21; i++) {
			let thisP = 0;

			// pの積算
			for(let j = 1; j <= i; j++) {
				let rate = ((i <= 18 ? 0.1 : 0.3) + p * j) * pList[i - j];

				for(let k = i - j + 1; k < i; k++) {
					rate *= 1 - pList[k]
				}
				thisP += rate;
			}
			result += thisP * (i <= 18 ? 1 : 2) + 1;
			pList.push(thisP)
		}

		return { total: result, successProbabilityList: pList.slice(1) };

	} else {
		// 1週間の場合

		// 1回あたりの上昇量(70%が上限)
		let p = Math.min(effect / 3, 0.7);

		let result = 0;
		let pList = [1];

		// 料理回数
		for(let i = 1; i <= 3; i++) {
			let thisP = 0;

			// pの積算
			for(let j = 1; j <= i; j++) {
				let rate = ((day == 6 ? 0.3 : 0.1) + p * j) * pList[i - j];

				for(let k = i - j + 1; k < i; k++) {
					rate *= 1 - pList[k]
				}
				thisP += rate;
			}
			result += thisP * (day == 6 ? 2 : 1) + 1;
			pList.push(thisP)
		}

		return { total: result, successProbabilityList: pList.slice(1) };

	}
}

Cooking.evaluateLvList = (config) => {
	return structuredClone(Cooking.list).map(cooking => {
		cooking.lv = 1;

		if (config.simulation.cookingRecipeLvType == 1) {
			cooking.lv = config.simulation.cookingSettings[cooking.name].lv;
		}
		if (config.simulation.cookingRecipeLvType == 2) {
			cooking.lv = config.simulation.cookingRecipeFixLv;
		}
		if (config.simulation.cookingRecipeLvType == 3) {
			let exp = 0;
			for(let i = 0; i < config.simulation.cookingRecipeRepeatLv; i++) {
				exp += Cooking.recipeLvs[cooking.lv].bonus * cooking.energy;
				while(Cooking.recipeLvs[cooking.lv].totalExp <= exp && cooking.lv < Cooking.maxRecipeLv) {
					cooking.lv++;
				}
			}
		}

		cooking.recipeLvBonus = Cooking.recipeLvs[cooking.lv].bonus;
		cooking.fixEnergy = cooking.energy * cooking.recipeLvBonus
		
		return cooking;
	})
}

export default Cooking;