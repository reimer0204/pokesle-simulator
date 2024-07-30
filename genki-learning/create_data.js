const cluster = require('node:cluster');
const { availableParallelism } = require('node:os');
const process = require('node:process');
const genkiInfer = require('./genki-infer.js');
const fs = require('fs/promises');
const numCPUs = 4;//availableParallelism();

const NUM = 1000000;
// const NUM = 5000;

(async () => {
  if (cluster.isPrimary) {
  
    // Fork workers.
    let count = 0;
    let buffer = '';
    let startAt = performance.now();
    let promiseList = []

    for (let i = 0; i < numCPUs; i++) {
      let worker = cluster.fork();
      worker.on('message', async function(msg) {
        buffer += msg.buffer;
        count += msg.count;
        console.log(`${count} / ${NUM}`, (performance.now() - startAt) * (NUM - count) / count);

        if (buffer.length > 100000) {
          await fs.writeFile('data.csv', buffer, { encoding: 'utf-8', flag: 'a' });
          buffer = '';
        }
      });

      promiseList.push(new Promise(resolve => {
        cluster.on('exit', (worker2, code, signal) => {
          if (worker == worker2) {
            resolve();
            console.log(`worker ${worker2.process.pid} died`);
          }
        });
      }))
    }

    await Promise.all(promiseList)
    await fs.writeFile('data.csv', buffer, { encoding: 'utf-8', flag: 'a' });
  
  } else {
    let buffer = '';
    let count = 0;
    let LOOP = Math.ceil(NUM / numCPUs);
    
    for(let i = 0; i < LOOP; i++) {
      let sleepTime = Math.random() * 5 + 5;
      let checkFreq = Math.floor(Math.random() * 18) + 2;
      let morningHealGenki = Math.min(sleepTime, 8.5) / 8.5 * 100 * (Math.random() * 0.6 + 0.8)
      let p = Math.random() * 0.2;
      let speed = Math.floor(Math.random() * 3000) + 1000;
      let effect = Math.floor(Math.random() * 31);
      let bagSize = Math.floor(Math.random() * 30) + 5;
      let stockLimit = Math.floor(Math.random() * 2) + 1;
      let skillCeil = Math.random() < 0.1 ? 88 : Math.min(Math.ceil(144000 / speed), 88);
  
      let {morningEffect, dayEffect, dayHelpRate, nightHelpRate} = genkiInfer(sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit);

      buffer += [sleepTime, checkFreq, morningHealGenki, p, speed, effect, bagSize, skillCeil, stockLimit, morningEffect, dayEffect, dayHelpRate, nightHelpRate].join(',') + '\n'
      count++;
      if (buffer.length > 10000) {
        process.send({ count, buffer });
        buffer = '';
        count = 0;
      }
    }
    process.send({ count, buffer });
    process.exit();
  }
  
  
})()