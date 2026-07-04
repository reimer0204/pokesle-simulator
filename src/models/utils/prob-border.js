class ProbBorder {

  #border;
  #reverseBorder;
  #cache;
  #cacheHit = 0;

  constructor(border) {
    this.#border = border;
    this.#reverseBorder = 1 - border;
    this.#cache = {}
  }

  printStatistics() {
    console.log('cacheHit', this.#cacheHit);
    console.log('cacheNum', Object.entries(this.#cache).length);
  }

  get(p, n) {
    if (this.#reverseBorder <= 0) return 0;
    if (this.#reverseBorder >= 1) return n;

    n = Math.floor(n);

    const key = `${p.toFixed(4)}_${n}`;
    if (this.#cache[key] !== undefined) {
      this.#cacheHit++;
      return this.#cache[key];
    }

    let sumP = 0;
    const rp = 1 - p;
    for(let i = 0; i <= n; i++) {
      
      // i回成功する確率
      let thisP = (p ** i) * (rp ** (n - i));
      for(let j = 0; j < i; j++) {
        thisP *= (n - j) / (i - j)
      }

      if (sumP + thisP >= this.#reverseBorder) {
        return this.#cache[key] = i + (this.#reverseBorder - sumP) / thisP
      }
      sumP += thisP;
    }

    return this.#cache[key] = n;
  }

  skill(p, n1, n2, limit) {
    if (this.#reverseBorder <= 0) return 0;
    if (this.#reverseBorder >= 1) return n2 * limit;

    n1 = Math.floor(n1);
    n2 = Math.floor(n2);
    limit = Math.floor(limit);

    const key = `${p.toFixed(4)}_${n1}_${n2}_${limit}`;
    if (this.#cache[key] !== undefined) {
      this.#cacheHit++;
      return this.#cache[key];
    }

    // 1. フェーズ1の確率分布 [P(0), P(1), ..., P(limit)] を計算
    const phase1Dist = new Float64Array(limit + 1);
    let sumProb = 0;
    const rp = 1 - p;

    // 各成功回数の確率を計算: nCk * p^k * (1-p)^(n-k)
    // 初期値 P(0)
    let p_i = Math.pow(rp, n1);
    phase1Dist[0] = p_i;
    sumProb = p_i;

    for (let i = 1; i < limit; i++) {
      // 前の項からの遷移: P(i) = P(i-1) * (n-i+1)/i * (p/(1-p))
      p_i *= (n1 - i + 1) / i * (p / rp);
      phase1Dist[i] = p_i;
      sumProb += p_i;
    }
    // 上限回数における確率は残りのすべてとする
    phase1Dist[limit] = 1 - sumProb;

    // 2. n2回分の分布を畳み込み計算
    const maxSuccess = n2 * limit;
    let dist = new Float64Array(maxSuccess + 1);
    dist[0] = 1.0;
    
    let currentMax = 0; // 現在の分布の最大成功回数

    for (let i = 0; i < n2; i++) {
      const nextDist = new Float64Array(maxSuccess + 1);
      const nextMax = currentMax + limit;
      for (let s = 0; s <= currentMax; s++) {
        if (dist[s] === 0) continue;
        for (let add = 0; add <= limit; add++) {
          nextDist[s + add] += dist[s] * phase1Dist[add];
        }
      }
      dist = nextDist;
      currentMax = nextMax;
    }

    // 3. 累積確率からborderを超えるxを計算
    const target = this.#reverseBorder;
    let cumulative = 0;
    for (let i = 0; i <= currentMax; i++) {
      if (cumulative + dist[i] >= target) {
        return this.#cache[key] = i + (target - cumulative) / (dist[i] || 1e-18);
      }
      cumulative += dist[i];
    }
    return this.#cache[key] = currentMax;
  }
}

export default ProbBorder;