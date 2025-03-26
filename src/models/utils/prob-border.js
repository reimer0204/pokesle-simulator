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
    for(let i = 0; i < n; i++) {
      
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

    return this.#cache[key] = (n - 1) + (this.#reverseBorder - sumP) / (1 - sumP);
  }
}

export default ProbBorder;