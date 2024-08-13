const tf = require('@tensorflow/tfjs-node');
const genkiInfer = require('./genki-infer.js');


class Diff {
  constructor(name, border) {
    this.name = name;
    this.border = border;
    this._average1 = 0;
    this._average2 = 0;
    this.count = 0;
    this.diffList = []
  }

  add(x, y, option) {
    let diff = x - y;
    let abs = Math.abs(diff);
    if (this.abs == null || this.abs < abs) {
      if (abs > this.border) {
        this.diffList.push({ x, y, option })
      }
      this.abs = abs;
    }

    this._average1 += abs;
    this._average2 += diff ** 2;
    this.count++;
  }

  get average1() {
    return this._average1 / this.count;
  }

  get average2() {
    return Math.sqrt(this._average2 / this.count);
  }

  showSummary() {
    console.log(`name = ${this.name}`);
    console.log(`average1 = ${this.average1}`);
    console.log(`average2 = ${this.average2}`);
    console.log(`maxAbs = ${this.abs}`);
    for(let diff of this.diffList) {
      console.log(`${`    ${diff.x.toFixed(4)}`.slice(-8)} => ${`    ${diff.y.toFixed(4)}`.slice(-8)} (${`    ${(diff.y - diff.x).toFixed(4)}`.slice(-8)})`);
      console.log(diff.option);
    }

  }
}

