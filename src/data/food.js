import Cooking from "./cooking"
import largeleekImg from '../img/food/largeleek.png'
import tastymushroomImg from '../img/food/tastymushroom.png'
import fancyeggImg from '../img/food/fancyegg.png'
import softpotatoImg from '../img/food/softpotato.png'
import fancyappleImg from '../img/food/fancyapple.png'
import fieryherbImg from '../img/food/fieryherb.png'
import beansausageImg from '../img/food/beansausage.png'
import moomoomilkImg from '../img/food/moomoomilk.png'
import honeyImg from '../img/food/honey.png'
import pureoilImg from '../img/food/pureoil.png'
import warminggingerImg from '../img/food/warmingginger.png'
import snoozytomatoImg from '../img/food/snoozytomato.png'
import soothingcacaoImg from '../img/food/soothingcacao.png'
import slowpoketailImg from '../img/food/slowpoketail.png'
import greengrasssoybeansImg from '../img/food/greengrasssoybeans.png'
import greengrasscornImg from '../img/food/greengrasscorn.png'


const list = [
  { name: 'ふといながねぎ',     energy: 185, img: largeleekImg },
  { name: 'あじわいキノコ',     energy: 167, img: tastymushroomImg },
  { name: 'とくせんエッグ',     energy: 115, img: fancyeggImg },
  { name: 'ほっこりポテト',     energy: 124, img: softpotatoImg },
  { name: 'とくせんリンゴ',     energy: 90,  img: fancyappleImg },
  { name: 'げきからハーブ',     energy: 130, img: fieryherbImg },
  { name: 'マメミート',         energy: 103, img: beansausageImg },
  { name: 'モーモーミルク',     energy: 98,  img: moomoomilkImg },
  { name: 'あまいミツ',         energy: 101, img: honeyImg },
  { name: 'ピュアなオイル',     energy: 121, img: pureoilImg },
  { name: 'あったかジンジャー', energy: 109, img: warminggingerImg },
  { name: 'あんみんトマト',     energy: 110, img: snoozytomatoImg },
  { name: 'リラックスカカオ',   energy: 151, img: soothingcacaoImg },
  { name: 'おいしいシッポ',     energy: 342, img: slowpoketailImg },
  { name: 'ワカクサ大豆',       energy: 100, img: greengrasssoybeansImg },
  { name: 'ワカクサコーン',     energy: 140, img: greengrasscornImg },
]

for(let food of list) {
  food.bestTypeRate = {
    'カレー': 1,
    'サラダ': 1,
    'デザート': 1,
  };
}

const map = list.reduce((a, x) => (a[x.name] = x, a), {});

class Food {
  static list = [];
  static map = {};
}
Food.list = list;
Food.map = map;
Food.maxEnergy = Math.max(...list.map(x => x.energy))

for(let cooking of Cooking.list) {

  for(let { name, num } of cooking.foodList) {
    if (map[name].bestRate == null || map[name].bestRate < cooking.rate) {
      map[name].bestRate = cooking.rate;
    }
    if (map[name].bestTypeRate[cooking.type] == null || map[name].bestTypeRate[cooking.type] < cooking.rate) {
      map[name].bestTypeRate[cooking.type] = cooking.rate;
    }

  }
  cooking.foodNum = cooking.foodList.reduce((a, x) => a + x.num, 0)
  cooking.rawEnergy = cooking.foodList.reduce((a, x) => a + Food.map[x.name].energy * x.num, 0)
  cooking.energy = cooking.rawEnergy * cooking.rate
  cooking.maxEnergy = cooking.rawEnergy * cooking.rate * Cooking.maxRecipeBonus
  cooking.addEnergy = cooking.energy - cooking.rawEnergy
  cooking.maxAddEnergy = cooking.maxEnergy - cooking.rawEnergy
}
Cooking.maxEnergy = Math.max(...Cooking.list.map(x => x.maxEnergy));

Food.averageMaxCookedEnergy = Food.list.reduce((a, f) => a + f.energy * f.bestRate * Cooking.maxRecipeBonus, 0) / Food.list.length;

Cooking.cookingPowerUpEnergy = 0;
for(let type of ['カレー', 'サラダ', 'デザート']) {
	let typeCookingList = Cooking.list.filter(c => c.type == type);
  let normalPotCookableList = typeCookingList.filter(x => x.foodNum <= Cooking.potMax)

  let normalPotMaxCooking = normalPotCookableList.sort((a, b) => b.maxEnergy - a.maxEnergy)[0]
  let allPotMaxCooking    = typeCookingList.sort(      (a, b) => b.maxEnergy - a.maxEnergy)[0]

  Cooking.cookingPowerUpEnergy = Math.max(Cooking.cookingPowerUpEnergy,
    (allPotMaxCooking.maxEnergy - normalPotMaxCooking.maxEnergy) / (allPotMaxCooking.foodNum - normalPotMaxCooking.foodNum)
  )
}

export default Food;