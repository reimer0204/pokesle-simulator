const LOOP_NUM = 10000;

module.exports = function genkiInfer(sleepTime, checkFreq, morningHealGenki, p, speed, skillCeil, effect, bagSize, stockLimit) {
  
  let dayTime = 86400 - sleepTime * 3600;
  let checkDuration = dayTime / (checkFreq - 1);

  let totalSkillNum = 0;
  let totalMorningSkillNum = 0;

  let totalEffect1 = 0;
  let totalEffect2 = 0;
  let totalEffect3 = 0;

  let totalGenkiAtSleep = 0;
  let dayHelpNum = 0;
  let nightHelpNum = 0;


  let genki = 100;          // げんき
  let skillStock = 0;     // スキル発動可能状態か
  let skillNoHitCount = 0;  // 天井カウント
  let bag = 0;              // かばん
  let checkCount = 0;       // 今日のチェックした回数
  let time = 0;             //
  let day = 0;

  let nextCheckAt = 0;
  let nextHelpAt = 0;
  let beforeHelpAt = 0;
  let nextDayChangeAt = 86400;

  let helpQueue = [];

  function fillHelpQueue() {
    while(helpQueue.length < 5) {
      let baseTime = helpQueue.length ? helpQueue.at(-1) : beforeHelpAt
      let afterGenki = genki - Math.max(baseTime - time, 0) / 600;

      let duration = (
        afterGenki > 80 ? speed * 0.45 :
        afterGenki > 60 ? speed * 0.52 :
        afterGenki > 40 ? speed * 0.58 :
        afterGenki >  0 ? speed * 0.66 :
        speed
      );

      helpQueue.push(baseTime + duration);
    }
    nextHelpAt = helpQueue[0];
  }
  function resetHelpQueue() {
    helpQueue = [];
    fillHelpQueue();
  }


  /**
   * LOOP_NUM日分ループ
   * 便宜上、1日目の起床時を0秒として、86400秒が2日目の起床時の時刻…とする
   */
  while(time < 86400 * (LOOP_NUM + 1)) {
    // day = Math.floor(time / 86400);

    // 時間のチェック時刻とお手伝い発生時刻を計算
    // let nextHelp = beforeHelp + helpDuration;

    // 次のイベント発生時間を計算
    let nextAt = Math.max(Math.min(nextCheckAt, nextHelpAt, nextDayChangeAt), time);

    // 経過時間に合わせてげんきを減らす
    genki = Math.max(genki - (nextAt - time) / 600, 0);
    time = nextAt;

    // 日が変わったらげんきも回復
    if (nextDayChangeAt <= time) {
      genki = Math.min(100, genki + morningHealGenki)
      resetHelpQueue();
      day++;
      nextDayChangeAt = (day + 1) * 86400;

      nextHelpAt = Math.max(beforeHelpAt + (
        genki > 80 ? speed * 0.45 :
        genki > 60 ? speed * 0.52 :
        genki > 40 ? speed * 0.58 :
        genki >  0 ? speed * 0.66 :
        speed
      ), time);
    }

    // タップした時
    if (nextCheckAt <= time) {

      // バッグの中身を空にする
      if (bag >= bagSize) {
        // バッグがいっぱいの状態が解除されたらおてつだいキューがリセットされるらしい
        resetHelpQueue();
      }
      bag = 0;


      // スキル発動していた時の処理
      if (skillStock > 0) {
        let thisEffect = Math.min(genki + effect * skillStock, 150) - genki;
        if (thisEffect < 0) throw `${genki}`

        if(day) {
          totalSkillNum++;

          if (thisEffect > 0) {
          
            let now = time / 86400 - day;
            let nowGenkiKeepTime = genki * 10 / 1440;
            let supplyTime = thisEffect * 10 / 1440;
            let remainTime = 1 - now;
            let nightTime = sleepTime / 24;

            let reduceAt = now + nowGenkiKeepTime;
            let lastAt = reduceAt + supplyTime;
            let nightAt = 1 - nightTime;

            // トータル回復量
            // if (true) {
            //   totalEffect += thisEffect * remainTime;
            //   totalNightEffect += thisEffect * nightTime;
            // }
            if (true) {
              let totalEffect = thisEffect * Math.min(remainTime, nowGenkiKeepTime);
              if (reduceAt < 1) {
                totalEffect += thisEffect * supplyTime / 2;

                if(lastAt > 1) {
                  let over = lastAt - 1
                  totalEffect -= thisEffect * over * over / supplyTime / 2;
                }
              }

              let totalNightEffect = 0;
              if (reduceAt > nightAt) {
                totalNightEffect += thisEffect * Math.min(reduceAt - nightAt, nightTime);
              }

              if (lastAt > nightAt && reduceAt < 1) {
                let enableSupplyTime = Math.min(lastAt - nightAt, supplyTime)
                
                totalNightEffect += thisEffect * enableSupplyTime * enableSupplyTime / supplyTime / 2;
                
                if (lastAt > 1) {
                  let over = lastAt - 1;
                  totalNightEffect -= thisEffect * over * over / supplyTime / 2;
                }
              }

              totalEffect2 += totalEffect - totalNightEffect;
              totalEffect3 += totalNightEffect;
            }
            // if (true) {
            //   totalEffect += thisEffect * Math.min(remainTime, nowGenkiKeepTime);
            //   totalEffect += thisEffect * supplyTime / 2;

            //   if (reduceAt > nightAt) {
            //     totalNightEffect += thisEffect * Math.min(reduceAt - nightAt, nightTime);
            //   }
            //   if (lastAt > nightAt && reduceAt < 1) {
            //     let enableSupplyTime = Math.min(lastAt - nightAt, supplyTime)
                
            //     totalNightEffect += thisEffect * enableSupplyTime * enableSupplyTime / supplyTime / 2;
                
            //     if (lastAt > 1) {
            //       let over = lastAt - 1;
            //       totalNightEffect -= thisEffect * over * over / supplyTime / 2;
            //     }
            //   }
            // }
            // totalEffect += thisEffect * remainTime;
            // totalNightEffect += thisEffect * nightTime;
            // totalEffect2 += thisEffect * remainTime;
            // totalEffect3 += thisEffect * nightTime;
          }

          if (checkCount % checkFreq == 0) {
            totalMorningSkillNum++;
            totalEffect1 += thisEffect;
            // if (totalEffect < 0) console.log(totalEffect)
          }
        }
        genki = Math.min(genki + thisEffect, 150);
        skillStock = 0;
      }

      // 次回タップ時間を計算
      checkCount++;
      if (checkCount % checkFreq) {
        nextCheckAt += checkDuration;
      } else {
        // もう今日の分タップしたら翌日の朝イチをタップ時刻とする
        nextCheckAt = checkCount / checkFreq * 86400;

        // 最後のタップした時のげんきを集計
        totalGenkiAtSleep += genki
      }
    }


    if (nextHelpAt <= time) {
      beforeHelpAt = time;

      // おてつだいキューから1個取り出す
      // 最大所持数に達している場合はキューが減っていき、そのうち0になる
      if (helpQueue.length) {
        helpQueue.shift();

        // まだスキル発動していなければガチャ
        if (skillStock < stockLimit) {
          if (Math.random() < p) {
            skillStock++;
            skillNoHitCount = 0;
          } else {
            skillNoHitCount++;
            if (skillNoHitCount >= skillCeil) {
              skillStock++;
              skillNoHitCount = 0;
            }
          }
        }

        // バッグの中身(正確には手伝い回数)を+1
        bag++;

        // まだ最大所持数に達していなければキューを追加
        if (bag < bagSize) {
          fillHelpQueue();
        }
      }

      // 初日はカウントから省く
      if(day) {
        if (time % 86400 < dayTime) {
          dayHelpNum++;
        } else {
          nightHelpNum++;
        }
      }

      nextHelpAt = helpQueue.length ? helpQueue[0] : (
        beforeHelpAt + (
          genki > 80 ? speed * 0.45 :
          genki > 60 ? speed * 0.52 :
          genki > 40 ? speed * 0.58 :
          genki >  0 ? speed * 0.66 :
          speed
        )
      );
    }
 
  }

  // console.log({
  //   sleepTime, checkFreq, p, speed, skillCeil, effect, bagSize,
  //   morningEffect: totalMorningEffect / LOOP_NUM,
  //   dayEffect: totalEffect / LOOP_NUM - totalMorningEffect / LOOP_NUM,
  //   dayHelpRate: dayHelpNum / LOOP_NUM / ((24 - sleepTime) * 3600 / speed),
  //   nightHelpRate: nightHelpNum / LOOP_NUM / ((sleepTime) * 3600 / speed),
  // });

  return {
    totalEffect1: totalEffect1 / LOOP_NUM,
    totalEffect2: totalEffect2 / LOOP_NUM,
    totalEffect3: totalEffect3 / LOOP_NUM,
    dayHelpRate: dayHelpNum / LOOP_NUM / ((24 - sleepTime) * 3600 / speed),
    nightHelpRate: nightHelpNum / LOOP_NUM / ((sleepTime) * 3600 / speed),
  }

  // result.push({
  //   p, speed, effect, bagSize,
  //   totalEffect: totalEffect / config.genkiSimulation.loopNum,
  //   dayHelpRate: dayHelpNum / config.genkiSimulation.loopNum / ((24 - config.sleepTime) * 3600 / speed),
  //   nightHelpRate: nightHelpNum / config.genkiSimulation.loopNum / ((config.sleepTime) * 3600 / speed),
  // })
}