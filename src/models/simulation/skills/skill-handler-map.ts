import {
  EnergyChargeMSkill,
  EnergyChargeSSkill,
  RandomEnergyChargeSSkill,
} from './energy-charge-skill';
import AuraSphereSkill from './hadoudan-yume-no-kakera-get-skill';
import { BerryBurstSkill, DisguiseBerryBurstSkill } from './kinomi-burst-skill';
import BuildUpSkill from './build-up-skill';
import CheekRubSkill from './hoppe-surisuri-skill';
import CookingChanceSkill from './ryouri-chance-skill';
import CookingPowerUpSkill from './ryouri-power-up-skill';
import { MimicCopySkill, TransformCopySkill } from './copy-skill';
import FoodGetSkill from './shokuzai-get-skill';
import {
  FoodSelectSkill,
  LuckyFoodSelectSkill,
  ViceGripFoodSelectSkill,
} from './shokuzai-select-skill';
import {
  BerryJuiceHealSkill,
  EnergyAllHealSkill,
  EnergyChargeHealSkill,
  EnergyCheerHealSkill,
  MoonlightHealSkill,
} from './genki-heal-skill';
import HealingWaveSkill from './iyashi-no-hadou-skill';
import { HelpBoostSkill, HelpSupportSkill } from './otetsudai-skill';
import MeteorShowerSkill from './meteor-shower-skill';
import MinusSkill from './minus-skill';
import MoonPrayerSkill from './tsuki-no-inori-skill';
import NightmareSkill from './nightmare-skill';
import PlusSkill from './plus-skill';
import PresentSkill from './present-skill';
import PsychoBreakSkill from './psycho-break-skill';
import { RandomShardGetSkill, ShardGetSkill } from './yume-no-kakera-get-skill';
import StockpileSkill from './takuwaeru-skill';
import type { SkillHandler } from './skill-context';

// ハンドラは状態を持たないため、シミュレーションごとに生成せず共有する。
const energyChargeSSkill = new EnergyChargeSSkill();
const randomEnergyChargeSSkill = new RandomEnergyChargeSSkill();
const energyChargeMSkill = new EnergyChargeMSkill();
const stockpileSkill = new StockpileSkill();
const nightmareSkill = new NightmareSkill();
const foodGetSkill = new FoodGetSkill();
const energyChargeHealSkill = new EnergyChargeHealSkill();
const moonlightHealSkill = new MoonlightHealSkill();
const energyCheerHealSkill = new EnergyCheerHealSkill();
const energyAllHealSkill = new EnergyAllHealSkill();
const berryJuiceHealSkill = new BerryJuiceHealSkill();
const berryBurstSkill = new BerryBurstSkill();
const disguiseBerryBurstSkill = new DisguiseBerryBurstSkill();
const meteorShowerSkill = new MeteorShowerSkill();
const moonPrayerSkill = new MoonPrayerSkill();
const healingWaveSkill = new HealingWaveSkill();
const helpSupportSkill = new HelpSupportSkill();
const helpBoostSkill = new HelpBoostSkill();
const presentSkill = new PresentSkill();
const buildUpSkill = new BuildUpSkill();
const plusSkill = new PlusSkill();
const foodSelectSkill = new FoodSelectSkill();
const luckyFoodSelectSkill = new LuckyFoodSelectSkill();
const viceGripFoodSelectSkill = new ViceGripFoodSelectSkill();
const shardGetSkill = new ShardGetSkill();
const randomShardGetSkill = new RandomShardGetSkill();
const auraSphereSkill = new AuraSphereSkill();
const cookingPowerUpSkill = new CookingPowerUpSkill();
const minusSkill = new MinusSkill();
const cookingChanceSkill = new CookingChanceSkill();
const transformCopySkill = new TransformCopySkill();
const mimicCopySkill = new MimicCopySkill();
const cheekRubSkill = new CheekRubSkill();
const psychoBreakSkill = new PsychoBreakSkill();

export const skillHandlerMap = new Map<string, SkillHandler>([
  ['エナジーチャージS', energyChargeSSkill],
  ['エナジーチャージS(ランダム)', randomEnergyChargeSSkill],
  ['エナジーチャージM', energyChargeMSkill],
  ['たくわえる(エナジーチャージS)', stockpileSkill],
  ['ナイトメア(エナジーチャージM)', nightmareSkill],
  ['食材ゲットS', foodGetSkill],
  ['ばけのかわ(きのみバースト)', disguiseBerryBurstSkill],
  ['きのみバースト', berryBurstSkill],
  ['りゅうせいぐん(きのみバースト)', meteorShowerSkill],
  ['みかづきのいのり(げんきオールS)', moonPrayerSkill],
  ['いやしのはどう(げんきエールS)', healingWaveSkill],
  ['おてつだいサポートS', helpSupportSkill],
  ['おてつだいブースト', helpBoostSkill],
  ['プレゼント(食材ゲットS)', presentSkill],
  ['ビルドアップ(料理アシストS)', buildUpSkill],
  ['プラス(食材ゲットS)', plusSkill],
  ['食材セレクトS', foodSelectSkill],
  ['かいりきバサミ(食材セレクトS)', viceGripFoodSelectSkill],
  ['きょううん(食材セレクトS)', luckyFoodSelectSkill],
  ['ゆめのかけらゲットS', shardGetSkill],
  ['ゆめのかけらゲットS(ランダム)', randomShardGetSkill],
  ['はどうだん(ゆめのかけらゲットS)', auraSphereSkill],
  ['料理パワーアップS', cookingPowerUpSkill],
  ['マイナス(料理パワーアップS)', minusSkill],
  ['料理チャンスS', cookingChanceSkill],
  ['へんしん(スキルコピー)', transformCopySkill],
  ['ものまね(スキルコピー)', mimicCopySkill],
  ['ほっぺすりすり(げんきエールS)', cheekRubSkill],
  ['サイコブレイク(きのみゾーン)', psychoBreakSkill],
  ['げんきオールS', energyAllHealSkill],
  ['きのみジュース(げんきオールS)', berryJuiceHealSkill],
  ['げんきエールS', energyCheerHealSkill],
  ['げんきチャージS', energyChargeHealSkill],
  ['つきのひかり(げんきチャージS)', moonlightHealSkill],
]);
