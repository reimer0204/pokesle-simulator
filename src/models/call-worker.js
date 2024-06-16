async function callWorker(
  progressCounter,
  workerClass,
  parameterList,
  workerList = [],
) {
  let promiseList = [];
  let workerProgressList = []
  for (let i = 0; i < parameterList.length; i++) {
    workerProgressList.push(0)

    promiseList.push(new Promise((resolve, reject) => {
      const worker = new workerClass();
      workerList.push({ worker, reject })

      worker.onmessage = ({ data: { status, body } }) => {
        if (status == 'error' || status == 'success') {
          workerList.splice(workerList.findIndex(x => x.worker == worker), 1)
        }

        if (status == 'error') {
          reject(body);
          worker.terminate();
        }
        if (status == 'progress') {
          workerProgressList[i] = body;
        }
        if (status == 'success') {
          workerProgressList[i] = 1;
          resolve(body)
          worker.terminate();
        }
        progressCounter.set(workerProgressList.reduce((a, x) => a + x, 0) / workerProgressList.length)
      }

      worker.postMessage(parameterList[i])
    }))
  }
  let result = await Promise.all(promiseList)
  
  progressCounter.set(1)

  return result;
}

export default callWorker;