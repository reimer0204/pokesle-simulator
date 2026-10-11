import EnergyChargeSkill from './energy-charge-skill';
import AuraSphereSkill from './aura-sphere-skill';
import BerryBurstSkill from './berry-burst-skill';
import BuildUpSkill from './build-up-skill';
import CheekRubSkill from './cheek-rub-skill';
import CookingChanceSkill from './cooking-chance-skill';
import CookingPowerUpSkill from './cooking-power-up-skill';
import CopySkill from './copy-skill';
import FoodGetSkill from './food-get-skill';
import FoodSelectSkill from './food-select-skill';
import HealSkill from './heal-skill';
import HealingWaveSkill from './healing-wave-skill';
import HelpSkill from './help-skill';
import MeteorShowerSkill from './meteor-shower-skill';
import MinusSkill from './minus-skill';
import MoonPrayerSkill from './moon-prayer-skill';
import NightmareSkill from './nightmare-skill';
import PlusSkill from './plus-skill';
import PresentSkill from './present-skill';
import PsychoBreakSkill from './psycho-break-skill';
import ShardGetSkill from './shard-get-skill';
import StockpileSkill from './stockpile-skill';
import type { SkillHandler } from './skill-context';

// ハンドラは状態を持たないため、シミュレーションごとに生成せず共有する。
const energyChargeSkill = new EnergyChargeSkill();
const stockpileSkill = new StockpileSkill();
const nightmareSkill = new NightmareSkill();
const foodGetSkill = new FoodGetSkill();
const healSkill = new HealSkill();
const berryBurstSkill = new BerryBurstSkill();
const meteorShowerSkill = new MeteorShowerSkill();
const moonPrayerSkill = new MoonPrayerSkill();
const healingWaveSkill = new HealingWaveSkill();
const helpSkill = new HelpSkill();
const presentSkill = new PresentSkill();
const buildUpSkill = new BuildUpSkill();
const plusSkill = new PlusSkill();
const foodSelectSkill = new FoodSelectSkill();
const shardGetSkill = new ShardGetSkill();
const auraSphereSkill = new AuraSphereSkill();
const cookingPowerUpSkill = new CookingPowerUpSkill();
const minusSkill = new MinusSkill();
const cookingChanceSkill = new CookingChanceSkill();
const copySkill = new CopySkill();
const cheekRubSkill = new CheekRubSkill();
const psychoBreakSkill = new PsychoBreakSkill();

export const skillHandlerMap = new Map<string, SkillHandler>([
  ['エナジーチャージS', energyChargeSkill],
  ['エナジーチャージS(ランダム)', energyChargeSkill],
  ['エナジーチャージM', energyChargeSkill],
  ['たくわえる(エナジーチャージS)', stockpileSkill],
  ['ナイトメア(エナジーチャージM)', nightmareSkill],
  ['食材ゲットS', foodGetSkill],
  ['ばけのかわ(きのみバースト)', berryBurstSkill],
  ['きのみバースト', berryBurstSkill],
  ['りゅうせいぐん(きのみバースト)', meteorShowerSkill],
  ['みかづきのいのり(げんきオールS)', moonPrayerSkill],
  ['いやしのはどう(げんきエールS)', healingWaveSkill],
  ['おてつだいサポートS', helpSkill],
  ['おてつだいブースト', helpSkill],
  ['プレゼント(食材ゲットS)', presentSkill],
  ['ビルドアップ(料理アシストS)', buildUpSkill],
  ['プラス(食材ゲットS)', plusSkill],
  ['食材セレクトS', foodSelectSkill],
  ['かいりきバサミ(食材セレクトS)', foodSelectSkill],
  ['きょううん(食材セレクトS)', foodSelectSkill],
  ['ゆめのかけらゲットS', shardGetSkill],
  ['ゆめのかけらゲットS(ランダム)', shardGetSkill],
  ['はどうだん(ゆめのかけらゲットS)', auraSphereSkill],
  ['料理パワーアップS', cookingPowerUpSkill],
  ['マイナス(料理パワーアップS)', minusSkill],
  ['料理チャンスS', cookingChanceSkill],
  ['へんしん(スキルコピー)', copySkill],
  ['ものまね(スキルコピー)', copySkill],
  ['ほっぺすりすり(げんきエールS)', cheekRubSkill],
  ['サイコブレイク(きのみゾーン)', psychoBreakSkill],
  ['げんきオールS', healSkill],
  ['きのみジュース(げんきオールS)', healSkill],
  ['げんきエールS', healSkill],
  ['げんきチャージS', healSkill],
  ['つきのひかり(げんきチャージS)', healSkill],
]);
