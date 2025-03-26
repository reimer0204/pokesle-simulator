import Berry from "./berry";

class NightCapPikachu {
  static list = [
    {time: 4800, berry: 1, foodNumList: []},
    {time: 4680, berry: 1, foodNumList: []},
    {time: 4560, berry: 1, foodNumList: [1]},
    {time: 4440, berry: 1, foodNumList: [1]},
    {time: 4380, berry: 1, foodNumList: [1]},
    {time: 4320, berry: 1, foodNumList: [1]},
    {time: 4260, berry: 1, foodNumList: [1]},
    {time: 4200, berry: 1, foodNumList: [1]},
    {time: 4140, berry: 1, foodNumList: [1,1]},
    {time: 4080, berry: 1, foodNumList: [1,1]},
    {time: 4020, berry: 2, foodNumList: [1,1]},
    {time: 3960, berry: 2, foodNumList: [1,1]},
    {time: 3900, berry: 2, foodNumList: [2,1]},
    {time: 3840, berry: 2, foodNumList: [2,1]},
    {time: 3780, berry: 2, foodNumList: [2,1]},
    {time: 3720, berry: 2, foodNumList: [2,1]},
    {time: 3660, berry: 2, foodNumList: [2,2]},
    {time: 3600, berry: 2, foodNumList: [2,2]},
    {time: 3570, berry: 2, foodNumList: [2,2,2]},
    {time: 3540, berry: 2, foodNumList: [2,2,2]},
  ]

  static get(lv) {
    let nightCapPikachu = this.list[Math.min(Math.max(1, lv), this.list.length) - 1]

    nightCapPikachu.base = {
      name: 'ナイトキャップピカチュウ',
    };
    nightCapPikachu.lv = lv;
    nightCapPikachu.subSkillList = [];
    nightCapPikachu.subSkillNameList = [];
    nightCapPikachu.foodList = [
      { name: 'とくせんリンゴ',   num: nightCapPikachu.foodNumList[0] },
      { name: 'リラックスカカオ', num: nightCapPikachu.foodNumList[1] },
      { name: 'あまいミツ',       num: nightCapPikachu.foodNumList[2] },
    ].slice(0, nightCapPikachu.foodNumList.length);
    nightCapPikachu.skillEnergyPerDay = 0;
    nightCapPikachu.shard = 0;
    
    nightCapPikachu.helpNum = 86400 / nightCapPikachu.time;
    nightCapPikachu.berryEnergyPerDay = nightCapPikachu.helpNum * Math.max(
      Berry.map['ウブ'].energy + lv - 1,
      Berry.map['ウブ'].energy * (1.025 ** (lv - 1))
    ) * (1 - 0.16 * nightCapPikachu.foodNumList.length)

    nightCapPikachu['とくせんリンゴ'] = nightCapPikachu.foodNumList.length > 0 ? nightCapPikachu.helpNum * 0.16 * nightCapPikachu.foodNumList[0] : 0
    nightCapPikachu['リラックスカカオ'] = nightCapPikachu.foodNumList.length > 1 ? nightCapPikachu.helpNum * 0.16 * nightCapPikachu.foodNumList[1] : 0
    nightCapPikachu['あまいミツ'] = nightCapPikachu.foodNumList.length > 2 ? nightCapPikachu.helpNum * 0.16 * nightCapPikachu.foodNumList[2] : 0

    return nightCapPikachu;
  }
}

export default NightCapPikachu;