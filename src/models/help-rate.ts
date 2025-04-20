// import * as tf from '@tensorflow/tfjs';
// import GenkiSimulator from "../worker/genki-simulator?worker";
import type { SimulatedPokemon } from '../type';
import PokemonSimulator from './simulation/pokemon-simulator';
// tf.setBackend('cpu');

class HelpRate {

  #config: any = null;
  #dayLength: number;
  #nightLength: number;
  #teamHealCache: any[];
  #teamHealHelpRateCache: { [key: string]: { day: number, night: number } };
  #helpRateCache: { [key: string]: { day: number, night: number } };
  #teamHealHelpRateCacheCount = 0;
  #helpRateCacheCount = 0;

  static GENKI_LIST = [
    { border: 80, effect: 0.45 },
    { border: 60, effect: 0.52 },
    { border: 40, effect: 0.58 },
    { border: 0, effect: 0.66 },
  ]
  #helpRateCount = 0;
  #mode: number;

  constructor(config: any, mode: number = 0) {
    this.#config = config;
    this.#mode = mode;
    this.#nightLength = Math.round(config.sleepTime * 3600);
    this.#dayLength = 86400 - this.#nightLength;

    this.#teamHealCache = [{ key: null, healList: [] }, { key: null, healList: [] }]
    this.#teamHealHelpRateCache = {}
    this.#helpRateCache = {}
  }

  dump() {
    // console.log('teamHealCache', JSON.stringify(this.#teamHealCache).length);
    // console.log(this.#teamHealCache);
    // console.log('teamHealHelpRateCache', JSON.stringify(this.#teamHealHelpRateCache).length);
    // console.log('helpRateCache', JSON.stringify(this.#helpRateCache).length);
    // console.log(`teamHealCache: ${Object.keys(this.#teamHealCache).length}/${this.#teamHealCacheCount}`)
    // console.log(`teamHealHelpRateCache: ${Object.keys(this.#teamHealHelpRateCache).length}/${this.#teamHealHelpRateCacheCount}`)
    // console.log(`helpRateCache: ${Object.keys(this.#helpRateCache).length}/${this.#helpRateCacheCount}`)
    // console.log(`helpRateCount: ${this.#helpRateCount}`)
  }

