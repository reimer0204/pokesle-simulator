const cluster = require('node:cluster');
const { availableParallelism } = require('node:os');
const process = require('node:process');
const genkiInfer = require('./genki-infer.js');
const fs = require('fs/promises');
const numCPUs = 4;//availableParallelism();

const NUM = 10000;
// const NUM = 5000;
const RESET = true;

(async () => {

  if (cluster.isPrimary) {
    if (RESET) {
      await fs.writeFile('data.csv', '', { encoding: 'utf-8', flag: 'w' });
    }
  
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
      let skellTokui = Math.random() < 0.7;
      let sleepTime = Math.random() * 7 + 3;
      let checkFreq = Math.floor(Math.random() * 18) + 2;
      let morningHealGenki = Math.min(sleepTime, 8.5) / 8.5 * 100 * (Math.random() * 0.6 + 0.8)
      let p = Math.random() * 0.2;
      let speed = Math.floor(Math.random() * 3000) + 1000;
      let effect = Math.floor(Math.random() * 31);
      let bagSize = Math.floor(Math.random() * 30) + 5;
      let stockLimit = skellTokui ? 2 : 1;
      let skillCeil = skellTokui ? 78 : Math.min(Math.ceil(144000 / speed), 78);
      // let stockLimit = 1;
      // let skillCeil = Math.min(Math.ceil(144000 / speed), 78);
  
      let {totalEffect1, totalEffect2, totalEffect3, dayHelpRate, nightHelpRate} = genkiInfer(sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit);

      buffer += [sleepTime, checkFreq, morningHealGenki, p, speed, effect, bagSize, skillCeil, stockLimit, totalEffect1, totalEffect2, totalEffect3, dayHelpRate, nightHelpRate].join(',') + '\n'
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