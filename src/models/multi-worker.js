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
  }

  async call(
    progressCounter,
    parameterFunction,
    progressCallback = null,
  ) {
    let promiseList = [];
    let workerProgressList = []
    for (let i = 0; i < this.clusterList.length; i++) {
      let cluster = this.clusterList[i];
      let parameter = parameterFunction(i, this.clusterList.length);
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
          progressCounter.set(workerProgressList.reduce((a, x) => a + x, 0) / workerProgressList.length)

          if(status == 'error' || status == 'success') {
            this.rejectList = this.rejectList.filter(r => r != reject)
            return true;
          }
        })
        
        cluster.postMessage(parameter)
      }))
    }
    let result = await Promise.all(promiseList)
    
    progressCounter.set(1)

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