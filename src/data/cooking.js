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
		type: 'カレー', name: 'ニンジャカレー', rate: 1.25, foodList: [
			{ name: 'ワカクサ大豆', num: 15 },
			{ name: 'ふといながねぎ', num: 9 },
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
		type: 'サラダ', name: 'うるおいとうふサラダ', rate: 1.11, foodList: [
			{ name: 'ワカクサ大豆', num: 10 },
			{ name: 'あんみんトマト', num: 6 },]
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
		type: 'サラダ', name: 'ニンジャサラダ', rate: 1.35, foodList: [
			{ name: 'あったかジンジャー', num: 11 },
			{ name: 'ワカクサ大豆', num: 15 },
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
		type: 'デザート', name: 'ちからもちソイドーナツ', rate: 1.17, foodList: [
			{ name: 'ワカクサ大豆', num: 6 },
			{ name: 'リラックスカカオ', num: 7 },
			{ name: 'ピュアなオイル', num: 9 },]
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
		type: 'デザート', name: 'ネロリ博士のヒーリングティー', rate: 1.25, foodList: [
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
]

let map = list.reduce((a, x) => (a[x.name] = x, a), {});

class Cooking {
	static list = [];
	static map = {};
}
Cooking.list = list;
Cooking.map = map;

Cooking.potMax = 57;

Cooking.recipeLvs = {
	 1: 1.00,  2: 1.02,  3: 1.04,  4: 1.06,  5: 1.08,  6: 1.09,  7: 1.11,  8: 1.13,  9: 1.16, 10: 1.18,
	11: 1.19, 12: 1.21, 13: 1.23, 14: 1.24, 15: 1.26, 16: 1.28, 17: 1.30, 18: 1.31, 19: 1.33, 20: 1.35,
	21: 1.37, 22: 1.40, 23: 1.42, 24: 1.45, 25: 1.47, 26: 1.50, 27: 1.52, 28: 1.55, 29: 1.58, 30: 1.61,
	31: 1.64, 32: 1.67, 33: 1.70, 34: 1.74, 35: 1.77, 36: 1.81, 37: 1.84, 38: 1.88, 39: 1.92, 40: 1.96,
	41: 2.00, 42: 2.04, 43: 2.08, 44: 2.13, 45: 2.17, 46: 2.22, 47: 2.27, 48: 2.32, 49: 2.37, 50: 2.42,
	51: 2.48, 52: 2.53, 53: 2.59, 54: 2.65, 55: 2.71,
}
Cooking.maxRecipeBonus = Math.max(...Object.values(Cooking.recipeLvs))

// 週に料理チャンスでn%上がる時、どのくらい期待値があるか
// TODO: こんなfor回さんでも計算できない？頑張ってみたけど無理だった…
Cooking.getChanceWeekEffect = (effect) => {
	if (effect == 0) return {
		total: 24.6,
		successProbabilityList: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.3, 0.3, 0.3]
	}
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
}

export default Cooking;