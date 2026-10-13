export interface SkillEvaluationContext {
  config: any;
  mode: number;
  skill: any;
  effect: any;
  skillLv: number;
  weight: number;
  copy: any;
  fromMetronome: boolean;
  executor: any;
  pokemonList?: any[];
  boxPokemonList: any[];
  helpBoostCount?: number;
  scoreForSupportEvaluate?: number;
  foodEnergyMap: Record<string, { min: number; max: number }>;
  foodEnergyWeight: number;
  cookingPowerUpEnergy: number;
  defaultBestCooking: any;
  getBestCooking: (potSize: number) => any;
}

export interface SkillEvaluationResult {
  energyPerSkill: number;
  foodGet?: number;
  foodGetList?: any[];
  cookingPowerUpEffect?: number;
  cookingChance?: number;
}

export interface SkillHandler {
  evaluate(context: SkillEvaluationContext): SkillEvaluationResult;
}
