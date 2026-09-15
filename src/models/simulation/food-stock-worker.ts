import { Food } from '../../data/food_and_cooking.ts';
import type { CookingTypeName, FoodName } from '../../type.ts';

const cookingTypes: CookingTypeName[] = ['カレー', 'サラダ', 'デザート'];
const foodIndexMap = Object.fromEntries(Food.list.map((food, index) => [food.name, index])) as Record<FoodName, number>;
type Recipe = { name: string, type: CookingTypeName, foodNum: number, foodList: { name: FoodName, num: number }[], energy: number };
let recipeListMap = {} as Record<CookingTypeName, Recipe[]>;
let cookingNum = 21;

type Input = { bagSize: number, cookingNum: number, candidateNum: number, minFoodNum: number, maxFoodNum: number, weights: Record<CookingTypeName, number>, cookingList: Recipe[], seed: number };
type Evaluation = { score: number, totalFoodNum: number, foodNumList: number[], energyList: number[] };

function createRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function evaluate(planList: number[][], input: Input): Evaluation {
  const foodNumListByType = cookingTypes.map(() => new Array(Food.list.length).fill(0));
  const energyList = cookingTypes.map(() => 0);
  for (let typeIndex = 0; typeIndex < cookingTypes.length; typeIndex++) {
    const recipeList = recipeListMap[cookingTypes[typeIndex]];
    for (const recipeIndex of planList[typeIndex]) {
      const recipe = recipeList[recipeIndex];
      energyList[typeIndex] += recipe.energy;
      for (const food of recipe.foodList) foodNumListByType[typeIndex][foodIndexMap[food.name]] += food.num;
    }
  }
  const foodNumList = Food.list.map((_, foodIndex) => Math.max(...foodNumListByType.map(list => list[foodIndex])));
  const totalFoodNum = foodNumList.reduce((sum, num) => sum + num, 0);
  const score = cookingTypes.reduce((sum, type, typeIndex) => input.weights[type] > 0 ? sum + input.weights[type] * Math.log(energyList[typeIndex]) : sum, 0);
  return { score, totalFoodNum, foodNumList, energyList };
}

function getObjective(evaluation: Evaluation, bagSize: number) {
  if (evaluation.totalFoodNum <= bagSize) return evaluation.score;
  // 一時的な容量超過を許容し、より良い構成へ移りやすくする。
  return evaluation.score - (evaluation.totalFoodNum - bagSize) * 12;
}

function copyPlan(planList: number[][]) {
  return planList.map(plan => [...plan]);
}

function mutatePlan(planList: number[][], random: () => number, input: Input) {
  const typeIndex = Math.floor(random() * cookingTypes.length);
  const type = cookingTypes[typeIndex];
  if (input.weights[type] <= 0) return;

  const plan = planList[typeIndex];
  const recipeList = recipeListMap[type];
  const action = random();
  if (action < 0.34 && plan.length < cookingNum) {
    plan.push(Math.floor(random() * recipeList.length));
  } else if (action < 0.48 && plan.length > 1) {
    plan.splice(Math.floor(random() * plan.length), 1);
  } else {
    plan[Math.floor(random() * plan.length)] = Math.floor(random() * recipeList.length);
  }
}

function createInitialPlan(random: () => number, input: Input) {
  const planList = cookingTypes.map(type => {
    if (input.weights[type] <= 0) return [];
    const recipeList = recipeListMap[type];
    const lowestFoodRecipeIndex = recipeList.reduce((bestIndex, recipe, index) => recipe.foodNum < recipeList[bestIndex].foodNum ? index : bestIndex, 0);
    return [lowestFoodRecipeIndex];
  });
  let current = evaluate(planList, input);
  for (let i = 0; i < 300; i++) {
    const nextPlanList = copyPlan(planList);
    mutatePlan(nextPlanList, random, input);
    const next = evaluate(nextPlanList, input);
    if (getObjective(next, input.bagSize) >= getObjective(current, input.bagSize) || random() < 0.08) {
      current = next;
      planList.splice(0, planList.length, ...nextPlanList);
    }
  }
  return planList;
}

