const list = [
	{type: 'カレー', name: 'ごちゃまぜカレー', energy: 0, foodList: []},
	{type: 'カレー', name: 'とくせんリンゴカレー', energy: 748, foodList: [{name: 'とくせんリンゴ', num: 7},]},
	{type: 'カレー', name: 'あぶりテールカレー', energy: 7483, foodList: [{name: 'おいしいシッポ', num: 8},{name: 'げきからハーブ', num: 25},]},
	{type: 'カレー', name: 'サンパワートマトカレー', energy: 2078, foodList: [{name: 'あんみんトマト', num: 10},{name: 'げきからハーブ', num: 5},]},
	{type: 'カレー', name: 'ぜったいねむりバターカレー', energy: 9010, foodList: [{name: 'ほっこりポテト', num: 18},{name: 'リラックスカカオ', num: 12},{name: 'あんみんトマト', num: 15},{name: 'モーモーミルク', num: 10},]},
	{type: 'カレー', name: 'からくちネギもりカレー', energy: 5900, foodList: [{name: 'ふといながねぎ', num: 14},{name: 'あったかジンジャー', num: 10},{name: 'げきからハーブ', num: 8},]},
	{type: 'カレー', name: 'キノコのほうしカレー', energy: 4162, foodList: [{name: 'あじわいキノコ', num: 14},{name: 'ほっこりポテト', num: 9},]},
	{type: 'カレー', name: 'おやこあいカレー', energy: 4523, foodList: [{name: 'あまいミツ', num: 12},{name: 'とくせんエッグ', num: 8},{name: 'とくせんリンゴ', num: 11},{name: 'ほっこりポテト', num: 4},]},
	{type: 'カレー', name: '満腹チーズバーグカレー', energy: 1910, foodList: [{name: 'モーモーミルク', num: 8},{name: 'マメミート', num: 8},]},
	{type: 'カレー', name: 'ほっこりホワイトシチュー', energy: 3181, foodList: [{name: 'モーモーミルク', num: 10},{name: 'ほっこりポテト', num: 8},{name: 'あじわいキノコ', num: 4},]},
	{type: 'カレー', name: 'たんじゅんホワイトシチュー', energy: 814, foodList: [{name: 'モーモーミルク', num: 7},]},
	{type: 'カレー', name: 'マメバーグカレー', energy: 856, foodList: [{name: 'マメミート', num: 7},]},
	{type: 'カレー', name: 'ベイビィハニーカレー', energy: 839, foodList: [{name: 'あまいミツ', num: 7},]},
	{type: 'カレー', name: 'ニンジャカレー', energy: 9445, foodList: [{name: 'ワカクサ大豆', num: 24},{name: 'ふといながねぎ', num: 12},{name: 'マメミート', num: 9},{name: 'あじわいキノコ', num: 5},]},
	{type: 'カレー', name: 'ひでりカツレツカレー', energy: 1942, foodList: [{name: 'マメミート', num: 10},{name: 'ピュアなオイル', num: 5},]},
	{type: 'カレー', name: 'とけるオムカレー', energy: 2150, foodList: [{name: 'とくせんエッグ', num: 10},{name: 'あんみんトマト', num: 6},]},
	{type: 'カレー', name: 'ビルドアップマメカレー', energy: 3372, foodList: [{name: 'ワカクサ大豆', num: 12},{name: 'マメミート', num: 6},{name: 'とくせんエッグ', num: 4},{name: 'げきからハーブ', num: 4},]},
	{type: 'カレー', name: 'じゅうなんコーンシチュー', energy: 4670, foodList: [{name: 'ワカクサコーン', num: 14},{name: 'モーモーミルク', num: 8},{name: 'ほっこりポテト', num: 8},]},
	{type: 'カレー', name: 'れんごくコーンキーマカレー', energy: 13690, foodList: [{name: 'げきからハーブ', num: 27},{name: 'マメミート', num: 24},{name: 'ワカクサコーン', num: 14},{name: 'あったかジンジャー', num: 12},]},
	{type: 'カレー', name: 'めざめるパワーシチュー', energy: 19061, foodList: [{name: 'ワカクサ大豆', num: 28},{name: 'あんみんトマト', num: 25},{name: 'あじわいキノコ', num: 23},{name: 'めざましコーヒー', num: 16},]},
	{type: 'カレー', name: 'ピヨピヨパンチ辛口カレー', energy: 5702, foodList: [{name: 'めざましコーヒー', num: 11},{name: 'げきからハーブ', num: 11},{name: 'あまいミツ', num: 11},]},
	{type: 'サラダ', name: 'ごちゃまぜサラダ', energy: 0, foodList: []},
	{type: 'サラダ', name: 'ヤドンテールのペッパーサラダ', energy: 8169, foodList: [{name: 'げきからハーブ', num: 10},{name: 'ピュアなオイル', num: 15},{name: 'おいしいシッポ', num: 10},]},
	{type: 'サラダ', name: 'キノコのほうしサラダ', energy: 5859, foodList: [{name: 'あじわいキノコ', num: 17},{name: 'ピュアなオイル', num: 8},{name: 'あんみんトマト', num: 8},]},
	{type: 'サラダ', name: 'ゆきかきシーザーサラダ', energy: 1898, foodList: [{name: 'モーモーミルク', num: 10},{name: 'マメミート', num: 6},]},
	{type: 'サラダ', name: 'くいしんぼうポテトサラダ', energy: 5040, foodList: [{name: 'ほっこりポテト', num: 14},{name: 'とくせんエッグ', num: 9},{name: 'マメミート', num: 7},{name: 'とくせんリンゴ', num: 6},]},
	{type: 'サラダ', name: 'うるおいとうふサラダ', energy: 3113, foodList: [{name: 'ワカクサ大豆', num: 15},{name: 'あんみんトマト', num: 9},]},
	{type: 'サラダ', name: 'ばかぢからワイルドサラダ', energy: 3046, foodList: [{name: 'マメミート', num: 9},{name: 'あったかジンジャー', num: 6},{name: 'とくせんエッグ', num: 5},{name: 'ほっこりポテト', num: 3},]},
	{type: 'サラダ', name: 'マメハムサラダ', energy: 978, foodList: [{name: 'マメミート', num: 8},]},
	{type: 'サラダ', name: 'あんみんトマトサラダ', energy: 1045, foodList: [{name: 'あんみんトマト', num: 8},]},
	{type: 'サラダ', name: 'モーモーカプレーゼ', energy: 2942, foodList: [{name: 'モーモーミルク', num: 12},{name: 'あんみんトマト', num: 6},{name: 'ピュアなオイル', num: 5},]},
	{type: 'サラダ', name: 'ムラっけチョコミートサラダ', energy: 3665, foodList: [{name: 'リラックスカカオ', num: 14},{name: 'マメミート', num: 9},]},
	{type: 'サラダ', name: 'オーバーヒートサラダ', energy: 5225, foodList: [{name: 'げきからハーブ', num: 17},{name: 'あったかジンジャー', num: 10},{name: 'あんみんトマト', num: 8},]},
	{type: 'サラダ', name: 'とくせんリンゴサラダ', energy: 855, foodList: [{name: 'とくせんリンゴ', num: 8},]},
	{type: 'サラダ', name: 'めんえきねぎサラダ', energy: 2845, foodList: [{name: 'あったかジンジャー', num: 5},{name: 'ふといながねぎ', num: 10},]},
	{type: 'サラダ', name: 'メロメロりんごのチーズサラダ', energy: 2655, foodList: [{name: 'とくせんリンゴ', num: 15},{name: 'モーモーミルク', num: 5},{name: 'ピュアなオイル', num: 3},]},
	{type: 'サラダ', name: 'ニンジャサラダ', energy: 11659, foodList: [{name: 'あったかジンジャー', num: 11},{name: 'ワカクサ大豆', num: 19},{name: 'あじわいキノコ', num: 12},{name: 'ふといながねぎ', num: 15},]},
	{type: 'サラダ', name: 'ねっぷうとうふサラダ', energy: 2114, foodList: [{name: 'げきからハーブ', num: 6},{name: 'ワカクサ大豆', num: 10},]},
	{type: 'サラダ', name: 'ワカクササラダ', energy: 11393, foodList: [{name: 'ピュアなオイル', num: 22},{name: 'ワカクサコーン', num: 17},{name: 'あんみんトマト', num: 14},{name: 'ほっこりポテト', num: 9},]},
	{type: 'サラダ', name: 'めいそうスイートサラダ', energy: 7675, foodList: [{name: 'とくせんリンゴ', num: 21},{name: 'あまいミツ', num: 16},{name: 'ワカクサコーン', num: 12},]},
	{type: 'サラダ', name: 'みだれづきコーンサラダ', energy: 2785, foodList: [{name: 'ワカクサコーン', num: 9},{name: 'ピュアなオイル', num: 8},]},
	{type: 'サラダ', name: 'まけんきコーヒーサラダ', energy: 20218, foodList: [{name: 'めざましコーヒー', num: 28},{name: 'マメミート', num: 28},{name: 'ピュアなオイル', num: 22},{name: 'ほっこりポテト', num: 22},]},
	{type: 'サラダ', name: 'クロスチョップドサラダ', energy: 8755, foodList: [{name: 'とくせんエッグ', num: 20},{name: 'マメミート', num: 15},{name: 'ワカクサコーン', num: 11},{name: 'あんみんトマト', num: 10},]},
	{type: 'デザート', name: 'ごちゃまぜジュース', energy: 0, foodList: []},
	{type: 'デザート', name: 'じゅくせいスイートポテト', energy: 1907, foodList: [{name: 'ほっこりポテト', num: 9},{name: 'モーモーミルク', num: 5},]},
	{type: 'デザート', name: 'ふくつのジンジャークッキー', energy: 4921, foodList: [{name: 'あまいミツ', num: 14},{name: 'あったかジンジャー', num: 12},{name: 'リラックスカカオ', num: 5},{name: 'とくせんエッグ', num: 4},]},
	{type: 'デザート', name: 'とくせんリンゴジュース', energy: 855, foodList: [{name: 'とくせんリンゴ', num: 8},]},
	{type: 'デザート', name: 'クラフトサイコソーダ', energy: 1079, foodList: [{name: 'あまいミツ', num: 9},]},
	{type: 'デザート', name: 'ひのこのジンジャーティー', energy: 1913, foodList: [{name: 'とくせんリンゴ', num: 7},{name: 'あったかジンジャー', num: 9},]},
	{type: 'デザート', name: 'プリンのプリンアラモード', energy: 7594, foodList: [{name: 'あまいミツ', num: 20},{name: 'とくせんエッグ', num: 15},{name: 'とくせんリンゴ', num: 10},{name: 'モーモーミルク', num: 10},]},
	{type: 'デザート', name: 'あくまのキッスフルーツオレ', energy: 4734, foodList: [{name: 'とくせんリンゴ', num: 11},{name: 'モーモーミルク', num: 9},{name: 'あまいミツ', num: 7},{name: 'リラックスカカオ', num: 8},]},
	{type: 'デザート', name: 'ねがいごとアップルパイ', energy: 1748, foodList: [{name: 'とくせんリンゴ', num: 12},{name: 'モーモーミルク', num: 4},]},
	{type: 'デザート', name: 'ネロリのデトックスティー', energy: 5065, foodList: [{name: 'あったかジンジャー', num: 11},{name: 'とくせんリンゴ', num: 15},{name: 'あじわいキノコ', num: 9},]},
	{type: 'デザート', name: 'あまいかおりチョコケーキ', energy: 3378, foodList: [{name: 'あまいミツ', num: 9},{name: 'リラックスカカオ', num: 8},{name: 'モーモーミルク', num: 7},]},
	{type: 'デザート', name: 'モーモーホットミルク', energy: 814, foodList: [{name: 'モーモーミルク', num: 7},]},
	{type: 'デザート', name: 'かるわざソイケーキ', energy: 1924, foodList: [{name: 'とくせんエッグ', num: 8},{name: 'ワカクサ大豆', num: 7},]},
	{type: 'デザート', name: 'はりきりプロテインスムージー', energy: 3263, foodList: [{name: 'ワカクサ大豆', num: 15},{name: 'リラックスカカオ', num: 8},]},
	{type: 'デザート', name: 'マイペースやさいジュース', energy: 1924, foodList: [{name: 'とくせんリンゴ', num: 7},{name: 'あんみんトマト', num: 9},]},
	{type: 'デザート', name: 'おおきいマラサダ', energy: 3015, foodList: [{name: 'ピュアなオイル', num: 10},{name: 'モーモーミルク', num: 7},{name: 'あまいミツ', num: 6},]},
	{type: 'デザート', name: 'ちからもちソイドーナッツ', energy: 5547, foodList: [{name: 'ピュアなオイル', num: 12},{name: 'リラックスカカオ', num: 7},{name: 'ワカクサ大豆', num: 16},]},
	{type: 'デザート', name: 'だいばくはつポップコーン', energy: 6048, foodList: [{name: 'ワカクサコーン', num: 15},{name: 'ピュアなオイル', num: 14},{name: 'モーモーミルク', num: 7},]},
	{type: 'デザート', name: 'おちゃかいコーンスコーン', energy: 10925, foodList: [{name: 'とくせんリンゴ', num: 20},{name: 'あったかジンジャー', num: 20},{name: 'ワカクサコーン', num: 18},{name: 'モーモーミルク', num: 9},]},
	{type: 'デザート', name: 'はなびらのまいチョコタルト', energy: 3314, foodList: [{name: 'リラックスカカオ', num: 11},{name: 'とくせんリンゴ', num: 11},]},
	{type: 'デザート', name: 'フラワーギフトマカロン', energy: 13834, foodList: [{name: 'リラックスカカオ', num: 25},{name: 'とくせんエッグ', num: 25},{name: 'あまいミツ', num: 17},{name: 'モーモーミルク', num: 10},]},
	{type: 'デザート', name: 'スパークスパイスコーラ', energy: 17494, foodList: [{name: 'とくせんリンゴ', num: 35},{name: 'あったかジンジャー', num: 20},{name: 'ふといながねぎ', num: 20},{name: 'めざましコーヒー', num: 12},]},
	{type: 'デザート', name: 'はやおきコーヒーゼリー', energy: 6793, foodList: [{name: 'めざましコーヒー', num: 16},{name: 'モーモーミルク', num: 14},{name: 'あまいミツ', num: 12},]},
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

		if (cooking.rate > 1) {
			if (config.simulation.cookingRecipeLvType1) {
				cooking.lv1 = config.simulation.cookingSettings[cooking.name].lv;
				cooking.lv = Math.max(cooking.lv, cooking.lv1);
			}
			if (config.simulation.cookingRecipeLvType2) {
				cooking.lv2 = config.simulation.cookingRecipeFixLv;
				cooking.lv = Math.max(cooking.lv, cooking.lv2);
			}
			if (config.simulation.cookingRecipeLvType3) {
				let exp = 0;
				let lv = 1;
				for(let i = 0; i < config.simulation.cookingRecipeRepeatLv; i++) {
					exp += Cooking.recipeLvs[lv].bonus * cooking.energy;
					while(Cooking.recipeLvs[lv].totalExp <= exp && lv < Cooking.maxRecipeLv) {
						lv++;
					}
				}
				cooking.lv3 = lv;
				cooking.lv = Math.max(cooking.lv, cooking.lv3);
			}
		}

		cooking.recipeLvBonus = Cooking.recipeLvs[cooking.lv]?.bonus ?? 0;
		cooking.fixEnergy = cooking.energy * cooking.recipeLvBonus
		cooking.fixAddEnergy = cooking.fixEnergy - cooking.rawEnergy
		
		return cooking;
	})
}

export default Cooking;