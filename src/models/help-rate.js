import GenkiSimulator from "../worker/genki-simulator?worker";

export default class HelpRate {

  healEffectParameter = [];

  static getHealEffect(data, p, config) {
    // 天井補正したスキル確率
    let baseP = Math.pow(data.p > 0 ? data.p / (1 - Math.pow(1 - data.p, 40 * 3600 / data.speed)) : 1 / (40 * 3600 / data.speed), p[0]);

    // 夜間手伝い回数
    let nightSkillChanceNum = Math.min(data.bagSize + 4, config.sleepTime * 3600 / data.speed / 0.45);

    let nightSkillP = 1 - Math.pow(1 - baseP, nightSkillChanceNum);

    let totalEffect = (
      Math.pow((1 - Math.pow(1 - baseP, data.baseDayHelpNum / (config.checkFreq - 1))) * (config.checkFreq - 1), p[1])
      + Math.pow(nightSkillP, p[2])
    ) * data.effect;

    let result = Math.pow(totalEffect * p[3] + p[4], p[5]) + p[6]

    return result;
  }
  static getHelpRate(healEffect, p) {
    return ((Math.tanh(healEffect * p[0] + p[1]) + 1) / 2) ** p[2] * p[3] + p[4]
  }

  static async inferParameter(config, progressCounter) {

    progressCounter.setName('ヒーラーの性能を計算しています…');

    let workerProgressList = []
    let promiseList = [];
    for (let i = 0; i < config.workerNum; i++) {
      workerProgressList.push(0);

      promiseList.push(new Promise((resolve, reject) => {
        const worker = new GenkiSimulator();

        worker.onmessage = ({ data: { status, body } }) => {
          if (status == 'progress') {
            workerProgressList[i] = body;
            progressCounter.set(workerProgressList.reduce((a, x) => a + x, 0) / workerProgressList.length)
          }
          if (status == 'success') {
            resolve(body)
            worker.terminate();
            progressCounter.set(1)
          }
        }

        worker.postMessage({
          config: JSON.parse(JSON.stringify(config)),
          part: i,
          num: config.workerNum,
        })
      }))
    }

    let dataList = (await Promise.all(promiseList)).flat(1)

    const infer = (dataList, parameterList, f, target) => {
      let direction = parameterList.map(x => 1);

      let bestScore = inferEval(dataList, parameterList, f, target);
      let hit;

      do {
        hit = false;

        for(let i = 0; i < parameterList.length; i++) {
          let diffUnit = Math.max(Math.abs(parameterList[i]) / 1000, 0.0001);

          let mlt = 1;
          let thisHit = false;

          for(let j = 0; j < 2; j++) {
            while(true) {
              let newParameter = [...parameterList];
              newParameter[i] += diffUnit * direction[i] * mlt;
              let newScore = inferEval(dataList, newParameter, f, target);
              if(bestScore > newScore) {
                parameterList = newParameter;
                bestScore = newScore;
                hit = true;
                thisHit = true;
                mlt++;
              } else {
                break;
              }
            }

            if (!thisHit) {
              direction[i] = -direction[i];
            } else {
              break;
            }
          }
        }
      } while(hit);

      return parameterList;
    }

    const inferEval = (dataList, parameterList, f, target) => {
      let score = 0;
      for(let data of dataList) {
        let test = f(data, parameterList)
        score += (data[target] - test) * (data[target] - test)
      }
      return score;
    }

    for(let data of dataList) {
      data.skillCeil = 40 * 3600 / data.speed;

      data.baseDayHelpNum = 0;
      let dayRemainTime = (24 - config.sleepTime) * 3600;
      if (dayRemainTime > 0) {
        let time = 12000 + data.speed * 0.45 / 2;
        data.baseDayHelpNum += Math.min(dayRemainTime, time) / 0.45 / data.speed;
        dayRemainTime -= time;
      }
      if (dayRemainTime > 0) {
        let time = 12000 - (data.speed * 0.45 / 2) + (data.speed * 0.52 / 2);
        data.baseDayHelpNum += Math.min(dayRemainTime, time) / 0.52 / data.speed;
        dayRemainTime -= time;
      }
      if (dayRemainTime > 0) {
        let time = 12000 - (data.speed * 0.52 / 2) + (data.speed * 0.62 / 2);
        data.baseDayHelpNum += Math.min(dayRemainTime, time) / 0.62 / data.speed;
        dayRemainTime -= time;
      }
      if (dayRemainTime > 0) {
        let time = 12000 - (data.speed * 0.62 / 2) + (data.speed * 0.71 / 2);
        data.baseDayHelpNum += Math.min(dayRemainTime, time) / 0.71 / data.speed;
        dayRemainTime -= time;
      }
      if (dayRemainTime > 0) {
        data.baseDayHelpNum += dayRemainTime / data.speed;
      }
    }

    let healEffectParameter = infer(dataList, [0.891, 1.02, 4, 1, -2.304, 1, 0.00156], (data, p) => {
      return this.getHealEffect(data, p, config)
    }, 'totalEffect')

    let evaluateRate = (data, p) => {
      return this.getHelpRate(this.getHealEffect(data, p, config), p)
    }

    let dayHelpParameter   = infer(dataList, [0.0229, -0.500, 1.03, 0.632, 1.590], evaluateRate, 'dayHelpRate')
    let nightHelpParameter = infer(dataList, [0.0274, -1.000, 1.80, 1.236, 0.964], evaluateRate, 'nightHelpRate')

    return {
      healEffectParameter,
      dayHelpParameter,
      nightHelpParameter,
      // diffAverage:
      // diffMax:
    }
  }

}