  // チーム全員のげんき回復量を計算
  calcTeamHeal(pokemonList: SimulatedPokemon[], addHeal?: { effect: number, time: number, night?: boolean }[]) {

    // for(let pokemon of pokemonList) {
    //   pokemon.healList = [];
    //   pokemon.dayHelpRate = 1.5;
    //   pokemon.nightHelpRate = 1.5;
    // }
    // return;

    let infoList = []
    let cacheKey = '';
    let cacheKey2 = '';
    let otherHealerList = [];
    let selfHealerList = [];
    for(let pokemon of pokemonList) {
      pokemon.healList = [];
      const info = {
        skill: pokemon.base.skill,
        stockLimit: pokemon.base.specialty == 'スキル' || pokemon.base.specialty == 'オール' ? 2 : 1,
        hasHeal: pokemon.selfHeal || pokemon.otherHeal,
        morningGenki: 0,
        beforeNightHelp: Math.floor(this.#nightLength / pokemon.speed),
        morningLimit: pokemon.subSkillNameList.includes('げんき回復ボーナス') ? 105 : 100,
      };
      infoList.push(info)

      if (info.hasHeal) {
        const key = `${pokemon.base.name},${pokemon.base.type},${pokemon.morningHealGenki.toFixed(3)},${pokemon.natureGenkiMultiplier.toFixed(2)},${pokemon.selfHeal.toFixed(3)},${pokemon.otherHeal.toFixed(3)},${pokemon.speed},${pokemon.ceilSkillRate.toFixed(3)},${pokemon.bagFullHelpNum.toFixed(3)},${info.morningLimit},`
        if (pokemon.otherHeal) {
          cacheKey += key;
          otherHealerList.push({ pokemon, info })
        } else {
          selfHealerList.push({ pokemon, info })
        }
        cacheKey2 += key;
      }
    }

    for(let loop = 0; loop < 2; loop++) {
      let key, healerList
      if (loop == 0) {
        key = cacheKey;
        healerList = otherHealerList;
      } else {
        key = cacheKey2;
        healerList = selfHealerList;
      }
      
      if (this.#teamHealCache[loop].key != key) {
        // 3回くらいループさせるとほぼ収束する
        let allHealList;

        for(let i = 0; i < 3; i++) {
          for(let { pokemon, info} of healerList) {
            pokemon.healList = []

            allHealList = infoList.flatMap((x, k) => {
              if (pokemonList[k].base.skill.name == 'ナイトメア(エナジーチャージM)' && pokemon.base.type == 'あく') {
                return []
              }
              return pokemonList[k].healList
            }).sort((a, b) => a.time - b.time)
            
            let unPickHelpNum = info.beforeNightHelp;  // 昨日の夜の手伝い回数で初期化
            let beforeHelp = 0; // 前回のおてつだい時刻
            let checkNum = 0;   // タップ回数
            let nextCheck = pokemon.otherHeal ? 0 : 86400;  // 次のタップ時刻
            let nextHeal = allHealList[0]?.time ?? 86400;
            let time = 0;       // 前回のイベント発生時刻
            let genki = Math.max(info.morningGenki, Math.min(info.morningGenki + pokemon.morningHealGenki * pokemon.natureGenkiMultiplier!, info.morningLimit)); // 起床時のげんき
    
            while(true) {
              // this.#helpRateCount++;
              let nextTime = Math.min(nextCheck, nextHeal, 86400)
              let beforeGenki = genki;
              genki = Math.max(genki - (nextTime - time) / 600, 0)

              // 次のイベントの時間までおてつだい回数を加算
              for(let { border, effect } of HelpRate.GENKI_LIST) {
                // げんきが足りなければ次のげんきボーダーチェックに進む
                if (beforeGenki <= border) continue;

                let fixedSpeed = pokemon.speed * effect;
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
              if (beforeHelp + pokemon.speed <= nextTime) {
                const remainTime = nextTime - beforeHelp
                const num = Math.floor(remainTime / pokemon.speed);
                const pastTime = num * pokemon.speed;
                unPickHelpNum += num;
                beforeHelp += pastTime
              }

              time = nextTime;

              // 1日の最後だったら、これを翌日起床時(リサーチによる回復前)のげんきとする
              if (time == 86400) {
                info.morningGenki = genki;
                break;
              }
      
              if (time >= nextCheck && checkNum < this.#config.checkFreq && pokemon.otherHeal) {
                const skillableHelpNum = Math.min(unPickHelpNum, pokemon.bagFullHelpNum! + 4)

                let nightNoHit = (1 - pokemon.ceilSkillRate!) ** skillableHelpNum;
                let skillNum;
                if (info.stockLimit == 2) {
                  let nightOneHit = skillableHelpNum >= 1 ? (1 - pokemon.ceilSkillRate!) ** (skillableHelpNum - 1) * pokemon.ceilSkillRate! * skillableHelpNum : 0;
                  let nightTwoHit = skillableHelpNum >= 2 ? 1 - nightNoHit - nightOneHit : 0
                  skillNum = nightTwoHit * 2 + nightOneHit;
                } else {
                  skillNum = 1 - nightNoHit;
                }

                // ナイトメアなど、自分にはかからないスキルを除いてげんきを加算
                if (pokemon.base.skill.name != 'ナイトメア(エナジーチャージM)') {
                  genki = Math.max(Math.min(genki + skillNum * (pokemon.selfHeal + pokemon.otherHeal) * pokemon.natureGenkiMultiplier!, 150), 0)
                }

                // 他のポケモンを回復する
                if (pokemon.otherHeal) {
                  pokemon.healList.push({ effect: skillNum * pokemon.otherHeal, time })
                }
      
                unPickHelpNum = 0;
                
                checkNum++;
                if (checkNum < this.#config.checkFreq) {
                  nextCheck = this.#dayLength * checkNum / (this.#config.checkFreq - 1)
                } else  {
                  // 規定回数チェックしたら、1日の最後にトリガーを設定
                  nextCheck = 86400;
                }
              }

              if (time >= nextHeal) {
                const { effect } = allHealList.shift()!

                genki = Math.max(Math.min(genki + effect * pokemon.natureGenkiMultiplier!, 150), 0)

                nextHeal = allHealList[0]?.time ?? 86400;
              }
            }
      
            info.beforeNightHelp = unPickHelpNum
          }
        }

        this.#teamHealCache[loop].key = key
        this.#teamHealCache[loop].healList = healerList.map(x => x.pokemon.healList);
        this.#teamHealHelpRateCache = {}
      } else {
        for(let i = 0; i < healerList.length; i++) {
          healerList[i].pokemon.healList = this.#teamHealCache[loop].healList[i]
        }
      }
    }
    
    // 手伝い回数の増加率を計算
    for(let j = 0; j < infoList.length; j++) {
      const info = infoList[j];
      const pokemon = pokemonList[j];

      const cacheKey2 = `${cacheKey}/${pokemon.base.type}/${pokemon.morningHealGenki}/${pokemon.natureGenkiMultiplier}/${info.morningLimit}/${addHeal != null}`
      let result = this.#teamHealHelpRateCache[cacheKey2]
      this.#teamHealHelpRateCacheCount++;

      if (result === undefined) {
        const allHealList = [];
        for(let subPokemon of pokemonList) {
          if (subPokemon.base.skill.name == 'ナイトメア(エナジーチャージM)' && pokemon.base.type == 'あく') {
            continue
          }
          allHealList.push(...subPokemon.healList);
        };
        if (addHeal && (pokemon.selfHeal <= 0 && pokemon.otherHeal <= 0)) {
          allHealList.push(...addHeal)
        }
        allHealList.sort((a, b) => a.time - b.time)

        result = this.getHelpRate(
          allHealList,
          0,
          pokemon.morningHealGenki,
          info.morningLimit,
          pokemon.natureGenkiMultiplier
        )
        this.#teamHealHelpRateCache[cacheKey2] = result;
      }

      pokemon.dayHelpRate = result.day;
      pokemon.nightHelpRate = result.night;
      pokemon.allHealList = result.healList
    }

    // healListの最初にヒーラー分だけでなく朝イチの回復量もいれる
  }

  // 
  getHelpRate(
    healList: { effect: number, time: number, night?: boolean }[], 
    morningGenki: number = 0, 
    morningHealGenki: number = 100,
    morningLimit: number = 100, 
    genkiMultiplier: number = 1
  ) {

    let cacheKey = `${morningGenki},${morningHealGenki},${morningLimit},${genkiMultiplier},`
    for(let { effect, time } of healList) {
      cacheKey += `${effect},${time},`
    }
    let cache = this.#helpRateCache[cacheKey]
    this.#helpRateCacheCount++;

    if (cache === undefined) {
      let newHealList = [...healList]
      let genki = morningGenki
      let dayHelpRate = 0;
      let nightHelpRate = 0;
      
      if (!newHealList.length || newHealList[newHealList.length - 1].time != this.#dayLength) {
        newHealList!.push({ effect: 0, time: this.#dayLength })
      }
      newHealList.push({ effect: 0, time: 86400, night: true })

      for(let i = 0; i < 3; i++) {

        // げんき変動の一覧から日中と夜間の手伝い回数の比率を算出する処理
        genki = Math.max(genki, Math.min(genki + morningHealGenki * genkiMultiplier, morningLimit));
        dayHelpRate = 0;
        nightHelpRate = 0;

        let t = 0;
        for(let { effect, time, night } of newHealList) {
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
          if (effect > 0) {
            genki = Math.min(Math.max(0, genki + effect * genkiMultiplier), 150);
          } else {
            genki = Math.min(Math.max(0, genki + effect), 150);
          }
        }
      }
      
      const result = {
        day: dayHelpRate / this.#dayLength,
        night: nightHelpRate / this.#nightLength,
      }
      if (this.#mode == PokemonSimulator.MODE_SELECT) {
        result.healList = healList;
      }
      this.#helpRateCache[cacheKey] = result;
      return result;

    } else {
      return cache;
    }
  }

}

export default HelpRate