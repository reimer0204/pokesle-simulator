import { Cooking, Food } from "@/data/food_and_cooking";
import Pokemon from "@/data/pokemon";
import Skill from "@/data/skill";
import type { PokemonType, SimulatedPokemon } from "@/type";

export class CheckList {
  lvList: number[];
  evaluateTable: any;

  constructor(config: any, evaluateTable: any) {
    this.lvList = Object.entries(config.selectEvaluate.levelList).filter(([lv, enable]) => enable).map(([lv]) => Number(lv))
    this.evaluateTable = evaluateTable;
  }
  
  pokemonCheckList(config: any, simulatedPokemonList: SimulatedPokemon[], hitList: any[] | null = null) {
    if (this.evaluateTable == null) {
      return {
        dataList: [],
        columnList: [],
        targetPokemonList: [],
      };
    }

    const saishuuShinkaPokemonList = Pokemon.list.filter(x => x.isLast).sort((a, b) => a.name < b.name ? -1 : 1)
    const filteredSaishuuShinkaPokemonList = saishuuShinkaPokemonList.filter(pokemon => !config.summary.checklist.pokemonCondition.disablePokemonMap[pokemon.name])

    const result = [];
    for (const item of config.summary.checklist.pokemonCondition.list) {
      const foodList: string[] = [];
      if (item.aaa) foodList.push('AAA');
      if (item.aab) foodList.push('AAB');
      if (item.aac) foodList.push('AAC');
      if (item.aba) foodList.push('ABA');
      if (item.abb) foodList.push('ABB');
      if (item.abc) foodList.push('ABC');
      const foodName = foodList.length == 6 ? '全て' : foodList.join('/');
      let pokemonList = null;

      if (item.type == 0) {
        pokemonList = filteredSaishuuShinkaPokemonList;
      }
      if (item.type == 1) {
        pokemonList = filteredSaishuuShinkaPokemonList.filter(p => p.specialty == item.target);
      }
      if (item.type == 2) {
        pokemonList = filteredSaishuuShinkaPokemonList.filter(p => p.name == item.target);
      }
      if (pokemonList != null) {
        for(let pokemon of pokemonList) {
          const hitPokemonList = simulatedPokemonList.flatMap(simulatedPokemon => {
            if (
              simulatedPokemon.evaluateResult[config.summary.checklist.pokemonCondition.selectLv]?.[pokemon.name]?.energy.score == null
              || simulatedPokemon.evaluateResult[config.summary.checklist.pokemonCondition.selectLv]?.[pokemon.name]?.specialty.score == null
              || foodList.indexOf(simulatedPokemon.foodCombination!) == -1
            ) return [];

            // 厳選度チェック
            let score = Number.NEGATIVE_INFINITY;
            if (item.energyBorder != null) {
              score = Math.max(score, simulatedPokemon.evaluateResult[config.summary.checklist.pokemonCondition.selectLv][pokemon.name].energy.score - item.energyBorder / 100);
            }
            if (item.specialtyBorder != null) {
              score = Math.max(score, simulatedPokemon.evaluateResult[config.summary.checklist.pokemonCondition.selectLv][pokemon.name].specialty.score - item.specialtyBorder / 100);
            }
            if (hitList != null && score >= 0) {
              hitList.push({ type: 'pokemon', condition: item })
            }
            return [{ pokemon: simulatedPokemon, score }];
          }).sort((a, b) => b.score - a.score);

          const checked = hitPokemonList?.[0]?.score >= 0;
          const hitPokemon = hitPokemonList?.[0]?.pokemon;

          result.push({
            base: pokemon,
            name: pokemon.name,
            subName: foodName,
            checked,
            pokemon: hitPokemon,
            target: [(item.energyBorder != null ? `総合${item.energyBorder}%以上` : null), (item.specialtyBorder != null ? `とくい${item.specialtyBorder}%以上` : null)].join('\n'),
            energyScore: hitPokemon?.evaluateResult[config.summary.checklist.pokemonCondition.selectLv][pokemon.name].energy.score,
            specialtyScore: hitPokemon?.evaluateResult[config.summary.checklist.pokemonCondition.selectLv][pokemon.name].specialty.score,
            table: {
              title: pokemon.name,
              dataList: hitPokemonList,
              columnList: [
                { key: 'energyScore', name: '総合厳選度', percent: true, convert: x => x.pokemon.evaluateResult[config.summary.checklist.pokemonCondition.selectLv][pokemon.name].energy.score },
                { key: 'specialtyScore', name: 'とくい厳選度', percent: true, convert: x => x.pokemon.evaluateResult[config.summary.checklist.pokemonCondition.selectLv][pokemon.name].specialty.score },
                { key: 'pokemon', name: 'ポケモン' },
              ],
            },
          })
        }
      }
    }

    return {
      dataList: result,
      columnList: [
        { key: 'name', name: '厳選対象' },
        { key: 'specialty', name: 'とくい', type: String, convert: x => x.base?.specialty ?? '' },
        { key: 'berry', name: 'きのみ', type: String, convert: x => x.base?.berry.name ?? '' },
        { key: 'type', name: 'タイプ', type: String, convert: x => x.base?.berry.type ?? '' },
        { key: 'subName', name: '食材構成' },
        { key: 'target', name: '目標' },
        { key: 'checked', name: '厳選済', type: String, convert: x => x.checked ? '済' : '' },
        { key: 'energyScore', name: '総合厳選度', percent: true },
        { key: 'specialtyScore', name: 'とくい厳選度', percent: true },
        { key: 'pokemon', name: 'ポケモン' },
        { key: 'table', name: 'ボックス' },
      ],
      targetPokemonList: result.filter(x => !x.checked).map(x => x.name),
    }
  }

