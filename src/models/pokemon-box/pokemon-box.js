import { reactive } from 'vue';
import { Food, Cooking } from '../../data/food_and_cooking';
import Nature from '../../data/nature';
import Pokemon from '../../data/pokemon';
import SubSkill from '../../data/sub-skill';
import config from '../config';
import { PromiseLocker } from '../promise-locker'

class PokemonBox {
  static _time = null;
  static _list = [];  // ポケモン一覧
  static watch = ref(0);
  static gsExportPromiseLocker = reactive(new PromiseLocker())

  static get list() {
    return [...this._list.map((x,i ) => ({ ...x, index: i, original: x }))];
  }

  static load() {
    try {
      let obj = JSON.parse(localStorage.getItem('pokemonBox'))
      this._time = obj.time ? new Date(obj.time) : new Date(),
      this._list = obj.list ?? [];
      for(let item of this._list) {
        delete item.original;
      }
    } catch(e) {
      this._list = [];
    }
    return this._list;
  }

  static check(pokemon) {
    if (Pokemon.map[pokemon.name] == null) throw '知らないポケモン';
    if (!(0 < pokemon.lv)) throw '知らないレベル';
    if (pokemon.foodList.some(food => Food.map[food] == null) && !Pokemon.map[pokemon.name].kaihou) throw '知らない食材';
    if (pokemon.foodList.length != 3 && !Pokemon.map[pokemon.name].kaihou) throw '食材が3つじゃない';
    if (pokemon.subSkillList.some(subSkill => SubSkill.map[subSkill] == null) && !Pokemon.map[pokemon.name].kaihou) throw '知らないサブスキル';
    if (pokemon.subSkillList.length != 5 && !Pokemon.map[pokemon.name].kaihou) throw 'サブスキルが5つじゃない';
    if (Nature.map[pokemon.nature] == null) throw '知らないせいかく';

    return true;
  }

  static post(pokemon, index = null, insertTo = null) {
    if (Pokemon.map[pokemon.name] == null) throw '知らないポケモン';
    if (!(0 < pokemon.lv)) throw '知らないレベル';
    if (pokemon.foodList.some(food => Food.map[food] == null) && !Pokemon.map[pokemon.name].kaihou) throw '知らない食材';
    if (pokemon.subSkillList.some(subSkill => SubSkill.map[subSkill] == null) && !Pokemon.map[pokemon.name].kaihou) throw '知らないサブスキル';
    if (Nature.map[pokemon.nature] == null) throw '知らないせいかく';

    pokemon = JSON.parse(JSON.stringify(pokemon));
    pokemon.bag = Number(pokemon.bag) || null
    pokemon.skillLv = Number(pokemon.skillLv) || null

    let newIndex = index ?? this._list.length;
    if (insertTo != null && insertTo !== '') {
      newIndex = Math.max(0, Math.min(insertTo - 1, this._list.length))
    }
    if (index == null) {
      pokemon = {
        name: pokemon.name,
        lv: pokemon.lv,
        bag: pokemon.bag,
        skillLv: pokemon.skillLv,
        foodList: pokemon.foodList,
        subSkillList: pokemon.subSkillList,
        nature: pokemon.nature,
        shiny: pokemon.shiny,
        memo: pokemon.memo,
        sleepTime: pokemon.sleepTime,
      };
    } else if (0 <= index && index < this._list.length) {
      this._list.splice(index, 1)
    }
    this._list.splice(newIndex, 0, pokemon)
    this.save();
  }

  static move(index, move) {
    if (index != null && 0 <= index + move && index + move < this._list.length) {
      let [item] = this._list.splice(index, 1);
      this._list.splice(index + move, 0, item)
      this.save();
    }
  }

  static delete(index) {
    if (index != null) {
      this._list.splice(index, 1);
      this.save();
    }
  }

