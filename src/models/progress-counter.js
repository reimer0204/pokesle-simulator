export default class ProgressCounter {

  _progress = 0;
  beforeWaitAt = new Date();
  children = null;

  get progress() {
    if(this.children == null) {
      return this._progress;
    } else {
      return this.children.reduce((a, x) => a + x.counter.progress * x.weight, 0)
    }
  }

  get name() {
    let names = [];
    if (this._name) names.push(this._name)

    if(this.children) {
      for(let child of this.children) {
        if (child.counter.name && child.counter.progress < 1) {
          names.push(child.counter.name)
        }
      }
    }

    return names.join('\n')
  }

  set(progress) {
    this._progress = progress;
  }

  setName(name) {
    this._name = name;
  }

  split(...weights) {
    let weightSum = weights.reduce((a, x) => a + x, 0);
    let counterList = [];
    this.children = weights.map(weight => {
      let counter = reactive(new ProgressCounter());
      counterList.push(counter);

      return {
        weight: weight / weightSum,
        counter,
      }
    })

    return counterList;
  }
}