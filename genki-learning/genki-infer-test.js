const cluster = require('node:cluster');
const { availableParallelism } = require('node:os');
const process = require('node:process');
const genkiInfer = require('./genki-infer.js');
const fs = require('fs/promises');
const numCPUs = 4;//availableParallelism();

// let {totalEffect1, totalEffect2, totalEffect3, dayHelpRate, nightHelpRate} = genkiInfer(
//   sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit
// );
console.log(genkiInfer(
  8.5, // sleepTime,
  10, // checkFreq,
  100, // morningHealGenki,
  0.0504, // p,
  2010, // speed,
  60, // skillCeil,
  18.1, // effect,
  48.7, // bagSize,
  2, // stockLimit
));