(async () => {

  // 旧計算式
  function prototype1(sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize) {
    const GENKI_EFFECT = [0, 0.45, 0.52, 0.62, 0.71, 1.00];
    const dayHelpParameter = [0.0229, -0.5, 1.03, 0.632, 1.59]
    const nightHelpParameter = [0.0274, -1, 1.8, 1.236, 0.964]
    const healEffectParameter = [ 0.8908920771995367, 1.0333398524506143, 3.122748153136004, 0.9920279440699441, -2.1693906087220047, 1, 0.017959999999999993]
    let baseDayHelpNum = 0;
    let dayRemainTime = (24 - sleepTime) * 3600;

    for(let i = 0; i < 4; i++) {
      if (dayRemainTime > 0) {
        let time = 12000 - speed * GENKI_EFFECT[i] / 2 + speed * GENKI_EFFECT[i + 1] / 2;
        baseDayHelpNum += Math.min(dayRemainTime, time) / GENKI_EFFECT[i + 1] / speed;
        dayRemainTime -= time;
      } else {
        break;
      }
    }
    if (dayRemainTime > 0) {
      baseDayHelpNum += dayRemainTime / speed;
    }

    // 天井補正したスキル確率
    let baseP = Math.pow(p > 0 ? p / (1 - Math.pow(1 - p, 40 * 3600 / speed)) : 1 / (40 * 3600 / speed), healEffectParameter[0]);

    // 夜間手伝い回数
    let nightSkillChanceNum = Math.min(bagSize + 4, sleepTime * 3600 / speed / 0.45);

    let nightSkillP = 1 - Math.pow(1 - baseP, nightSkillChanceNum);

    let totalEffect = (
      Math.pow((1 - Math.pow(1 - baseP, baseDayHelpNum / (checkFreq - 1))) * (checkFreq - 1), healEffectParameter[1])
      + Math.pow(nightSkillP, healEffectParameter[2])
    ) * effect;

    let result = Math.pow(totalEffect * healEffectParameter[3] + healEffectParameter[4], healEffectParameter[5]) + healEffectParameter[6]

    return {
      dayHelpRate: ((Math.tanh(result * dayHelpParameter[0] + dayHelpParameter[1]) + 1) / 2) ** dayHelpParameter[2] * dayHelpParameter[3] + dayHelpParameter[4], 
      nightHelpRate: ((Math.tanh(result * nightHelpParameter[0] + nightHelpParameter[1]) + 1) / 2) ** nightHelpParameter[2] * nightHelpParameter[3] + nightHelpParameter[4]
    }
  }

  const x2y = await tf.loadLayersModel('file://./x2y/model.json');
  const y2z = await tf.loadLayersModel('file://./y2z/model.json');

  async function prototype2(sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit) {
    let [totalEffect1, totalEffect2, totalEffect3] = await x2y.predict(tf.tensor2d([
      [sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, p, speed / 3000, effect / 30, bagSize / 20, skillCeil / 78, stockLimit / 2]
    ])).data();
    const [dayHelpRate, nightHelpRate] = await y2z.predict(tf.tensor2d([
      [sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, totalEffect1, totalEffect2, totalEffect3]
    ])).data();

    // console.log(inferMorningTotalEffect, inferDayTotalEffect, dayHelpRate, nightHelpRate);
    totalEffect1 *= 30
    totalEffect2 *= 30
    totalEffect3 *= 30
    // dayEffect *= 30;
    // nightEffect *= 30;

    return { totalEffect1, totalEffect2, totalEffect3, dayHelpRate, nightHelpRate }
  }

  const CHECK_NUM = 100;
  let map1 = {};
  let map2 = {};
  let diffAverage = 0;
  
  let sleepTime = Math.floor(Math.random() * 21) / 4 + 5;
  let checkFreq = Math.floor(Math.random() * 18) + 2;
  let morningHealGenki = Math.min(sleepTime, 8.5) / 8.5 * 100 * (Math.random() * 0.6 + 0.8)
  let p = Math.random() * 0.2;
  let speed = Math.floor(Math.random() * 3000) + 1000;
  let effect = Math.floor(Math.random() * 31);
  let bagSize = Math.floor(Math.random() * 30) + 5;
  // let stockLimit = Math.floor(Math.random() * 2) + 1;

  let effect1diff = new Diff('effect1', 1);
  let effect2diff = new Diff('effect2', 1);
  let effect3diff = new Diff('effect3', 1);
  let rate1 = new Diff('rate1', 0.1);
  let rate2 = new Diff('rate2', 0.1);

  for(let i = 0; i < 100; i++) {
    // let sleepTime = 8.5;
    // let checkFreq = 10;
    // let morningHealGenki = 80
    // let p = 0.0838;
    // let speed = 2400;
    // let effect = 18;
    // let bagSize = 28;
    // let stockLimit = i + 1;
    // let skillCeil = Math.random() < 0.1 ? 78 : Math.min(Math.ceil(144000 / speed), 78);

    // let sleepTime = 8.5;
    // let checkFreq = 10;
    // let morningHealGenki = 100
    // let p = 0.0838;
    // let speed = 2400;
    // let effect = 18;
    // let bagSize = 28;
    // let stockLimit = 2;
    // let skillCeil = Math.min(Math.ceil(144000 / speed), 78);
    
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
    // console.log(totalEffect1, totalEffect2, totalEffect3, dayHelpRate, nightHelpRate);
    // continue;
    
    function diff(a, b) {
      console.log(`${`    ${a.toFixed(4)}`.slice(-8)} => ${`    ${b.toFixed(4)}`.slice(-8)} (${`    ${(b - a).toFixed(4)}`.slice(-8)})`);
    }

    async function check(f, countMap) {
      let {
        totalEffect1: inferTotalEffect1,
        totalEffect2: inferTotalEffect2,
        totalEffect3: inferTotalEffect3,
        // nightEffect: inferNightEffect,
        dayHelpRate: inferDayHelpRate, nightHelpRate: inferNightHelpRate
      } = 
        await f(sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit);
        
      effect1diff.add(totalEffect1, inferTotalEffect1)
      effect2diff.add(totalEffect2, inferTotalEffect2)
      effect3diff.add(totalEffect3, inferTotalEffect3)
      rate1.add(dayHelpRate, inferDayHelpRate, { inferTotalEffect1, inferTotalEffect2, inferTotalEffect3, sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit })
      rate2.add(nightHelpRate, inferNightHelpRate, { inferTotalEffect1, inferTotalEffect2, inferTotalEffect3, sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit })

      let dayDiff = inferDayHelpRate - dayHelpRate;
      let nightDiff = inferNightHelpRate - nightHelpRate;

      // if (Math.abs(nightDiff) > 0.1) {
      //   console.log(
      //     { sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit },
      //   );
        
      //   diff(dayEffect, inferDayEffect)
      //   diff(nightEffect, inferNightEffect)
      //   diff(dayHelpRate, inferDayHelpRate)
      //   diff(nightHelpRate, inferNightHelpRate)
      // }

      // if (countMap.dayAbs == null || countMap.dayAbs < Math.abs(dayDiff)) {
      //   countMap.dayAbs = Math.abs(dayDiff);
      // }
      // countMap.dayDiffAverage ??= 0;
      // countMap.dayDiffAverage += (dayDiff ** 2) / CHECK_NUM;

      // if (countMap.nightAbs == null || countMap.nightAbs < Math.abs(nightDiff)) {
      //   countMap.nightAbs = Math.abs(nightDiff);
      // }

      // countMap.nightDiffAverage ??= 0;
      // countMap.nightDiffAverage += (nightDiff ** 2) / CHECK_NUM;
    }

    // await check(prototype1, map1);
    await check(prototype2, map2);
  }

  effect1diff.showSummary();
  effect2diff.showSummary();
  effect3diff.showSummary();
  rate1.showSummary();
  rate2.showSummary();

  // console.log(map1);
  console.log(map2);
})()