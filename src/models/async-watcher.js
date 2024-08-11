import { reactive } from "vue";
import ProgressCounter from "./progress-counter";

class AsyncWatcher {

  constructor() {
    this.executingCount = 0;
    this.progressCounter = new ProgressCounter();
    this.resolveList = [];
  }

  static init() {
    return reactive(new AsyncWatcher());
  }

  get name() {
    return this.progressCounter.name;
  }

  get progress() {
    return this.progressCounter.progress;
  }

  get wait() {
    if (this.executingCount == 0) return;
    return new Promise((resolve) => {
      this.resolveList.push(resolve)
    })
  }

  async run(promise) {
    this.executingCount++;
    this.progressCounter = reactive(new ProgressCounter());

    try {
      if (typeof promise == 'function') {
        promise = promise(this.progressCounter);
      }
      const result = await promise;
      return result;
    } catch(e) {
      throw e;
    } finally {
      this.executingCount--;
      if (this.executingCount == 0) {
        this.resolveList.forEach(x => x());
        this.resolveList = []
      }
    }
  }

  setProgress(progress) {
    this.progress = progress;
  }

  get executing() {
    return this.executingCount > 0;
  }
}

export default reactive(new AsyncWatcher());
export {
  AsyncWatcher
}