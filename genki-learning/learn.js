// import tf from '@tensorflow/tfjs';
const tf = require('@tensorflow/tfjs-node');
// const tf = require('@tensorflow/tfjs-node-gpu');
const genkiInfer = require('./genki-infer.js');
const fs = require('fs/promises');
const readline = require('readline');

const DATA = 1000000;
const EPOCHS1 = 100;
const EPOCHS2 = 50;
// const EPOCHS = 10;

(async () => {

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
          let [sleepTime, checkFreq, morningHealGenki, p, speed, effect, bagSize, skillCeil, stockLimit, totalEffect1, totalEffect2, totalEffect3, dayHelpRate, nightHelpRate] = values;
          // sleepTime, checkFreq, morningHealGenki, p, speed, effect, bagSize, skillCeil, stockLimit, morningEffect, dayEffect, dayHelpRate, nightHelpRate
          // console.log(stockLimit);
          if (values.every(Number.isFinite)) {
            // totalEffect1 = totalEffect1 / 30
            // totalEffect2 = Math.pow(totalEffect2 / 50, 0.5)
            // totalEffect3 = Math.pow(totalEffect3 / 50, 0.5)

            xDataSet.push([sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, p, speed / 3000, effect / 30, bagSize / 20, skillCeil / 78, stockLimit / 2])
            yDataSet.push([Math.pow(totalEffect2 / 50, 0.5), Math.pow(totalEffect3 / 50, 0.5)])
            y2DataSet.push([sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, totalEffect2 / 50, totalEffect3 / 50])
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

  if(process.argv[2] != 'y2z') {
    const x2y = tf.sequential();
    // xToy.add(tf.layers.dense({units: 20, inputShape: [7]}));
    x2y.add(tf.layers.dense({units: 60, activation: 'relu', inputShape: [10]}));
    x2y.add(tf.layers.dense({units: 60, activation: 'relu'}));
    x2y.add(tf.layers.dense({units: 60, activation: 'relu'}));
    x2y.add(tf.layers.dense({units: 60, activation: 'relu'}));
    x2y.add(tf.layers.dense({units: 60, activation: 'relu'}));
    x2y.add(tf.layers.dense({units: 2}));
    x2y.compile({optimizer: 'adam', loss: 'meanSquaredError'});
  
    const xs = tf.tensor2d(xDataSet);
    const ys = tf.tensor2d(yDataSet);
  
    await x2y.fit(xs, ys, { epochs: EPOCHS1 });
    await x2y.save('file://./x2y')

  } else {
    const y2z = tf.sequential();
    y2z.add(tf.layers.dense({units: 30, activation: 'relu', inputShape: [6]}));
    y2z.add(tf.layers.dense({units: 30, activation: 'relu'}));
    y2z.add(tf.layers.dense({units: 30, activation: 'relu'}));
    y2z.add(tf.layers.dense({units: 30, activation: 'relu'}));
    y2z.add(tf.layers.dense({units: 2}));
    y2z.compile({optimizer: 'adam', loss: 'meanSquaredError'});

    const y2s = tf.tensor2d(y2DataSet);
    const zs = tf.tensor2d(zDataSet);
    
    await y2z.fit(y2s, zs, { epochs: EPOCHS2 });
    await y2z.save('file://./y2z')
  }

})()