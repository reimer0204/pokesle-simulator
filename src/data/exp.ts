import Pokemon from "./pokemon";

class Exp {

	static list = [
		{total: 0, shard: 14},
		{total: 54, shard: 18},
		{total: 125, shard: 22},
		{total: 233, shard: 27},
		{total: 361, shard: 30},
		{total: 525, shard: 34},
		{total: 727, shard: 39},
		{total: 971, shard: 44},
		{total: 1245, shard: 48},
		{total: 1560, shard: 50},
		{total: 1905, shard: 52},
		{total: 2281, shard: 53},
		{total: 2688, shard: 56},
		{total: 3107, shard: 59},
		{total: 3536, shard: 62},
		{total: 3976, shard: 66},
		{total: 4430, shard: 68},
		{total: 4899, shard: 71},
		{total: 5382, shard: 74},
		{total: 5879, shard: 78},
		{total: 6394, shard: 81},
		{total: 6931, shard: 85},
		{total: 7489, shard: 88},
		{total: 8068, shard: 92},
		{total: 8668, shard: 95},
		{total: 9290, shard: 100},
		{total: 9933, shard: 105},
		{total: 10598, shard: 111},
		{total: 11284, shard: 117},
		{total: 11992, shard: 122},
		{total: 12721, shard: 126},
		{total: 13469, shard: 130},
		{total: 14235, shard: 136},
		{total: 15020, shard: 143},
		{total: 15823, shard: 151},
		{total: 16644, shard: 160},
		{total: 17483, shard: 167},
		{total: 18340, shard: 174},
		{total: 19215, shard: 184},
		{total: 20108, shard: 192},
		{total: 21018, shard: 201},
		{total: 21946, shard: 211},
		{total: 22891, shard: 221},
		{total: 23854, shard: 227},
		{total: 24834, shard: 236},
		{total: 25831, shard: 250},
		{total: 26846, shard: 264},
		{total: 27878, shard: 279},
		{total: 28927, shard: 295},
		{total: 29993, shard: 309},
		{total: 31355, shard: 323},
		{total: 32917, shard: 338},
		{total: 34664, shard: 356},
		{total: 36610, shard: 372},
		{total: 38805, shard: 391},
		{total: 41084, shard: 437},
		{total: 43488, shard: 486},
		{total: 46021, shard: 538},
		{total: 48687, shard: 593},
		{total: 51493, shard: 651},
		{total: 54358, shard: 698},
		{total: 57280, shard: 750},
		{total: 60257, shard: 804},
		{total: 63286, shard: 866},
		{total: 66363, shard: null},
	];

