// import tf from '@tensorflow/tfjs';
const tf = require('@tensorflow/tfjs-node');
// const tf = require('@tensorflow/tfjs-node-gpu');
const genkiInfer = require('./genki-infer.js');
const fs = require('fs/promises');
const readline = require('readline');

const DATA = 1000000;
const EPOCHS1 = 100;
const EPOCHS2 = 100;
// const EPOCHS = 10;

(async () => {
  
  const x2y = tf.sequential();
  // xToy.add(tf.layers.dense({units: 20, inputShape: [7]}));
  x2y.add(tf.layers.dense({units: 40, activation: 'relu', inputShape: [10]}));
  x2y.add(tf.layers.dense({units: 40, activation: 'relu'}));
  x2y.add(tf.layers.dense({units: 40, activation: 'relu'}));
  x2y.add(tf.layers.dense({units: 40, activation: 'relu'}));
  x2y.add(tf.layers.dense({units: 40, activation: 'relu'}));
  x2y.add(tf.layers.dense({units: 40, activation: 'relu'}));
  x2y.add(tf.layers.dense({units: 2}));
  x2y.compile({optimizer: 'adam', loss: 'meanSquaredError'});
  
  const y2z = tf.sequential();
  y2z.add(tf.layers.dense({units: 20, inputShape: [6]}));
  y2z.add(tf.layers.dense({units: 20, activation: 'relu'}));
  y2z.add(tf.layers.dense({units: 20, activation: 'relu'}));
  y2z.add(tf.layers.dense({units: 20, activation: 'relu'}));
  y2z.add(tf.layers.dense({units: 2}));
  y2z.compile({optimizer: 'adam', loss: 'meanSquaredError'});

  let xDataSet = []
  let yDataSet = []
  let y2DataSet = []
  let zDataSet = []

  await new Promise(async resolve => {
    const r = await fs.open('./data.csv');
    const rs = r.createReadStream();
    const rl = readline.createInterface({ input: rs });
      rl.on('line', (line) => {
        if (line.trim().length && xDataSet.length < DATA) {
          let values = line.trim().split(',').map(Number)
          let [sleepTime, checkFreq, morningHealGenki, p, speed, effect, bagSize, skillCeil, stockLimit, morningEffect, dayEffect, dayHelpRate, nightHelpRate] = values;
              //  sleepTime, checkFreq, morningHealGenki, p, speed, effect, bagSize, skillCeil, stockLimit, morningEffect, dayEffect, dayHelpRate, nightHelpRate
          // console.log(stockLimit);
          if (values.every(Number.isFinite) && 3.0 <= sleepTime && sleepTime <= 10.0) {
            xDataSet.push([sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, p, speed / 3000, effect / 30, bagSize / 20, skillCeil / 88, stockLimit / 2])
            yDataSet.push([morningEffect / 100, dayEffect / 100])
            y2DataSet.push([sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, morningEffect / 100, dayEffect / 100])
            zDataSet.push([dayHelpRate, nightHelpRate])

            // console.log(sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, morningEffect / 100, dayEffect / 100, dayHelpRate, nightHelpRate);
          }
        } else {
          resolve();
          r.close();
        }
      });
      rl.on('close', () => {
        resolve();
        r.close();
      });
  })

  const xs = tf.tensor2d(xDataSet);
  const ys = tf.tensor2d(yDataSet);
  const y2s = tf.tensor2d(y2DataSet);
  const zs = tf.tensor2d(zDataSet);

  await x2y.fit(xs, ys, { epochs: EPOCHS1 });
  await x2y.save('file://./x2y')
  
  // await y2z.fit(y2s, zs, { epochs: EPOCHS2 });
  // await y2z.save('file://./y2z')
  
  // for(let i = 0; i < 10; i++) {
  //   let sleepTime = Math.floor(Math.random() * 48 + 1) / 4;
  //   let checkFreq = Math.floor(Math.random() * 18) + 2;
  //   let morningHealGenki = Math.min(sleepTime, 8.5) / 8.5 * 100 * (Math.random() * 0.6 + 0.8)
  //   let p = Math.random() * 0.2;
  //   let speed = Math.floor(Math.random() * 3000) + 1000;
  //   let effect = Math.floor(Math.random() * 31);
  //   let bagSize = Math.floor(Math.random() * 30) + 5;
  //   let stockLimit = Math.floor(Math.random() * 2) + 1;
  //   let skillCeil = Math.random() < 0.1 ? 88 : Math.min(Math.ceil(144000 / speed), 88);

  //   let {morningEffect, dayEffect, dayHelpRate, nightHelpRate} = genkiInfer(sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit);

  //   let [inferMorningEffect, inferDayEffect] = await x2y.predict(tf.tensor2d([
  //     [sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, p, speed / 3000, effect / 30, bagSize / 20, skillCeil / 88, stockLimit / 2]
  //   ])).data();
  //   inferMorningEffect *= 100;
  //   inferDayEffect *= 100;

  //   console.log(`${morningEffect.toFixed(4)} => ${inferMorningEffect.toFixed(4)} (${(inferMorningEffect - morningEffect).toFixed(4)})`)
  //   console.log(`${dayEffect.toFixed(4)} => ${inferDayEffect.toFixed(4)} (${(inferDayEffect - dayEffect).toFixed(4)})`)
  // }
})()