  static save(time = null) {
    this._time = time ? new Date(time) : new Date();
    localStorage.setItem('pokemonBox', JSON.stringify({
      time: this._time.toISOString(),
      list: this._list.map(x => ({ ...x, index: undefined })),
    }))
    if (config.pokemonBox.gs.autoExport) {
      PokemonBox.exportGoogleSpreadsheet();
    }
    this.watch.value = +new Date();
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
        fix: Number(cells[config.pokemonBox.tsv.fix]) || null,
        sleepTime: Number(cells[config.pokemonBox.tsv.sleepTime]) || null,
        training: Number(cells[config.pokemonBox.tsv.training]) || null,
        nextExp: Number(cells[config.pokemonBox.tsv.nextExp]) || null,
        memo: cells[config.pokemonBox.tsv.memo] || null,
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
      if (!pokemon.kaihou) {
        if (!boxPokemon.foodList.every(x => Food.map[x])) return null;
        if (!boxPokemon.subSkillList.every(x => SubSkill.map[x])) return null;
      }
      if (!boxPokemon.nature) return null;

      return boxPokemon;
    }).filter(x => x != null)

    this.save();
  }
  
  static async exportGoogleSpreadsheet() {
    if (config.pokemonBox.gs.url) {
      this.gsExportPromiseLocker.wait(async () => {
        const form = new FormData();
        form.append('json', JSON.stringify({
          sheet: config.pokemonBox.gs.sheet,
          pokemonList: [
            // 連携カラムが増えた場合はこのnew Arrayの件数も増やす
            [this._time.toISOString(), ...new Array(18).fill('')],
            ...this.list.map(pokemon => [
              pokemon.name,
              pokemon.lv,
              pokemon.bag,
              pokemon.skillLv,
              ...[...pokemon.foodList, '', '', ''].slice(0, 3),
              ...[...pokemon.subSkillList, '', '', '', '', ''].slice(0, 5),
              pokemon.nature,
              pokemon.shiny ? 1 : null,
              pokemon.fix,
              pokemon.sleepTime,
              pokemon.training ?? null,
              pokemon.nextExp ?? null,
              pokemon.memo ?? null,
            ])
          ],
        }))
    
        try {
          await fetch(config.pokemonBox.gs.url, { method: "post", body: form });
        } catch(e) {
          console.error(e);
          alert('エクスポートに失敗しました');
        }
      })
    }
  }

  static async importGoogleSpreadsheet(auto = false) {
    if (!config.pokemonBox.gs.url) return;

    const response = await fetch(`${config.pokemonBox.gs.url}?sheet=${encodeURIComponent(config.pokemonBox.gs.sheet)}`);
    let rowList = await response.json();

    let [time] = rowList.shift();

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
        fix: row[14] || null,
        sleepTime: Number(row[15]) || null,
        training: Number(row[16]) || null,
        nextExp: Number(row[17]) || null,
        memo: row[18] || null,
      }

      let pokemon = Pokemon.map[boxPokemon.name];
      if (!pokemon) return null;

      if (!boxPokemon.lv) return null;
      if (!pokemon.kaihou) {
        if (!boxPokemon.foodList.every(x => Food.map[x])) return null;
        if (!boxPokemon.subSkillList.every(x => SubSkill.map[x])) return null;
      }
      if (!boxPokemon.nature) return null;

      return boxPokemon;
    }).filter(x => x != null)

    if (auto) {
      if(new Date(time) > this._time) {
        if (confirm(`スプレッドシートに新しいデータがあります。${newList.length}件のポケモンをインポートします。よろしいですか？`)) {
          this._list = newList;
          this.save(time);
  
          return true;
        }
      }
    } else {
      if (confirm(`今のボックス情報をクリアし、新しく${newList.length}件のポケモンをインポートします。よろしいですか？`)) {
        this._list = newList;
        this.save(time);

        return true;
      }
    }
  }

  static async simulation(boxPokemonList, multiWorker, evaluateTable, config, progressCounter, setConfig = true) {
    let clonedConfig = JSON.parse(JSON.stringify(config))

    let [setConfigProgress, stepA, stepB] = progressCounter.split(setConfig ? 1 : 0, 1, 2, 1)

    if (setConfig) {
      await multiWorker.call(
        setConfigProgress,
        () => ({ type: 'config', config: clonedConfig })
      )
    }

    let pokemonList = (await multiWorker.call(
      stepA,
      (i) => {
        let startIndex = Math.floor(boxPokemonList.length * i / config.workerNum);
        let endIndex = Math.floor(boxPokemonList.length * (i + 1) / config.workerNum);
        return {
          i,
          type: 'basic',
          pokemonList: boxPokemonList.slice(startIndex, endIndex),
          evaluateTable,
        }
      }
    )).flat(1);

    return (await multiWorker.call(
      stepB,
      (i) => {
        return {
          type: 'assist',
          pokemonList: pokemonList.slice(
            Math.floor(pokemonList.length * i / config.workerNum),
            Math.floor(pokemonList.length * (i + 1) / config.workerNum),
          ),
          basedPokemonList: pokemonList,
        }
      }
    )).flat(1);
  }
}

PokemonBox.load();

export default PokemonBox;