	static calcRequireInfo(pokemon, nature, config) {
		const result = {
			normalCandyNum: null,
			normalCandyShard: null,
			boostCandyNum: null,
			boostCandyShard: null,
			bestBoostCandyNum: null,
			bestBoostCandyShard: null,
			bestNormalCandyNum: null,
			bestNormalCandyShard: null,
		}
		
		if (pokemon.training != null && pokemon.lv < pokemon.training && pokemon.lv < this.list.length && 1 < pokemon.training) {
			const pokemonInfo = Pokemon.map[pokemon.name];
			let lv = Math.min(pokemon.lv, this.list.length);

			// 最終的に必要な経験値
			let lastTotal = Math.round(this.list[Math.min(pokemon.training, this.list.length) - 1].total * pokemonInfo.exp)

			// 次のレベルまでの経験値
			let nextTotal = Math.round(this.list[lv].total * pokemonInfo.exp)

			// 今ある経験値(次までの経験値があるならそれを使って計算、そうでないなら現Lvの経験値)
			let normalTotal = pokemon.nextExp ? nextTotal - pokemon.nextExp : Math.round(this.list[lv - 1].total * pokemonInfo.exp)

			let boostTotal = normalTotal;
			let minBoostTotal = normalTotal;
			
			// アメ1個あたりの経験値
			let candyExp25 = nature.good == 'EXP獲得量' ? 41 : nature.weak == 'EXP獲得量' ? 29 : 35;
			let candyExp30 = nature.good == 'EXP獲得量' ? 35 : nature.weak == 'EXP獲得量' ? 25 : 30;
			let candyExp99 = nature.good == 'EXP獲得量' ? 30 : nature.weak == 'EXP獲得量' ? 21 : 25;

			// 必要な経験値
			const requireExp = lastTotal - normalTotal;

			// 最適なアメ数 = (必要なアメ数 - 所持アメ数) / (追加の倍率)

			// 全部通常アメで出来るか
			// アメのEXPが変わる区間のすべてをブーストするパターンから、すべてブーストしないパターンまで走査
			let minBoostCandyNum = 0;
			let tmpMinBoostCandyNum = null;
			while(true) {
				let tmpLv = lv;
				let tmpExp = normalTotal
				let useCandy = 0;

				let useBoost = 0;
				for(let { exp, border } of [{ exp: candyExp25, border: 25 }, { exp: candyExp30, border: 30 }, { exp: candyExp99, border: this.list.length }]) {
					if (border <= tmpLv) continue;

					if (tmpLv < pokemon.training) {
						const targetLv = Math.min(pokemon.training, border);

						if (tmpMinBoostCandyNum != null && useBoost < tmpMinBoostCandyNum) {
							const thisCandy = Math.min(Math.ceil((this.list[targetLv - 1].total - tmpExp) / (exp * config.candy.boostMultiply)), tmpMinBoostCandyNum - useBoost)
							tmpExp += thisCandy * exp * config.candy.boostMultiply
							useCandy += thisCandy
							useBoost += thisCandy;
						}
						const thisCandy = Math.ceil((this.list[targetLv - 1].total - tmpExp) / exp)
						tmpExp += thisCandy * exp
						tmpLv = targetLv;
						useCandy += thisCandy
					} else {
						break;
					}
				}

				if (tmpMinBoostCandyNum == null) {
					if (useCandy > config.candy.bag[pokemonInfo.seed]) {

						// 最小ブースト数の計算
						// 足りない分を補えるだけ(足りない分÷(倍率-1))、もしくは必要アメ数/倍率の小さい方
						tmpMinBoostCandyNum = Math.min(
							Math.ceil((useCandy - (config.candy.bag[pokemonInfo.seed] ?? 0)) / (config.candy.boostMultiply - 1)),
							Math.ceil(useCandy / config.candy.boostMultiply),
							config.candy.bag[pokemonInfo.seed]
						)
					} else {
						result.bestBoostCandyNum = null;
						result.bestNormalCandyNum = useCandy;
						break;
					}
				} else {
					if (useCandy <= config.candy.bag[pokemonInfo.seed]) {
						result.bestBoostCandyNum = tmpMinBoostCandyNum;
						result.bestNormalCandyNum = useCandy - tmpMinBoostCandyNum;
						minBoostCandyNum = tmpMinBoostCandyNum;
						tmpMinBoostCandyNum--;
					} else {
						break;
					}
				}
			}

			const canMinBoost = result.bestBoostCandyNum && result.bestNormalCandyNum;
			if (canMinBoost) {
				result.bestBoostCandyShard = 0;
				result.bestNormalCandyShard = 0;
			} else {
				result.bestBoostCandyNum = null;
				result.bestBoostCandyShard = null;
				result.bestNormalCandyNum = null;
				result.bestNormalCandyShard = null;
			}

			result.normalCandyNum = 0
			result.normalCandyShard = 0

			while(lv < pokemon.training && nextTotal) {
				let candyExp = lv < 25 ? candyExp25 : 
					lv < 30 ? candyExp30 :
					candyExp99;
				let boostedCandyExp = candyExp * config.candy.boostMultiply;
				
				const requireCandyNum = Math.ceil((nextTotal - normalTotal) / candyExp);
				result.normalCandyNum += requireCandyNum;
				result.normalCandyShard += this.list[lv - 1].shard * requireCandyNum;
				normalTotal += requireCandyNum * candyExp;
				
				const boostRequireCandyNum = Math.ceil((nextTotal - boostTotal) / boostedCandyExp);
				result.boostCandyNum += boostRequireCandyNum;
				result.boostCandyShard += this.list[lv - 1].shard * boostRequireCandyNum * config.candy.boostShard;
				boostTotal += boostRequireCandyNum * boostedCandyExp;

				if (canMinBoost) {
					if (minBoostCandyNum > 0) {
						const minBoostRequireCandyNum = Math.min(Math.ceil((nextTotal - minBoostTotal) / boostedCandyExp), minBoostCandyNum);
						minBoostCandyNum -= minBoostRequireCandyNum;
						result.bestBoostCandyShard += this.list[lv - 1].shard * minBoostRequireCandyNum * config.candy.boostShard;
						minBoostTotal += minBoostRequireCandyNum * boostedCandyExp;
					}
					if (nextTotal > minBoostTotal) {
						const minRequireCandyNum = Math.ceil((nextTotal - minBoostTotal) / candyExp);
						result.bestNormalCandyShard += this.list[lv - 1].shard * minRequireCandyNum;
						minBoostTotal += minRequireCandyNum * candyExp;
					}
				}

				lv++;
				nextTotal = Math.round(this.list[lv]?.total * pokemonInfo.exp)
			}
		}

		return result
	}
}

export default Exp