function createResult(planList: number[][], evaluation: Evaluation) {
  const foodNumMap = Object.fromEntries(Food.list.map((food, index) => [food.name, evaluation.foodNumList[index]]));
  const plans = Object.fromEntries(cookingTypes.map((type, typeIndex) => {
    const recipeList = recipeListMap[type];
    const recipeNumMap = planList[typeIndex].reduce((map, recipeIndex) => (map[recipeIndex] = (map[recipeIndex] ?? 0) + 1, map), {} as Record<number, number>);
    return [type, {
      cookingList: Object.entries(recipeNumMap).map(([recipeIndex, num]) => ({
        name: recipeList[Number(recipeIndex)].name,
        num,
        foodNumMap: Object.fromEntries(recipeList[Number(recipeIndex)].foodList.map(food => [food.name, food.num * num])),
        energy: recipeList[Number(recipeIndex)].energy * num,
      })).sort((a, b) => b.energy - a.energy),
      energy: evaluation.energyList[typeIndex],
    }];
  }));
  return { score: evaluation.score, foodNumMap, totalFoodNum: evaluation.totalFoodNum, plans };
}

addEventListener('message', event => {
  const input = event.data as Input;
  cookingNum = Math.min(Math.max(Math.floor(input.cookingNum) || 1, 1), 21);
  const minFoodNum = Math.max(Math.floor(input.minFoodNum) || 0, 0);
  const maxFoodNum = Math.max(Math.floor(input.maxFoodNum) || 0, 0);
  const allRecipeListMap = Object.fromEntries(cookingTypes.map(type => [
    type,
    input.cookingList.filter(cooking => cooking.type == type && cooking.foodNum > 0).toSorted((a, b) => b.energy - a.energy),
  ])) as Record<CookingTypeName, Recipe[]>;
  recipeListMap = Object.fromEntries(cookingTypes.map(type => [
    type,
    allRecipeListMap[type]
      .filter(cooking => cooking.foodNum >= minFoodNum && cooking.foodNum <= maxFoodNum)
      .slice(0, Math.min(Math.max(Math.floor(input.candidateNum) || 1, 1), allRecipeListMap[type].length)),
  ])) as Record<CookingTypeName, typeof Cooking.list>;
  const random = createRandom(input.seed);
  let bestPlanList: number[][] | null = null;
  let bestEvaluation: Evaluation | null = null;
  const restartNum = 12;
  const iterationNum = 12000;

  for (let restart = 0; restart < restartNum; restart++) {
    let currentPlanList = createInitialPlan(random, input);
    let currentEvaluation = evaluate(currentPlanList, input);
    let currentObjective = getObjective(currentEvaluation, input.bagSize);
    if (currentEvaluation.totalFoodNum <= input.bagSize && (bestEvaluation == null || bestEvaluation.score < currentEvaluation.score)) {
      bestPlanList = currentPlanList;
      bestEvaluation = currentEvaluation;
    }
    for (let iteration = 0; iteration < iterationNum; iteration++) {
      const nextPlanList = copyPlan(currentPlanList);
      const mutationNum = random() < 0.08 ? 2 + Math.floor(random() * 3) : 1;
      for (let mutation = 0; mutation < mutationNum; mutation++) {
        mutatePlan(nextPlanList, random, input);
      }
      const nextEvaluation = evaluate(nextPlanList, input);
      const nextObjective = getObjective(nextEvaluation, input.bagSize);
      const temperature = 35 * (1 - iteration / iterationNum) + 0.05;
      if (nextObjective >= currentObjective || random() < Math.exp((nextObjective - currentObjective) / temperature)) {
        currentPlanList = nextPlanList;
        currentEvaluation = nextEvaluation;
        currentObjective = nextObjective;
      }
      if (nextEvaluation.totalFoodNum <= input.bagSize && (bestEvaluation == null || bestEvaluation.score < nextEvaluation.score)) {
        bestPlanList = nextPlanList;
        bestEvaluation = nextEvaluation;
      }
    }
    if (currentEvaluation.totalFoodNum <= input.bagSize && (bestEvaluation == null || bestEvaluation.score < currentEvaluation.score)) {
      bestPlanList = currentPlanList;
      bestEvaluation = currentEvaluation;
    }
    postMessage({ status: 'progress', body: (restart + 1) / restartNum });
  }

  postMessage({ status: 'success', body: bestPlanList && bestEvaluation ? createResult(bestPlanList, bestEvaluation) : null });
});

export default {};