  foodCheckList(config: any, simulatedPokemonList: SimulatedPokemon[], hitList: any[] | null = null) {
    if (this.evaluateTable == null) {
      return {
        dataList: [],
        columnList: [],
        targetPokemonList: [],
      };
    }
  
    const result = [];

    // 事前整理
    const foodScorePokemonMap: Record<string, any[]> = {};
    const targetLvList = this.lvList.filter(x => x <= config.summary.checklist.food.borderLv);
    for(const simulatedPokemon of simulatedPokemonList) {
      for(const lv of targetLvList) {
        for(let [name, { food, foodNumList }] of Object.entries(simulatedPokemon.evaluateResult[lv] ?? {})) {
          if (Pokemon.map[name]) {
            Pokemon.map[name].foodList.forEach((food, index) => {
              if (foodNumList[index] == null) return;
              
              const score = foodNumList[index];
              if (score == null || score == 0) return;
              if (foodScorePokemonMap[food.name] == null) foodScorePokemonMap[food.name] = [];
              foodScorePokemonMap[food.name].push({
                score,
                lv,
                pokemon: simulatedPokemon,
              })
            });
          }
        }
      }
    };

    const bestFoodScoreMap: Record<string, any[]> = {};
    for(let [name, lvMap] of Object.entries(this.evaluateTable)) {
      const pokemon = Pokemon.map[name];
      if (pokemon == null) continue;
      for(let [foodCombination, { food1, food2, food3 }] of Object.entries(lvMap[config.summary.checklist.food.borderLv] ?? {})) {

        pokemon.foodList.forEach((food, index) => {
          const score = index == 0 ? food1 : index == 1 ? food2 : food3;

          if (score == null || score == 0) return;
          if (bestFoodScoreMap[food.name] == null) bestFoodScoreMap[food.name] = [];
          bestFoodScoreMap[food.name].push({
            score,
            pokemon: pokemon,
            foodCombination: foodCombination,
          })
        })
      }
    }
    
    for(const food of Food.list) {
      if (
        bestFoodScoreMap[food.name] != null
        && config.summary.checklist.food.enableMap[food.name]
        && foodScorePokemonMap[food.name] != null
      ) {
        bestFoodScoreMap[food.name].sort((a, b) => b.score - a.score);
        foodScorePokemonMap[food.name].sort((a, b) => b.score - a.score);

        const maxNum = Math.max(...Cooking.list.map(x => x.foodList.find(f => f.name == food.name)?.num ?? 0), 0);
        const bestFoodScore = config.summary.checklist.food.borderType == 0
          ? bestFoodScoreMap[food.name]?.[0]?.score ?? 0
          : maxNum;
        const border = bestFoodScore * (config.summary.checklist.food.borderValue / 100);
        const targetBorder = bestFoodScore * (config.summary.checklist.food.targetValue / 100);

        let hitPokemon = foodScorePokemonMap[food.name][0];
        let checked = hitPokemon?.score >= border;
        let targetPokemonList = bestFoodScoreMap[food.name].filter(x => x.score >= targetBorder);
        if (hitList != null && checked) {
          hitList!.push({ type: 'food', food })
        }
        result.push({
          food,
          bestFoodScore,
          maxNum: maxNum * 3,
          border,
          score: hitPokemon?.score,
          lv: hitPokemon?.lv,
          borderLv: config.summary.checklist.food.borderLv,
          checked,
          pokemon: hitPokemon?.pokemon,
          rate: hitPokemon?.score / bestFoodScore,
          note: targetPokemonList.map(x => `${x.pokemon.name}${x.foodCombination.split('').map(x => String.fromCharCode(Number(x) + 65)).join('')} (${x.score.toFixed(1)})`).join('\n'),
          targetPokemonList,
          table: {
            title: food.name,
            dataList: foodScorePokemonMap[food.name],
            columnList: [
              { key: 'score', name: '個数', type: Number, fixed: 1 },
              { key: 'lv', name: 'レベル', type: String },
              { key: 'pokemon', name: 'ポケモン' },
            ],
          },
        })
      }
    }

    return {
      dataList: result,
      columnList: [
        { key: 'food', name: '厳選対象', type: String, convert: x => x.food.name ?? '' },
        { key: 'bestFoodScore', name: '理論値', type: Number, fixed: 1 },
        { key: 'maxNum', name: '最大必要数✕3', type: Number, fixed: 0 },
        { key: 'border', name: '基準値', type: Number, fixed: 1 },
        { key: 'note', name: '対象ポケモン＋理論値' },
        { key: 'checked', name: '厳選済', type: String, convert: x => x.checked ? '済' : '' },
        { key: 'score', name: '最良個数', type: Number, template: 'score', fixed: 1 },
        { key: 'rate', name: '最良個数/最大値', percent: true },
        { key: 'pokemon', name: '最良ポケモン' },
        { key: 'table', name: 'ボックス' },
      ],
      targetPokemonList: result.filter(x => !x.checked).flatMap(x => x.targetPokemonList).map(x => x.pokemon.name),
    }
  }

