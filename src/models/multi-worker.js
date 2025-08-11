import config from "./config";

class Cluster {
  constructor(workerClass) {
    this.worker = new workerClass();
    this.callbackList = [];

    this.worker.onmessage = (event) => {
      let newCallbackList = []
      for(let callback of this.callbackList) {
        if(!callback(event.data)) {
          newCallbackList.push(callback)
        }
      }
      this.callbackList = newCallbackList;
    }

    this.worker.onerror = (event) => {
      let newCallbackList = []
      for(let callback of this.callbackList) {
        if(!callback({ status: 'error', data: event.data })) {
          newCallbackList.push(callback)
        }
      }
      this.callbackList = newCallbackList;
    }
  }

  postMessage(message) {
    this.worker.postMessage(message)
  }

  addCallback(callback) {
    this.callbackList.push(callback);
  }

  clearCallback() {
    this.callbackList = [];
  }

  terminate() {
    this.worker.terminate();
  }
}

class MultiWorker {
  constructor(workerClass, workerNum = null) {
    this.clusterList = new Array(workerNum ?? config.workerNum).fill(0).map(() => (new Cluster(workerClass)))
    this.rejectList = [];
    this.executingPromiseList = [];
  }

  async call(
    progressCounter,
    parameterFunction,
    progressCallback = null,
    threadNum = null,
  ) {
    const executingPromise = (async () => {
      try {
        await Promise.all(this.executingPromiseList)
      } finally {

      }

      const startAt = performance.now();

      let promiseList = [];
      let workerProgressList = []
      threadNum ??= this.clusterList.length
      for (let i = 0; i < threadNum; i++) {
        let cluster = this.clusterList[i];
        let parameter = parameterFunction(i, threadNum);
        workerProgressList.push(0)

        promiseList.push(new Promise((resolve, reject) => {
          this.rejectList.push(reject)

          cluster.addCallback(({ status, body }) => {
            if (status == 'error') {
              reject(body);
            }
            if (status == 'progress') {
              if (progressCallback) {
                body = progressCallback(i, body, this.clusterList)
              }
              workerProgressList[i] = body;
            }
            if (status == 'success') {
              workerProgressList[i] = 1;
              resolve(body)
            }
            progressCounter?.set(workerProgressList.reduce((a, x) => a + x, 0) / workerProgressList.length)

            if(status == 'error' || status == 'success') {
              this.rejectList = this.rejectList.filter(r => r != reject)
              return true;
            }
          })
          
          cluster.postMessage(parameter)
        }))
      }
      let result = await Promise.all(promiseList)
      
      progressCounter?.set(1)

      console.debug('実行時間(秒)', ((performance.now() - startAt) / 1000).toFixed(2));

      return result;
    })();

    this.executingPromiseList.push(executingPromise)
    const result = await executingPromise;
    this.executingPromiseList = this.executingPromiseList.filter(x => x != executingPromise)

    return result;
  }

  async reject() {
    for(let reject of this.rejectList) {
      reject();
    }
    for(let cluster of this.clusterList) {
      cluster.clearCallback();
    }
    this.rejectList = [];
  }

  close() {
    for(let worker of this.clusterList) {
      worker.terminate();
    }
  }
}

export default MultiWorker;