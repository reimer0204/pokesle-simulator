import Food from '../data/food';
import Nature from '../data/nature';
import Pokemon from '../data/pokemon';
import SubSkill from '../data/sub-skill';
import config from './config';

class PokemonBox {

  config = {
    tsvColumns: {}
  };
  _list = [];  // ポケモン一覧

  static get list() {
    return [...this._list];
  }

  static load() {
    try {
      let obj = JSON.parse(localStorage.getItem('pokemonBox'))
      this._list = obj.list ?? [];
    } catch(e) {
      this._list = [];
    }
    return this._list;
  }

  static post(pokemon, index = null) {
    if (Pokemon.map[pokemon.name] == null) throw '知らないポケモン';
    if (!(0 < pokemon.lv)) throw '知らないレベル';
    if (pokemon.foodList.some(food => Food.map[food] == null)) throw '知らない食材';
    if (pokemon.subSkillList.some(subSkill => SubSkill.map[subSkill] == null)) throw '知らない食材';
    if (Nature.map[pokemon.nature] == null) throw '知らないせいかく';

    if (index == null) {
      this._list.push({
        name: pokemon.name,
        lv: pokemon.lv,
        bag: Number(pokemon.bag) || null,
        skillLv: Number(pokemon.skillLv) || null,
        foodList: pokemon.foodList,
        subSkillList: pokemon.subSkillList,
        nature: pokemon.nature,
      })
    } else if (0 <= index && index < this._list.length) {
      this._list[index] = pokemon;
    }
    this.save();
  }

  static save() {
    localStorage.setItem('pokemonBox', JSON.stringify({
      list: this._list,
    }))
  }

  static import(text) {

    this._list = text.split('\n').map(line => {
      let cells = line.split('\t')
      cells.unshift('');

      let boxPokemon = {
        name: cells[config.pokemonBox.tsv.name],
        lv: Number(cells[config.pokemonBox.tsv.lv]),
        bag: Number(cells[config.pokemonBox.tsv.bag]) || null,
        skillLv: Number(cells[config.pokemonBox.tsv.skillLv]) || null,
        subSkillList: [
          cells[config.pokemonBox.tsv.subSkillList[0]],
          cells[config.pokemonBox.tsv.subSkillList[1]],
          cells[config.pokemonBox.tsv.subSkillList[2]],
          cells[config.pokemonBox.tsv.subSkillList[3]],
          cells[config.pokemonBox.tsv.subSkillList[4]],
        ],
        nature: cells[config.pokemonBox.tsv.nature],
        shiny: !!cells[config.pokemonBox.tsv.shiny],
      }

      let pokemon = Pokemon.map[boxPokemon.name];
      if (!pokemon) return null;

      if (config.pokemonBox.tsv.foodABC) {
        let m = /(A)([AB])([ABC])/.exec(cells[config.pokemonBox.tsv.foodABC]);
        if (m) {
          boxPokemon.foodList = [m[1], m[2], m[3]].map(c => pokemon.foodList[c.charCodeAt(0) - 65].name)
        }
      }
      if (config.pokemonBox.tsv.foodList[0] && config.pokemonBox.tsv.foodList[1] && config.pokemonBox.tsv.foodList[2]) {
        boxPokemon.foodList =  [
          cells[config.pokemonBox.tsv.foodList[0]],
          cells[config.pokemonBox.tsv.foodList[1]],
          cells[config.pokemonBox.tsv.foodList[2]],
        ]
      }

      if (!boxPokemon.lv) return null;
      if (!boxPokemon.foodList.every(x => Food.map[x])) return null;
      if (!boxPokemon.subSkillList.every(x => SubSkill.map[x])) return null;
      if (!boxPokemon.nature) return null;

      return boxPokemon;
    }).filter(x => x != null)

    this.save();
  }
  
  static async exportGoogleSpreadsheet() {
    asyncWatcher.run(async () => {
      const form = new FormData();
      form.append('json', JSON.stringify({
        sheet: config.pokemonBox.gs.sheet,
        pokemonList: this.list.map(pokemon => [
          pokemon.name,
          pokemon.lv,
          pokemon.bag,
          pokemon.skillLv,
          ...[...pokemon.foodList, '', '', ''].slice(0, 3),
          ...[...pokemon.subSkillList, '', '', '', '', ''].slice(0, 5),
          pokemon.nature,
          pokemon.shiny ? 1 : null,
        ]),
      }))
  
      await fetch(config.pokemonBox.gs.url, { method: "post", body: form });
    })
  }

  static async importGoogleSpreadsheet() {
    const response = await fetch(`${config.pokemonBox.gs.url}?sheet=${encodeURIComponent(config.pokemonBox.gs.sheet)}`);
    let rowList = await response.json();

    let newList = rowList.map(row => {
      let boxPokemon = {
        name: row[0],
        lv: Number(row[1]),
        bag: Number(row[2]) || null,
        skillLv: Number(row[3]) || null,
        foodList:  [
          row[4],
          row[5],
          row[6],
        ],
        subSkillList: [
          row[7],
          row[8],
          row[9],
          row[10],
          row[11],
        ],
        nature: row[12],
        shiny: !!row[13],
      }

      let pokemon = Pokemon.map[boxPokemon.name];
      if (!pokemon) return null;

      if (!boxPokemon.lv) return null;
      if (!boxPokemon.foodList.every(x => Food.map[x])) return null;
      if (!boxPokemon.subSkillList.every(x => SubSkill.map[x])) return null;
      if (!boxPokemon.nature) return null;

      return boxPokemon;
    }).filter(x => x != null)

    if (confirm(`今のボックス情報をクリアし、新しく${newList.length}件のポケモンをインポートします。よろしいですか？`)) {
      this._list = newList;
      this.save();

      return true;
    }
  }
}

PokemonBox.load();

export default PokemonBox;