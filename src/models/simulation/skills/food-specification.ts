import { PokemonSimulatorMode } from '../pokemon-simulator-mode';
import { Cooking, Food } from '../../../data/food_and_cooking';
import type {
  SkillSpecification,
  SkillSpecificationInput,
  SkillSpecificationMode,
} from './skill-specification-types';

const modeList: SkillSpecificationMode[] = [
  {
    id: PokemonSimulatorMode.SELECT,
    label: '厳選計算時',
    formula: '',
    description: '厳選評価用の代表値として計算します。',
  },
  {
    id: PokemonSimulatorMode.ABOUT,
    label: 'ボックス計算時',
    formula: '',
    description: 'ボックス一覧の概算評価で使う1回あたりの値として計算します。',
  },
  {
    id: PokemonSimulatorMode.TEAM,
    label: 'チーム計算時',
    formula: '',
    description: '編成中の対象数を反映する1回あたりの値として計算します。',
  },
];

function input(
  key: string,
  label: string,
  defaultValue: number,
  unit?: string,
): SkillSpecificationInput {
  return { key, label, defaultValue, step: 0.1, unit };
}

function fixedInput(
  key: string,
  label: string,
  defaultValue: number,
  unit?: string,
): SkillSpecificationInput {
  return { ...input(key, label, defaultValue, unit), editable: false };
}

function allFoodEvaluation(foodGetRate: number) {
  return Food.list.reduce(
    (total, food) =>
      total +
      food.energy * ((food.bestRate * Cooking.maxRecipeBonus - 1) * (foodGetRate / 100) + 1),
    0,
  );
}

