import Pokemon from "../data/pokemon";

class PokemonFilter {
  static TYPE_LIST = [
    { id: 'pokemon', name: '指定ポケモン', input: 'pokemon' },
    { id: 'pokemon_tree', name: '指定ポケモン(進化前含む)', input: 'last_pokemon' },
    { id: 'lv_lte', name: '指定レベル以下', input: 'lv' },
    { id: 'lv_gte', name: '指定レベル以上', input: 'lv' },
    { id: 'skill', name: '指定スキル', input: 'skill' },
  ]

  static filter(pokemonBox, filter) {
    let pokemonList = [...pokemonBox];
    let excludeList = [];
    const stepList = [];
    
    if (filter.enable) {
      for(let condition of filter.conditionList) {
        const modeName = condition.mode ? '追加' : '除外'
        let stepName;
        let func = null;

        if (condition.type == 'pokemon') {
          func = x => x.name == condition.value
          stepName = `${condition.value}を${modeName}`
        }

        if (condition.type == 'pokemon_tree') {
          func = x => Pokemon.map[x.name].afterList.includes(condition.value)
          stepName = `最終進化が${condition.value}のポケモンを${modeName}`
        }

        if (condition.type == 'lv_lte') {
          func = x => x.lv <= condition.value
          stepName = `Lv${condition.value}以下のポケモンを${modeName}`
        }

        if (condition.type == 'lv_gte') {
          func = x => x.lv >= condition.value
          stepName = `Lv${condition.value}以上のポケモンを${modeName}`
        }

        if (condition.type == 'skill') {
          func = x => Pokemon.map[x.name]?.skill == condition.value
          stepName = `スキルが${condition.value}のポケモンを${modeName}`
        }

        if (func) {
          if (condition.mode) {
            pokemonList.push(...excludeList.filter(func))
          } else {
            pokemonList = pokemonList.filter(x => {
              if (func(x)) {
                excludeList.push(x);
                return false;
              }
              return true;
            })
          }
        }
        
        stepList.push({ name: stepName, mode: condition.mode, count: pokemonList.length })
      }
    }

    return {
      stepList,
      pokemonList,
      excludeList,
    }
  }
}

export default PokemonFilter