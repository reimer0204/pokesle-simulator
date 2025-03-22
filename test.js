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

  calcCombination(n, i) {
    let combination = 1;
    for(let j = 0; j < i; j++) {
      combination *= (n - j) / (j + 1)
    }
    return combination;
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

// console.log(new ProbBorder(0.5).calcCombination(10, 6))

let x = 123456789;
let y = 362436069;
let z = 521288629;
let w = 1000;

let probBorder = new ProbBorder(0.7)
// console.log(0.3 * 100 * (2 + 5 + 7) / 3)
// console.log(probBorder.get(0.3, 100) * (2 + 5 + 7) / 3)
// console.log(probBorder.get(0.1, 100) * 14)
// console.log(probBorder.get(0.3, 100) * 2 + probBorder.get(0.2, 100) * 3 + probBorder.get(0.1, 100) * 2)
console.log(probBorder.get(0.2, 100))
console.log(probBorder.get(0.4, 50))
console.log(probBorder.get(0.5, 40))
console.log(probBorder.get(1.0, 20))

/*
setTimeout(() => {
  let startAt = new Date();
  let t;
  for(let i = 0; i < 10000000; i++) {
    t = x ^ (x << 11);
    x = y;
    y = z; 
    z = w;
    w = (w ^ (w >>> 19)) ^ (t ^ (t >>> 8)); 
    let p = (w % 100) * 0.0005 + 0.07
    
    t = x ^ (x << 11);
    x = y;
    y = z; 
    z = w;
    w = (w ^ (w >>> 19)) ^ (t ^ (t >>> 8)); 
    let n = (w % 20) + 70
  
    probBorder.get(p, n)
  
  }
  console.log(new Date() - startAt);
  console.log(probBorder.printStatistics())
  // console.log(new ProbBorder(0.9).get(1/3, 30))
}, 1000)
*/