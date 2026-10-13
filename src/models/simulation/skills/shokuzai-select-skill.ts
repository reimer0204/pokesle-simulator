import { SkillDefinition } from './skill-definition';
import { Food } from '../../../data/food_and_cooking';
import { foodHandlerSpecification } from './food-specification';
import type { SkillEvaluationContext, SkillEvaluationResult, SkillHandler } from './skill-context';

abstract class BaseFoodSelectSkill implements SkillHandler {
  protected addShard(_context: SkillEvaluationContext): void {}

  evaluate(context: SkillEvaluationContext): SkillEvaluationResult {
    const { copy, effect, executor, skill } = context;
    this.addShard(context);
    return {
      energyPerSkill: 0,
      foodGet: effect.food,
      foodGetList: copy
        ? copy.base.foodList.map((x: any) => Food.map[x.name])
        : (skill.foodList ?? executor.base.foodList.map((x: any) => Food.map[x.name])),
    };
  }
}

export class FoodSelectSkill extends BaseFoodSelectSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: '食材セレクトS',
      effect: [
        { food: 5 }, // 15%で仮定
        { food: 6 },
        { food: 8 },
        { food: 11 },
        { food: 13 },
        { food: 16 },
        { food: 18 },
      ],
      metronome: false,
      category: 'food',
      specification: (level) => {
        const effect = FoodSelectSkill.skillDefinitions[0].effect[level];
        return foodHandlerSpecification(effect.food, 'select');
      },
      // 2026/1/28時点ではスキルコピーでも本人のではなく下記食材で固定
      // foodList: ['つやつやアボカド', 'ほっこりポテト', 'ピュアなオイル'].map(x => Food.map[x]),
    }),
  ];
}

export class LuckyFoodSelectSkill extends BaseFoodSelectSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'きょううん(食材セレクトS)',
      effect: [
        { food: 5 * 0.84, shard: 500 * 2 * 0.16 }, // 少ない方:多い方(5倍)が3:1っぽいので(1 * 75% + 5 * 25%) = 2
        { food: 6 * 0.84, shard: 720 * 2 * 0.16 },
        { food: 8 * 0.84, shard: 1030 * 2 * 0.16 },
        { food: 11 * 0.84, shard: 1440 * 2 * 0.16 },
        { food: 13 * 0.84, shard: 2000 * 2 * 0.16 },
        { food: 16 * 0.84, shard: 2800 * 2 * 0.16 },
        { food: 18 * 0.84, shard: 4000 * 2 * 0.16 },
      ],
      foodList: ['あじわいキノコ', 'マメミート', 'ワカクサ大豆', 'めざましコーヒー'].map(
        (x) => Food.map[x],
      ),
      category: 'food',
      specification: (level) => {
        const effect = LuckyFoodSelectSkill.skillDefinitions[0].effect[level];
        return foodHandlerSpecification(effect.food, 'select', effect.shard ?? 0);
      },
    }),
  ];

  protected addShard({ effect, executor, weight }: SkillEvaluationContext): void {
    executor.shard += effect.shard * executor.skillPerDay * weight;
  }
}

export class ViceGripFoodSelectSkill extends BaseFoodSelectSkill {
  static skillDefinitions = [
    new SkillDefinition({
      name: 'かいりきバサミ(食材セレクトS)',
      effect: [
        { food: 5 * 1.15 }, // 15%で仮定
        { food: 6 * 1.15 },
        { food: 8 * 1.15 },
        { food: 11 * 1.15 },
        { food: 13 * 1.15 },
        { food: 16 * 1.15 },
        { food: 18 * 1.15 },
      ],
      foodList: ['あじわいキノコ', 'マメミート', 'ワカクサ大豆', 'めざましコーヒー'].map(
        (x) => Food.map[x],
      ),
      category: 'food',
      specification: (level) => {
        const effect = ViceGripFoodSelectSkill.skillDefinitions[0].effect[level];
        return foodHandlerSpecification(effect.food, 'select');
      },
    }),
  ];
}

export const skillDefinitions = [
  ...FoodSelectSkill.skillDefinitions,
  ...LuckyFoodSelectSkill.skillDefinitions,
  ...ViceGripFoodSelectSkill.skillDefinitions,
];
