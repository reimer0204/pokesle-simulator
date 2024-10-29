

class TimeCounter {

  countMap = {};

  add(key, f) {
    let now = performance.now();
    let result = f()

    let past = performance.now() - now;
    if(this.countMap[key] === undefined) this.countMap[key] = { sum: 0, count: 0 }
    this.countMap[key].sum += past;
    this.countMap[key].count++;

    return result;
  }

  print() {
    Object.entries(this.countMap).forEach(([key, { sum, count }]) => {
      console.log(`${key} => ${sum}us`);
    })
  }
}

export default TimeCounter;