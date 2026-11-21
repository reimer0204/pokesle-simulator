import Nature from '@/data/nature';
import config from '../config';
// @ts-expect-error 既存のJavaScriptモデルには型宣言がない。
import PokemonBox from '../pokemon-box/pokemon-box';
// @ts-expect-error 既存のJavaScriptモデルには型宣言がない。
import MultiWorker from '../multi-worker';
import PokemonListSimulator from '../pokemon-box/pokemon-box-worker?worker';
import EvaluateTable from '../simulation/evaluate-table';
import type { PokemonBoxType } from '@/type';
import type { PokemonStatusImageResult } from './pokemon-status-image-reader';

export type AndroidRegistrationCondition = 'all' | 'normal-or-mint' | 'normal';

export function matchesAndroidRegistration(
  condition: AndroidRegistrationCondition,
  normal: boolean,
  mint: boolean,
) {
  return condition === 'all' || normal || (condition === 'normal-or-mint' && mint);
}

function hasEvaluation(result: any) {
  return (
    result?.evaluateResult &&
    Object.values(result.evaluateResult).some((afterMap: any) =>
      Object.values(afterMap).some((value: any) => Number.isFinite(value.energy?.score)),
    )
  );
}

export default class AndroidPokemonRegistration {
  #worker = new MultiWorker(PokemonListSimulator, 1);
  #config = config.clone();
  #table: any = null;
  #stopped = false;

  async initialize() {
    this.#table = await EvaluateTable.load(this.#config);
    if (!this.#table)
      throw new Error('厳選情報を計算できません。「基準生成」で最新の基準を生成してください。');
    this.#config.cleaning = true;
    // 通常とミント後のチェックリストは、別個体として既存Workerで判定する。
    this.#config.pureMint = false;
    this.#config.simulation.fix = false;
    if (this.#stopped) return;
    await this.#worker.call(null, () => ({ type: 'config', config: this.#config }));
  }

  async register(result: PokemonStatusImageResult, condition: AndroidRegistrationCondition) {
    const pokemon: PokemonBoxType = {
      name: result.pokemonName!,
      lv: result.lv!,
      skillLv: result.mainSkillLv ?? undefined,
      foodList: [...result.foodList] as PokemonBoxType['foodList'],
      subSkillList: [...result.subSkillList] as PokemonBoxType['subSkillList'],
      nature: result.nature!,
      shiny: result.name === '色違い',
      index: -1,
    };
    PokemonBox.check(pokemon);
    const useMint = condition === 'normal-or-mint' && !!Nature.map[pokemon.nature]?.good;
    const evaluated = (
      await this.#worker.call(null, () => ({
        type: 'basic',
        pokemonList: [pokemon, ...(useMint ? [{ ...pokemon, nature: 'がんばりや' }] : [])],
        evaluateTable: this.#table,
      }))
    ).flat(1);
    if (this.#stopped) return false;
    const [normal, mint] = evaluated;
    if (!hasEvaluation(normal)) {
      throw new Error(
        `${pokemon.name}の厳選情報を計算できません。基準生成の対象を確認してください。`,
      );
    }
    if (useMint && !hasEvaluation(mint)) {
      throw new Error(`${pokemon.name}のミント使用後の厳選情報を計算できません。`);
    }
    const register = matchesAndroidRegistration(
      condition,
      !!normal.hitCheckList?.length,
      !!mint?.hitCheckList?.length,
    );
    if (register) PokemonBox.post(pokemon);
    return register;
  }

  stop() {
    this.#stopped = true;
    void this.#worker.reject();
    this.#worker.close();
  }
}
