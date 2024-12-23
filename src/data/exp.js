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
		{total: 51493, shard: null},
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
		
		if (pokemon.training != null && pokemon.lv < pokemon.training && 1 < pokemon.training && pokemon.training <= this.list.length + 1) {
			const pokemonInfo = Pokemon.map[pokemon.name];
			let lv = pokemon.lv;
			let lastTotal = Math.round(this.list[pokemon.training - 1].total * pokemonInfo.exp)
			let nextTotal = Math.round(this.list[lv].total * pokemonInfo.exp)
			let normalTotal = pokemon.nextExp ? nextTotal - pokemon.nextExp : Math.round(this.list[lv - 1].total * pokemonInfo.exp)
			let boostTotal = normalTotal;
			let minBoostTotal = normalTotal;
			
			let candyExp = nature.good == 'EXP獲得量' ? 30 : nature.weak == 'EXP獲得量' ? 21 : 25;
			let boostedCandyExp = candyExp * config.candy.boostMultiply;

			const requireExp = lastTotal - normalTotal;
			let minBoostCandyNum = Math.max(Math.ceil((requireExp / candyExp - config.candy.bag[pokemonInfo.seed]) / (config.candy.boostMultiply - 1)), 0)
			const canMinBoost = config.candy.bag[pokemonInfo.seed] - minBoostCandyNum >= 1
			if (canMinBoost) {
				result.bestBoostCandyNum = minBoostCandyNum;
				result.bestBoostCandyShard = 0;
				result.bestNormalCandyNum = Math.min(config.candy.bag[pokemonInfo.seed], Math.ceil(requireExp / candyExp)) - minBoostCandyNum;
				result.bestNormalCandyShard = 0;
			}

			result.normalCandyNum = 0
			result.normalCandyShard = 0

			while(lv < pokemon.training && nextTotal) {
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