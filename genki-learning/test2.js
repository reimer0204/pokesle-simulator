// const tf = require('@tensorflow/tfjs-node');
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
      if (diff.option) {
        console.log(diff.option);
      }
    }

  }
}

(async () => {
  const GENKI_LIST = [
    { border: 80, effect: 0.45 },
    { border: 60, effect: 0.52 },
    { border: 40, effect: 0.58 },
    { border: 0, effect: 0.66 },
  ]

  for(let i = 0; i < 1; i++) {
    // let skillTokui = Math.random() < 0.7;
    // let sleepTime = Math.random() * 7 + 3;
    // let checkFreq = Math.floor(Math.random() * 18) + 2;
    // let morningHealGenki = Math.min(sleepTime, 8.5) / 8.5 * 100 * (Math.random() * 0.6 + 0.8)
    // let p = Math.random() * 0.2;
    // let speed = Math.floor(Math.random() * 2000) + 2000;
    // let effect = Math.floor(Math.random() * 31);
    // let bagSize = Math.floor(Math.random() * 30) + 5;
    // let stockLimit = skillTokui ? 2 : 1;
    // let skillCeil = skillTokui ? Math.min(Math.ceil(144000 / speed), 78) : 78;

    let skillTokui = true;
    let sleepTime = 8.5;
    let checkFreq = 10;
    let morningHealGenki = 100
    let p = 0.0455;
    let speed = 1693;
    let effect = 18;
    let bagSize = 30;
    let stockLimit = skillTokui ? 2 : 1;
    let skillCeil = skillTokui ? Math.min(Math.ceil(144000 / speed), 78) : 78;

    // {totalEffect1, totalEffect2, totalEffect3, dayHelpRate, nightHelpRate}
    let correct = genkiInfer(sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit);

    const ceilSkillRate = p > 0 ? p / (1 - Math.pow(1 - p, skillCeil)) : 1 / skillCeil;
    const nightLength = Math.round(sleepTime * 3600)
    const dayLength = 86400 - nightLength

    let morningGenki = 0;
    let beforeNightHelp = Math.floor(nightLength / speed);
    let dayHelpNum = 0;
    let nightHelpNum = 0;
    let c = 0;
    let effectList = []
    for(let j = 0; j < 3; j++) {
      
      dayHelpNum = 0;   // 日中の手伝い回数
      nightHelpNum = 0; // 睡眠中の手伝い回数
      effectList = []
      
      let unPickHelpNum = beforeNightHelp;  // 昨日の夜の手伝い回数で初期化
      let beforeHelp = 0; // 前回のおてつだい時刻
      let checkNum = 0;   // タップ回数
      let nextCheck = 0;  // 次のタップ時刻
      let nextHelp = 0;   // 次の手伝い時刻
      let time = 0;       // 前回のイベント発生時刻
      let genki = Math.min(morningGenki + morningHealGenki, 100); // 起床時のげんき

      if (false) {
        while(true) {
          let nextTime = Math.min(nextCheck, nextHelp, 86400)
          genki = Math.max(genki - (nextTime - time) / 600, 0)
          time = nextTime;
          c++;

          if (time >= nextCheck) {
            if (checkNum == checkFreq) {
              morningGenki = genki;
              break;
            }

            if (effect > 0) {
              console.log(unPickHelpNum);
              const skillableHelpNum = Math.min(unPickHelpNum, bagSize + 4)

              let nightNoHit = (1 - ceilSkillRate) ** skillableHelpNum;
              let skillNum;
              if (stockLimit == 2) {
                let nightOneHit = skillableHelpNum >= 1 ? (1 - ceilSkillRate) ** (skillableHelpNum - 1) * ceilSkillRate * skillableHelpNum : 0;
                let nightTwoHit = skillableHelpNum >= 2 ? 1 - nightNoHit - nightOneHit : 0
                skillNum = nightTwoHit * 2 + nightOneHit;
              } else {
                skillNum = 1 - nightNoHit;
              }
              genki = Math.max(Math.min(genki + skillNum * effect, 150), 0)

              effectList.push({ effect: skillNum * effect, time })
            }
            nextHelp = beforeHelp + speed * (
              genki > 80 ? 0.45 :
              genki > 60 ? 0.52 :
              genki > 40 ? 0.58 :
              genki > 0 ? 0.66 :
              1
            )

            unPickHelpNum = 0;
            
            checkNum++;
            if (checkNum < checkFreq) {
              nextCheck = dayLength * checkNum / (checkFreq - 1)
            } else if (checkNum == checkFreq) {
              nextCheck = 86400;
            } else {
              break;
            }
          }

          if (time >= nextHelp) {
            unPickHelpNum++;

            if (time < dayLength) {
              dayHelpNum++;
            } else {
              nightHelpNum++;
            }
            
            beforeHelp = nextHelp;
            nextHelp = beforeHelp + speed * (
              genki > 80 ? 0.45 :
              genki > 60 ? 0.52 :
              genki > 40 ? 0.58 :
              genki > 0 ? 0.66 :
              1
            )
          }
        }
      } else {
        while(true) {
          let nextTime = Math.min(nextCheck, 86400)
          let beforeGenki = genki;
          genki = Math.max(genki - (nextTime - time) / 600, 0)
          
          // 次のイベントの時間までおてつだい回数を加算
          for(let { border, effect } of GENKI_LIST) {
            // げんきが足りなければ次のげんきボーダーチェックに進む
            if (beforeGenki <= border) continue;

            let fixedSpeed = speed * effect;
            if (beforeHelp + fixedSpeed <= nextTime) {
              // 次イベントか、次おてつだいのペースが変わる時間か
              const remainTime = Math.min(nextTime, time + (beforeGenki - border) * 600 + fixedSpeed) - beforeHelp
              const num = Math.floor(remainTime / fixedSpeed);
              const pastTime = num * fixedSpeed;
              unPickHelpNum += num;
              beforeHelp += pastTime
              beforeGenki = Math.max(beforeGenki - pastTime / 600, 0);
              time = beforeHelp
            } else {
              break;
            }
          }
          // げんきが空になってもまだ時間があるならお手伝い
          if (beforeHelp + speed <= nextTime) {
            const remainTime = nextTime - beforeHelp
            const num = Math.floor(remainTime / speed);
            const pastTime = num * speed;
            unPickHelpNum += num;
            beforeHelp += pastTime
          }
          // console.log(nextTime, unPickHelpNum);
          
          time = nextTime;
          c++;
          
          if (time == 86400) {
            morningGenki = genki;
            break;
          }

          if (time >= nextCheck && checkNum < checkFreq) {
            console.log(unPickHelpNum);
            const skillableHelpNum = Math.min(unPickHelpNum, bagSize + 4)

            let nightNoHit = (1 - ceilSkillRate) ** skillableHelpNum;
            let skillNum;
            if (stockLimit == 2) {
              let nightOneHit = skillableHelpNum >= 1 ? (1 - ceilSkillRate) ** (skillableHelpNum - 1) * ceilSkillRate * skillableHelpNum : 0;
              let nightTwoHit = skillableHelpNum >= 2 ? 1 - nightNoHit - nightOneHit : 0
              skillNum = nightTwoHit * 2 + nightOneHit;
            } else {
              skillNum = 1 - nightNoHit;
            }
            genki = Math.max(Math.min(genki + skillNum * effect, 150), 0)

            effectList.push({ effect: skillNum * effect, time })

            unPickHelpNum = 0;
            
            checkNum++;
            if (checkNum < checkFreq) {
              nextCheck = dayLength * checkNum / (checkFreq - 1)
            } else {
              nextCheck = 86400;
            }
          }
        }

      }

      beforeNightHelp = unPickHelpNum
    }

    // げんき変動の一覧から日中と夜間の手伝い回数の比率を算出する処理
    let genki = Math.min(morningGenki + morningHealGenki, 100);
    let t = 0;
    let dayHelpRate = 0;
    let nightHelpRate = 0;
    if (!effectList.length || effectList[effectList.length - 1].time != dayLength) {
      effectList.push({ effect: 0, time: dayLength })
    }
    effectList.push({ effect: 0, time: 86400, night: true })
    for(let { effect, time, night } of effectList) {
      let pastTime = time - t;
      let addRate = 0;

      if (genki > 80) {
        let thisTime = Math.min((genki - 80) * 600, pastTime);
        pastTime -= thisTime;
        genki -= thisTime / 600;
        addRate += thisTime / 0.45;
      }
      if (genki > 60) {
        let thisTime = Math.min((genki - 60) * 600, pastTime);
        pastTime -= thisTime;
        genki -= thisTime / 600;
        addRate += thisTime / 0.52;
      }
      if (genki > 40) {
        let thisTime = Math.min((genki - 40) * 600, pastTime);
        pastTime -= thisTime;
        genki -= thisTime / 600;
        addRate += thisTime / 0.58;
      }
      if (genki > 0) {
        let thisTime = Math.min(genki * 600, pastTime);
        pastTime -= thisTime;
        genki -= thisTime / 600;
        addRate += thisTime / 0.66;
      }
      if (genki <= 0) {
        genki = 0;
        addRate += pastTime
      }

      if (night) {
        nightHelpRate += addRate;
      } else {
        dayHelpRate += addRate;
      }

      t = time;
      genki = Math.min(Math.max(0, effect + genki), 150);
    }
    dayHelpRate /= dayLength;
    nightHelpRate /= nightLength;


    const newResult = {
      dayHelpRate: dayHelpNum / (dayLength / speed),
      nightHelpRate: nightHelpNum / (nightLength / speed),
    }

    // console.log({
    //   sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit
    // })
    console.log({ dayHelpRate, nightHelpRate })
    console.log(newResult);
    console.log(correct);
    console.log(c);
    // console.log(totalEffect1, totalEffect2, totalEffect3, dayHelpRate, nightHelpRate);
    // continue;

    // function diff(a, b) {
    //   console.log(`${`    ${a.toFixed(4)}`.slice(-8)} => ${`    ${b.toFixed(4)}`.slice(-8)} (${`    ${(b - a).toFixed(4)}`.slice(-8)})`);
    // }
  }

  // console.log(map1);
  // console.log(map2);
})()