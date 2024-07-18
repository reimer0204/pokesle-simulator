// import tf from '@tensorflow/tfjs';
const tf = require('@tensorflow/tfjs-node');
// const tf = require('@tensorflow/tfjs-node-gpu');
const genkiInfer = require('./genki-infer.js');
const fs = require('fs/promises');
const readline = require('readline');

const DATA = 1000000;
const EPOCHS = 50;

(async () => {
  
  const x2y = tf.sequential();
  // xToy.add(tf.layers.dense({units: 20, inputShape: [7]}));
  x2y.add(tf.layers.dense({units: 30, inputShape: [9]}));
  x2y.add(tf.layers.dense({units: 30, activation: 'relu'}));
  x2y.add(tf.layers.dense({units: 30, activation: 'relu'}));
  x2y.add(tf.layers.dense({units: 30, activation: 'relu'}));
  x2y.add(tf.layers.dense({units: 30, activation: 'relu'}));
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
    const rs = r.createReadStream('./data.csv');
    const rl = readline.createInterface({ input: rs });
      rl.on('line', (line) => {
        if (line.trim().length && xDataSet.length < DATA) {
          let [sleepTime, checkFreq, morningHealGenki, p, speed, effect, bagSize, skillCeil, morningTotalEffect, dayTotalEffect, dayHelpRate, nightHelpRate] = line.trim().split(',').map(Number)
          if (Number.isFinite(sleepTime) && Number.isFinite(nightHelpRate)) {
            xDataSet.push([sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, p, speed / 3000, effect / 30, bagSize / 20, skillCeil / 88])
            yDataSet.push([morningTotalEffect / 100, dayTotalEffect / 100])
            y2DataSet.push([sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, morningTotalEffect / 100, dayTotalEffect / 100])
            zDataSet.push([dayHelpRate, nightHelpRate])
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

  await x2y.fit(xs, ys, { epochs: EPOCHS });
  await x2y.save('file://./x2y')
  
  await y2z.fit(y2s, zs, { epochs: EPOCHS });
  await y2z.save('file://./y2z')

  // モデルの構築
  // await Promise.all([
  //   (async () => {
  //   })(),
  //   (async () => {
  //   })()
  // ])
})()