import Cooking from "./cooking"

const list = [
  { name: 'ふといながねぎ',     energy: 185, img: 'img/food/largeleek.png'    },
  { name: 'あじわいキノコ',     energy: 167, img: 'img/food/tastymushroom.png'    },
  { name: 'とくせんエッグ',     energy: 115, img: 'img/food/fancyegg.png'    },
  { name: 'ほっこりポテト',     energy: 124, img: 'img/food/softpotato.png'    },
  { name: 'とくせんリンゴ',     energy: 90,  img: 'img/food/fancyapple.png'    },
  { name: 'げきからハーブ',     energy: 130, img: 'img/food/fieryherb.png'    },
  { name: 'マメミート',         energy: 103, img: 'img/food/beansausage.png'    },
  { name: 'モーモーミルク',     energy: 98,  img: 'img/food/moomoomilk.png'    },
  { name: 'あまいミツ',         energy: 101, img: 'img/food/honey.png'    },
  { name: 'ピュアなオイル',     energy: 121, img: 'img/food/pureoil.png'    },
  { name: 'あったかジンジャー', energy: 109, img: 'img/food/warmingginger.png'    },
  { name: 'あんみんトマト',     energy: 110, img: 'img/food/snoozytomato.png'    },
  { name: 'リラックスカカオ',   energy: 151, img: 'img/food/soothingcacao.png'    },
  { name: 'おいしいシッポ',     energy: 342, img: 'img/food/slowpoketail.png'    },
  { name: 'ワカクサ大豆',       energy: 100, img: 'img/food/greengrasssoybeans.png'    },
  { name: 'ワカクサコーン',     energy: 140, img: 'img/food/greengrasscorn.png'    },
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

  let normalPotMaxCooking = normalPotCookableList.sort((a, b) => b.maxAddEnergy - a.maxAddEnergy)[0]
  let allPotMaxCooking    = typeCookingList.sort(      (a, b) => b.maxAddEnergy - a.maxAddEnergy)[0]

  Cooking.cookingPowerUpEnergy = Math.max(Cooking.cookingPowerUpEnergy,
    (allPotMaxCooking.maxAddEnergy - normalPotMaxCooking.maxAddEnergy) / (allPotMaxCooking.foodNum - normalPotMaxCooking.foodNum)
  )
}

export default Food;