import * as tf from '@tensorflow/tfjs';
// import GenkiSimulator from "../worker/genki-simulator?worker";
import type { SimulatedPokemon } from '../type';
tf.setBackend('cpu');

class HelpRate {

  static VERSION = 20240709;

  healEffectParameter = [];

  static _x2yModel = null;
  static _y2zModel = null;
  static isReady;
  static x2yModel;
  static y2zModel;

  static async init() {
    this.isReady = (async () => {
      [this.x2yModel, this.y2zModel] = await Promise.all([
        tf.loadLayersModel(`${location.protocol}//${location.host}/pokesle-simulator/tf/x2y/model.json`),
        tf.loadLayersModel(`${location.protocol}//${location.host}/pokesle-simulator/tf/y2z/model.json`),
      ])
    })()
  }

  static getHealEffect(pokemon: SimulatedPokemon, effect: number, config): [number, number] {
    let [effect1, effect2] = this.x2yModel.predict(tf.tensor2d([
      [
        config.sleepTime / 8.5, 
        Math.min(config.sleepTime, 8.5) / 8.5,
        config.checkFreq / 10,
        pokemon.morningHealGenki / 100,
        pokemon.skillRate,
        pokemon.speed / 3000,
        effect / 30,
        pokemon.bagFullHelpNum / 20,
        pokemon.skillCeil / 88,
        pokemon.base.specialty == 'スキル' ? 1 : 0.5,
      ]
    ])).dataSync();

    effect1 = effect1 * effect1 * 50;
    effect2 = effect2 * effect2 * 50;

    return [effect1, effect2];
  }
  static getHelpRate(morningHealGenki, morningTotalEffect, dayTotalEffect, config) {
    let [day, night] = this.y2zModel.predict(tf.tensor2d([
      [
        config.sleepTime / 8.5, 
        Math.min(config.sleepTime, 8.5) / 8.5,
        config.checkFreq / 10,
        morningHealGenki / 100,
        morningTotalEffect / 50,
        dayTotalEffect / 50
      ]
    ])).dataSync();

    if (day < 1) day = 1;
    if (night < 1) night = 1;

    if (day > 1 / 0.45) day = 1 / 0.45;
    if (night > 1 / 0.45) night = 1 / 0.45;

    return { day, night }
  }

  /*
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
  */

}

HelpRate.init()

export default HelpRate