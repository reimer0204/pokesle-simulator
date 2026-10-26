export const skillCategoryList = [
  { id: 'energy', name: 'エナジー' },
  { id: 'food', name: '食材' },
  { id: 'cooking', name: '料理' },
  { id: 'support', name: 'サポート' },
  { id: 'heal', name: 'ヒーラー' },
  { id: 'shard', name: 'ゆめのかけら' },
  { id: 'etc', name: 'その他' },
] as const;

export type SkillCategory = (typeof skillCategoryList)[number]['id'];
import { skillDefinitions as auraSphereSkillDefinitions } from './hadoudan-yume-no-kakera-get-skill';
import { skillDefinitions as berryBurstSkillDefinitions } from './kinomi-burst-skill';
import { skillDefinitions as buildUpSkillDefinitions } from './build-up-skill';
import { skillDefinitions as cheekRubSkillDefinitions } from './hoppe-surisuri-skill';
import { skillDefinitions as cookingChanceSkillDefinitions } from './ryouri-chance-skill';
import { skillDefinitions as cookingPowerUpSkillDefinitions } from './ryouri-power-up-skill';
import { skillDefinitions as magicalFlameSkillDefinitions } from './magical-flame-skill';
import { skillDefinitions as copySkillDefinitions } from './copy-skill';
import { skillDefinitions as energyChargeSkillDefinitions } from './energy-charge-skill';
import { skillDefinitions as foodGetSkillDefinitions } from './shokuzai-get-skill';
import { skillDefinitions as foodSelectSkillDefinitions } from './shokuzai-select-skill';
import { skillDefinitions as healSkillDefinitions } from './genki-heal-skill';
import { skillDefinitions as healingWaveSkillDefinitions } from './iyashi-no-hadou-skill';
import { skillDefinitions as helpSkillDefinitions } from './otetsudai-skill';
import { skillDefinitions as meteorShowerSkillDefinitions } from './meteor-shower-skill';
import { skillDefinitions as metronomeSkillDefinitions } from './yubi-wo-furu-skill';
import { skillDefinitions as minusSkillDefinitions } from './minus-skill';
import { skillDefinitions as moonPrayerSkillDefinitions } from './tsuki-no-inori-skill';
import { skillDefinitions as nightmareSkillDefinitions } from './nightmare-skill';
import { skillDefinitions as plusSkillDefinitions } from './plus-skill';
import { skillDefinitions as presentSkillDefinitions } from './present-skill';
import { skillDefinitions as psychoBreakSkillDefinitions } from './psycho-break-skill';
import { skillDefinitions as shardGetSkillDefinitions } from './yume-no-kakera-get-skill';
import { skillDefinitions as stockpileSkillDefinitions } from './takuwaeru-skill';

export const skillList = [
  ...auraSphereSkillDefinitions,
  ...berryBurstSkillDefinitions,
  ...buildUpSkillDefinitions,
  ...cheekRubSkillDefinitions,
  ...cookingChanceSkillDefinitions,
  ...cookingPowerUpSkillDefinitions,
  ...magicalFlameSkillDefinitions,
  ...copySkillDefinitions,
  ...energyChargeSkillDefinitions,
  ...foodGetSkillDefinitions,
  ...foodSelectSkillDefinitions,
  ...healSkillDefinitions,
  ...healingWaveSkillDefinitions,
  ...helpSkillDefinitions,
  ...meteorShowerSkillDefinitions,
  ...metronomeSkillDefinitions,
  ...minusSkillDefinitions,
  ...moonPrayerSkillDefinitions,
  ...nightmareSkillDefinitions,
  ...plusSkillDefinitions,
  ...presentSkillDefinitions,
  ...psychoBreakSkillDefinitions,
  ...shardGetSkillDefinitions,
  ...stockpileSkillDefinitions,
];
