import Pokemon from '@/data/pokemon.ts';

export const pokemonTargetSpecialtyList = ['きのみ', '食材', 'スキル', 'オール'];

export function createPokemonTarget() {
  return {
    type: 'all',
    all: true,
    specialties: Object.fromEntries(
      pokemonTargetSpecialtyList.map((specialty) => [specialty, false]),
    ),
    skillNameList: [] as string[],
    friendPoint: null as number | null,
    pokemonNameList: [] as string[],
  };
}

export function getPokemonTargetBasePokemon(pokemon: any) {
  return Pokemon.map[pokemon.seed] ?? pokemon;
}

export function getPokemonTargetFriendPointList() {
  return [
    ...new Set(
      Pokemon.list
        .filter((pokemon) => pokemon.isLast)
        .map((pokemon) => getPokemonTargetBasePokemon(pokemon).fp)
        .filter((friendPoint) => friendPoint != null),
    ),
  ].sort((a, b) => a - b);
}

export function matchesPokemonTarget(target: any, pokemon: any) {
  if (target?.all) return true;
  if (target == null) return false;

  const selectedSpecialtyList = Object.entries(target.specialties ?? {})
    .filter(([_, enabled]) => enabled)
    .map(([specialty]) => specialty);
  if (selectedSpecialtyList.length && !selectedSpecialtyList.includes(pokemon.specialty))
    return false;
  if (target.skillNameList?.length && !target.skillNameList.includes(pokemon.skill.name))
    return false;
  if (target.friendPoint != null && getPokemonTargetBasePokemon(pokemon).fp < target.friendPoint)
    return false;
  if (target.pokemonNameList?.length && !target.pokemonNameList.includes(pokemon.name))
    return false;

  return (
    selectedSpecialtyList.length > 0 ||
    target.skillNameList?.length > 0 ||
    target.friendPoint != null ||
    target.pokemonNameList?.length > 0
  );
}

export function needsCheckListPokemonConditionMigration(checklistConfig: any) {
  const list = checklistConfig?.pokemonCondition?.list;
  return (
    Array.isArray(list) &&
    list.some(
      (item) =>
        item?.type != null ||
        item?.target == null ||
        typeof item.target !== 'object' ||
        item.target.specialties == null ||
        !Array.isArray(item.target.skillNameList) ||
        !Object.hasOwn(item.target, 'friendPoint') ||
        !Array.isArray(item.target.pokemonNameList),
    )
  );
}

// 対象条件を使う既存の評価ルールにも、未指定のFP条件を明示的に補う。
export function migratePokemonTargetFriendPoint(ruleList: any) {
  if (!Array.isArray(ruleList)) return;
  for (const rule of ruleList) {
    if (rule?.target != null && typeof rule.target === 'object') {
      rule.target.friendPoint ??= null;
    }
  }
}

// チェックリストの旧対象形式を、厳選設定と共通の対象条件へ移行する。
export function migrateCheckListPokemonCondition(checklistConfig: any) {
  const condition = checklistConfig?.pokemonCondition;
  if (!Array.isArray(condition?.list)) return;

  const legacyLegendPokemonNameList = Pokemon.list
    .filter((pokemon) => pokemon.isLast && pokemon.fieldList.length && pokemon.legend)
    .map((pokemon) => pokemon.name);

  for (const item of condition.list) {
    const target = createPokemonTarget();
    if (item.target != null && typeof item.target === 'object') {
      target.type =
        item.target.type ??
        (item.target.all ? 'all' : item.target.pokemonNameList?.length ? 'pokemon' : 'condition');
      target.all = target.type === 'all';
      for (const specialty of pokemonTargetSpecialtyList) {
        target.specialties[specialty] = item.target.specialties?.[specialty] === true;
      }
      target.skillNameList = Array.isArray(item.target.skillNameList)
        ? item.target.skillNameList
        : [];
      target.friendPoint = Number.isFinite(item.target.friendPoint)
        ? item.target.friendPoint
        : null;
      target.pokemonNameList = Array.isArray(item.target.pokemonNameList)
        ? item.target.pokemonNameList
        : [];
    } else if (item.type === 1) {
      target.type = 'condition';
      target.all = false;
      target.specialties[item.target] = true;
    } else if (item.type === 2) {
      target.type = 'pokemon';
      target.all = false;
      target.pokemonNameList = item.target == null ? [] : [item.target];
    } else if (item.type === 3) {
      target.type = 'condition';
      target.all = false;
      target.friendPoint = 30;
    }

    // v20260927では伝説ポケモンを個別指定へ変換していたため、その結果もFP条件へ置き換える。
    if (
      target.type === 'pokemon' &&
      target.pokemonNameList.length === legacyLegendPokemonNameList.length &&
      target.pokemonNameList.every((name) => legacyLegendPokemonNameList.includes(name))
    ) {
      target.type = 'condition';
      target.all = false;
      target.friendPoint = 30;
      target.pokemonNameList = [];
    }
    item.target = target;
    delete item.type;
  }
}
