

class TimeCounter {

  countMap = {};

  start(key) {
    if(this.countMap[key] === undefined) {
      this.countMap[key] = { start: null, sum: 0, count: 0 }
    }
    this.countMap[key].start = performance.now();
  }

  stop(key) {
    this.countMap[key].sum += performance.now() - this.countMap[key].start;
    this.countMap[key].count++;
  }

  print() {
    Object.entries(this.countMap).forEach(([key, { sum, count }]) => {
      console.log(key, sum);
    })
  }
}

export default TimeCounter;