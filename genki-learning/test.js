const tf = require('@tensorflow/tfjs-node');
const genkiInfer = require('./genki-infer.js');


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
    let [inferMorningEffect, inferDayEffect] = await x2y.predict(tf.tensor2d([
      [sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, p, speed / 3000, effect / 30, bagSize / 20, skillCeil / 88, stockLimit / 2]
    ])).data();
    const [dayHelpRate, nightHelpRate] = await y2z.predict(tf.tensor2d([
      [sleepTime / 8.5, Math.min(sleepTime, 8.5) / 8.5, checkFreq / 10, morningHealGenki / 100, inferMorningEffect, inferDayEffect]
    ])).data();

    // console.log(inferMorningTotalEffect, inferDayTotalEffect, dayHelpRate, nightHelpRate);
    inferMorningEffect *= 100;
    inferDayEffect *= 100;

    return { inferMorningEffect, inferDayEffect, dayHelpRate, nightHelpRate }
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

  for(let i = 0; i < 1; i++) {
    let sleepTime = 5;
    let checkFreq = 10;
    let morningHealGenki = 80
    let p = 0.0838;
    let speed = 2400;
    let effect = 18;
    let bagSize = 28;
    let stockLimit = i + 1;
    let skillCeil = Math.random() < 0.1 ? 88 : Math.min(Math.ceil(144000 / speed), 88);

    let {morningEffect, dayEffect, dayHelpRate, nightHelpRate} = genkiInfer(sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit);
    
    function diff(a, b) {
      console.log(`${`    ${a.toFixed(4)}`.slice(-8)} => ${`    ${b.toFixed(4)}`.slice(-8)} (${`    ${(b - a).toFixed(4)}`.slice(-8)})`);
    }

    async function check(f, countMap) {
      let { inferMorningEffect, inferDayEffect, dayHelpRate: dayHelpRate2, nightHelpRate: nightHelpRate2 } = await f(sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit);

      let dayDiff = dayHelpRate2 - dayHelpRate;
      let nightDiff = nightHelpRate2 - nightHelpRate;

      // if (Math.abs(nightDiff) > 0.3) {
      //   console.log(
      //     { sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit },
      //     { morningEffect, dayEffect, dayHelpRate, nightHelpRate },
      //     { inferMorningEffect, inferDayEffect, dayHelpRate2, nightHelpRate2 }
      //   );
      // }

      if (countMap.dayAbs == null || countMap.dayAbs < Math.abs(dayDiff)) {
        countMap.dayAbs = Math.abs(dayDiff);
      }
      countMap.dayDiffAverage ??= 0;
      countMap.dayDiffAverage += (dayDiff ** 2) / CHECK_NUM;

      if (countMap.nightAbs == null || countMap.nightAbs < Math.abs(nightDiff)) {
        countMap.nightAbs = Math.abs(nightDiff);
      }

      // if (Math.abs(dayDiff) > 0.1 || Math.abs(nightDiff) > 0.1) {
        diff(morningEffect, inferMorningEffect)
        diff(dayEffect, inferDayEffect)
        diff(dayHelpRate, dayHelpRate2)
        diff(nightHelpRate, nightHelpRate2)
        // console.log({ sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit });
      // }

      countMap.nightDiffAverage ??= 0;
      countMap.nightDiffAverage += (nightDiff ** 2) / CHECK_NUM;
    }

    // await check(prototype1, map1);
    await check(prototype2, map2);
  }
  // console.log(map1);
  console.log(map2);
})()