function modes(formula: string, descriptions: Partial<Record<PokemonSimulatorMode, string>> = {}) {
  return modeList.map((mode) => ({
    ...mode,
    formula,
    description: descriptions[mode.id] ?? mode.description,
  }));
}
export function foodHandlerSpecification(
  effect: number,
  kind: 'present' | 'buildUp' | 'plus' | 'select' | 'allFood',
  shard = 0,
): SkillSpecification {
  const isPlus = kind === 'plus';
  const isPresent = kind === 'present';
  const isBuildUp = kind === 'buildUp';
  const isAllFood = kind === 'allFood';
  const foodCountLabel = isAllFood ? '対象食材数（全食材）' : '対象食材数';
  const selectFoodFormula = isAllFood
    ? `食材平均エナジー = Σ(各食材の評価) ÷ ${foodCountLabel}\n食材獲得後の評価 = 食材平均エナジー × 食材獲得数`
    : `食材獲得後の評価 = 対象食材の評価値合計 ÷ ${foodCountLabel} × 食材獲得数`;
  const selectResultFormula = isAllFood
    ? '最終評価 = (スキルの基本評価 + 食材獲得後の評価) × 最終抽選の重み'
    : '最終評価 = (スキルの基本評価 + 食材獲得後の評価) × 最終抽選の重み';
  const extraInputs = isPlus
    ? [
        fixedInput('subEffect', '追加効果量', 0, 'エナジー'),
        input('firstFoodEnergy', '第1食材の基礎エナジー', 100, 'エナジー'),
        input('firstFoodBestRate', '第1食材の最良料理倍率', 1, '倍'),
        input('candyEnergy', 'アメ1個のエナジー', 1, 'エナジー'),
      ]
    : isPresent
      ? [input('candyEnergy', 'アメ1個のエナジー', 1, 'エナジー')]
      : [];
  const foodDescription = isBuildUp
    ? 'さらに料理チャンス効果量を返し、下記の料理チャンス共通後処理を実行します。'
    : isPlus
      ? '食材獲得数と全食材を返した後に、下記の食材ゲット共通後処理を実行します。'
      : isAllFood
        ? `食材獲得数と全食材（${Food.list.length}種類）を返した後に、下記の食材ゲット共通後処理を実行します。`
        : '食材獲得数と対象食材を返した後に、下記の食材ゲット共通後処理を実行します。';
  return {
    inputs: [
      {
        ...fixedInput('foodGet', '食材獲得数', effect, '個'),
        labelByMode: isAllFood ? { [PokemonSimulatorMode.SELECT]: '食材獲得数' } : undefined,
      },
      isAllFood
        ? fixedInput('foodCount', foodCountLabel, Food.list.length, '種類')
        : input('foodCount', foodCountLabel, kind === 'select' ? 3 : 17, '種類'),
      {
        ...input('foodEnergy', '対象食材の評価値合計', 360, 'エナジー'),
        labelByMode: isAllFood ? { [PokemonSimulatorMode.SELECT]: '食材平均エナジー' } : undefined,
        fixedValue: (_values, mode) =>
          isAllFood && mode === PokemonSimulatorMode.SELECT
            ? allFoodEvaluation(_values.foodGetRate) / Food.list.length
            : null,
      },
      ...(isAllFood
        ? [
            {
              ...input('foodGetRate', '食材ゲット評価率', 50, '%'),
              visibleModes: [PokemonSimulatorMode.SELECT],
            },
          ]
        : []),
      {
        ...input('eventRate', '食材イベント補正', 1, '倍'),
        visibleModes: [PokemonSimulatorMode.ABOUT, PokemonSimulatorMode.TEAM],
      },
      {
        ...input('foodGetEvaluateRate', '食材ゲット評価率', 1, '倍'),
        visibleModes: [PokemonSimulatorMode.ABOUT, PokemonSimulatorMode.TEAM],
      },
      {
        ...input('foodEnergyWeight', '食材評価倍率', 1, '倍'),
        visibleModes: [PokemonSimulatorMode.ABOUT, PokemonSimulatorMode.TEAM],
      },
      {
        ...input('evaluationType', '食材ゲット評価方式', 2, '（1: 個数）'),
        visibleModes: [PokemonSimulatorMode.ABOUT, PokemonSimulatorMode.TEAM],
      },
      input('weight', '最終抽選の重み', 1, '倍'),
      ...extraInputs,
    ],
    modes: [
      {
        id: PokemonSimulatorMode.SELECT,
        label: '厳選計算時',
        formula: `${isPlus ? '追加食材数 = round(追加効果量 ÷ 第1食材の基礎エナジー) + 6\nスキルの基本評価 = 第1食材の基礎エナジー × 第1食材の最良料理倍率 × 最大レシピLvボーナス × 追加食材数\n' : isPresent ? 'スキルの基本評価 = アメ1個のエナジー × 4\n' : 'スキルの基本評価 = 0\n'}各食材の評価 = 食材エナジー × ((最良料理倍率 × 最大レシピLvボーナス − 1) × 食材ゲット評価率 ÷ 100 + 1)\n${selectFoodFormula}\n${selectResultFormula}`,
        description: foodDescription,
      },
      {
        id: PokemonSimulatorMode.ABOUT,
        label: 'ボックス計算時',
        formula: `${isPlus ? '食材評価倍率が0より大きい場合、追加食材数 = round(追加効果量 ÷ 第1食材の基礎エナジー) + 6。第1食材を追加食材数 × 発動回数 × 重み記録し、スキルの基本評価 = 第1食材の最大評価値 × 追加食材数 × 食材評価倍率\n' : 'スキルの基本評価 = 0\n'}1食材あたりの個数 = 食材獲得数 × 食材イベント補正 ÷ ${foodCountLabel} × 食材ゲット評価率\n評価方式が個数なら個数を記録、それ以外は対象食材の最大評価値合計 × 食材評価倍率 × 1食材あたりの個数を加算\n${shard ? 'きょううん: ゆめのかけら += ゆめのかけら効果量 × 発動回数 × 重み\n' : ''}最終評価 = (スキルの基本評価 + 食材獲得後の評価) × 最終抽選の重み`,
        description: foodDescription,
      },
      {
        id: PokemonSimulatorMode.TEAM,
        label: 'チーム計算時',
        formula: `${isPlus ? 'プラスまたはマイナスが2匹以上なら、追加食材数 = round(追加効果量 ÷ 第1食材の基礎エナジー) + 6 を第1食材へ追加食材数 × 発動回数 × 重み記録する。満たさない場合は記録しない。\n' : 'スキルの基本評価 = 0\n'}日曜準備でなければ、1食材あたりの個数 = 食材獲得数 × 食材イベント補正 ÷ ${foodCountLabel} × 食材ゲット評価率\n評価方式が個数なら個数を記録、それ以外は対象食材の最大評価値合計 × 食材評価倍率 × 1食材あたりの個数を加算\n${shard ? 'きょううん: ゆめのかけら += ゆめのかけら効果量 × 発動回数 × 重み\n' : ''}最終評価 = スキルの基本評価 + 食材獲得後の評価`,
        description: foodDescription,
      },
    ],
    resultLabel: '食材を含むスキル評価',
    resultUnit: 'エナジー/回',
    calculate: (values, mode) => {
      let handlerEnergy = 0;
      if (isPlus) {
        const num = Math.round(values.subEffect / values.firstFoodEnergy) + 6;
        if (mode === PokemonSimulatorMode.SELECT)
          handlerEnergy =
            values.firstFoodEnergy * values.firstFoodBestRate * Cooking.maxRecipeBonus * num;
        else if (mode === PokemonSimulatorMode.ABOUT && values.foodEnergyWeight > 0)
          handlerEnergy = values.foodEnergy * num * values.foodEnergyWeight;
      } else if (isPresent && mode === PokemonSimulatorMode.SELECT) {
        handlerEnergy = values.candyEnergy * 4;
      }
      if (mode === PokemonSimulatorMode.TEAM && values.evaluationType === 1) return handlerEnergy;
      const foodEnergy =
        mode === PokemonSimulatorMode.SELECT
          ? (isAllFood ? values.foodEnergy : values.foodEnergy / values.foodCount) * values.foodGet
          : (values.foodEnergy *
              values.foodEnergyWeight *
              values.foodGet *
              values.eventRate *
              values.foodGetEvaluateRate) /
            values.foodCount;
      return (handlerEnergy + foodEnergy) * values.weight;
    },
  };
}