  skillCheckList(config: any, simulatedPokemonList: SimulatedPokemon[], hitList: any[] | null = null) {
    if (this.evaluateTable == null) {
      return {
        dataList: [],
        columnList: [],
        targetPokemonList: [],
      };
    }
    
    const result = [];

    // 事前整理
    const skillScorePokemonMap: Record<string, any[]> = {};
    const targetLvList = this.lvList.filter(x => x <= config.summary.checklist.skill.borderLv);
    for(const simulatedPokemon of simulatedPokemonList) {
      for(const lv of targetLvList) {
        for(let [name, { skill }] of Object.entries(simulatedPokemon.evaluateResult[lv] ?? {})) {
          if (Pokemon.map[name]) {
            const skillName = Pokemon.map[name].skill.name;
            const score = skill.value;
            if (skillScorePokemonMap[skillName] == null) skillScorePokemonMap[skillName] = [];
            skillScorePokemonMap[skillName].push({
              score,
              lv,
              pokemon: simulatedPokemon,
            })
          }
        }
      }
    };

    const bestSkillScoreMap: Record<string, any[]> = {};
    for(let [name, lvMap] of Object.entries(this.evaluateTable)) {
      const pokemon = Pokemon.map[name];
      if (pokemon) {
        const skillName = pokemon.skill.name;
        let score = 0;
        for(let [_, { skill }] of Object.entries(lvMap[config.summary.checklist.skill.borderLv] ?? {})) {
          score = Math.max(score, skill[100]);
        }
        if (bestSkillScoreMap[skillName] == null) bestSkillScoreMap[skillName] = [];
        bestSkillScoreMap[skillName].push({
          score,
          pokemon: pokemon,
        })
      }
    }
    
    for(const skill of Skill.list) {
      if (config.summary.checklist.skill.skillSpecialtyOnly && !skill.skillSpecialtyOnly) {
        continue;
      }
      if (
        bestSkillScoreMap[skill.name] != null
        && config.summary.checklist.skill.enableMap[skill.name]
        && skillScorePokemonMap[skill.name] != null
      ) {
        bestSkillScoreMap[skill.name].sort((a, b) => b.score - a.score);
        skillScorePokemonMap[skill.name].sort((a, b) => b.score - a.score);

        const bestSkillScore = bestSkillScoreMap[skill.name]?.[0]?.score ?? 0;
        const border = bestSkillScore * (config.summary.checklist.skill.borderValue / 100);
        const targetBorder = bestSkillScore * (config.summary.checklist.skill.targetValue / 100);

        let hitPokemon = skillScorePokemonMap[skill.name][0];
        let checked = hitPokemon?.score >= border
        let targetPokemonList = bestSkillScoreMap[skill.name].filter(x => x.score >= targetBorder);
        if (hitList != null && checked) {
          hitList!.push({ type: 'skill', skill })
        }

        result.push({
          skill,
          bestSkillScore,
          border,
          score: hitPokemon?.score,
          lv: hitPokemon?.lv,
          borderLv: config.summary.checklist.skill.borderLv,
          checked,
          pokemon: hitPokemon?.pokemon,
          rate: hitPokemon?.score / bestSkillScore,
          note: targetPokemonList.map(x => `${x.pokemon.name} (${x.score.toFixed(1)})`).join('\n'),
          targetPokemonList,
          table: {
            title: skill.name,
            dataList: skillScorePokemonMap[skill.name],
            columnList: [
              { key: 'score', name: '回数', type: Number, fixed: 1 },
              { key: 'lv', name: 'レベル', type: String },
              { key: 'pokemon', name: 'ポケモン' },
            ],
          },
        })
      }
    }

    return {
      dataList: result,
      columnList: [
        { key: 'skill', name: '厳選対象', type: String, convert: x => x.skill.name ?? '' },
        { key: 'bestSkillScore', name: '理論値', type: Number, fixed: 1 },
        { key: 'skillBorder', name: '基準値', type: Number, fixed: 1 },
        { key: 'note', name: '対象ポケモン＋理論値' },
        { key: 'checked', name: '厳選済', type: String, convert: x => x.checked ? '済' : '' },
        { key: 'score', name: '最良回数', type: Number, fixed: 1 },
        { key: 'rate', name: '最良回数/最大値', percent: true },
        { key: 'pokemon', name: '最良ポケモン' },
        { key: 'table', name: 'ボックス' },
      ],
      targetPokemonList: result.filter(x => !x.checked).flatMap(x => x.targetPokemonList).map(x => x.pokemon.name),
    }
  }

  getChecked(config: any, simulatedPokemon: SimulatedPokemon) {
    const result: any[] = [];
    
    this.pokemonCheckList(config, [simulatedPokemon], result);
    this.foodCheckList(config, [simulatedPokemon], result);
    this.skillCheckList(config, [simulatedPokemon], result);

    return result;
  }
}