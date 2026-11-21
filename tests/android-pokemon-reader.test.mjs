import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const sockets = [];
  const timers = new Map();
  const images = [];
  let timerId = 0;
  let terminated = 0;
  class Socket {
    static OPEN = 1;
    static CONNECTING = 0;
    readyState = 0;
    sent = [];
    constructor(url) {
      this.url = url;
      sockets.push(this);
    }
    send(message) {
      this.sent.push(message);
    }
    close() {
      this.readyState = 3;
      this.onclose?.({ code: 1000 });
    }
    open() {
      this.readyState = 1;
      this.onopen();
    }
  }
  const exports = {};
  const window = { location: { href: '' } };
  vm.runInNewContext(
    ts.transpileModule(
      readFileSync(new URL('../src/models/ocr/android-pokemon-reader.ts', import.meta.url), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
    ).outputText,
    {
      exports,
      window,
      WebSocket: Socket,
      crypto: { randomUUID: () => 'test-session' },
      setTimeout(callback) {
        timers.set(++timerId, callback);
        return timerId;
      },
      clearTimeout(id) {
        timers.delete(id);
      },
      require() {
        return {
          default: class {
            async read() {
              const image = images.shift();
              if (image instanceof Error) throw image;
              return image;
            }
            async terminate() {
              terminated++;
            }
          },
        };
      },
    },
  );
  return { ...exports, sockets, timers, images, window, terminated: () => terminated };
}

const empty = {
  name: null,
  pokemonName: null,
  lv: null,
  mainSkillLv: null,
  nature: null,
  foodList: [null, null, null],
  subSkillList: [],
};
const full = {
  ...empty,
  name: 'ピカチュウ',
  pokemonName: 'ピカチュウ',
  lv: 30,
  mainSkillLv: 2,
  nature: 'がんばりや',
  foodList: ['a', 'b', 'c'],
  subSkillList: ['1', '2', '3', '4', '5'],
};

test('食材3枠・サブスキル5枠が同じ画像で揃うまで完了にしない', () => {
  const api = setup();
  assert.equal(api.isPokemonScreenshotComplete({ ...full, foodList: ['a', null, 'c'] }), false);
  assert.equal(api.isPokemonScreenshotComplete({ ...full, subSkillList: ['4', '5'] }), false);
  assert.equal(api.isPokemonScreenshotComplete(full), true);
});

test('1項目でも欠けていたら完了にしない', () => {
  const api = setup();
  for (const field of ['pokemonName', 'lv', 'mainSkillLv', 'nature', 'foodList', 'subSkillList']) {
    assert.equal(api.isPokemonScreenshotComplete({ ...full, [field]: null }), false, field);
  }
});

test('全項目取得後はnextを送り、前回と同じ個体で重複登録せず終了する', async () => {
  const api = setup();
  const reader = new api.default();
  const results = [];
  const done = reader.read(
    (result) => results.push(result),
    () => {},
  );
  assert.match(api.window.location.href, /mode=pokemon-quote&port=23720&session=test-session/);
  assert.match(api.sockets[0].url, /session=test-session/);
  api.sockets[0].open();
  api.images.push(full);
  await api.sockets[0].onmessage({ data: new Blob() });
  assert.deepEqual(api.sockets[0].sent, ['next']);
  assert.equal(api.sockets[0].readyState, 1);
  api.images.push({ ...full, rawText: '異なるOCR全文' });
  await api.sockets[0].onmessage({ data: new Blob() });
  await done;
  assert.equal(results.length, 1);
  assert.deepEqual(api.sockets[0].sent, ['next', 'close']);
  assert.equal(api.timers.size, 0);
  assert.ok(api.terminated());
});

test('ADBエラーは表示して接続を維持し、captureで再試行する', async () => {
  const api = setup();
  const reader = new api.default();
  const statuses = [];
  const done = reader.read(
    () => {},
    (status) => statuses.push(status),
  );
  api.sockets[0].open();
  await api.sockets[0].onmessage({
    data: JSON.stringify({ type: 'error', message: 'device offline' }),
  });
  assert.match(statuses.at(-1), /device offline/);
  api.timers.values().next().value();
  assert.deepEqual(api.sockets[0].sent, ['capture']);
  reader.stop();
  await done;
  assert.deepEqual(api.sockets[0].sent, ['capture', 'close']);
});

test('接続待ちを中止した場合もPromiseと再接続タイマーを終了する', async () => {
  const api = setup();
  const reader = new api.default();
  const done = reader.read(
    () => {},
    () => {},
  );
  api.sockets[0].close();
  assert.equal(api.timers.size, 1);
  reader.stop();
  await done;
  assert.equal(api.timers.size, 0);
});

test('スワイプのADBエラー後はnextを再送し、完了通知後に撮影する', async () => {
  const api = setup();
  const reader = new api.default();
  const done = reader.read(
    () => {},
    () => {},
  );
  const socket = api.sockets[0];
  socket.open();
  api.images.push(full);
  await socket.onmessage({ data: new Blob() });
  await socket.onmessage({ data: JSON.stringify({ type: 'error', message: 'swipe failed' }) });
  api.timers.values().next().value();
  assert.deepEqual(socket.sent, ['next', 'next']);
  api.timers.clear();
  await socket.onmessage({ data: JSON.stringify({ type: 'next' }) });
  api.timers.values().next().value();
  assert.deepEqual(socket.sent, ['next', 'next', 'capture']);
  reader.stop();
  await done;
});

test('保存の完了を待ってからスワイプし、複数個体を順番に処理する', async () => {
  const api = setup();
  const reader = new api.default();
  let finishSave;
  const pendingSave = new Promise((resolve) => {
    finishSave = resolve;
  });
  const seen = [];
  const done = reader.read(
    async (result) => {
      seen.push(result.lv);
      await pendingSave;
    },
    () => {},
  );
  const socket = api.sockets[0];
  socket.open();
  api.images.push(full);
  const processing = socket.onmessage({ data: new Blob() });
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(socket.sent, []);
  finishSave();
  await processing;
  api.images.push({ ...full, lv: 31 });
  await socket.onmessage({ data: new Blob() });
  api.images.push({ ...full, lv: 31 });
  await socket.onmessage({ data: new Blob() });
  await done;
  assert.deepEqual(seen, [30, 31]);
  assert.deepEqual(socket.sent, ['next', 'next', 'close']);
});

test('接続後の異常切断はエラーとして呼び出し元へ返す', async () => {
  const api = setup();
  const reader = new api.default();
  const done = reader.read(
    () => {},
    () => {},
  );
  api.sockets[0].open();
  api.sockets[0].close();
  await assert.rejects(done, /接続が切れました/);
});

test('読み取れない画面と未完了の画像では継続し、次の画像で揃った時だけ終了する', async () => {
  const api = setup();
  const reader = new api.default();
  const done = reader.read(
    () => {},
    () => {},
  );
  const socket = api.sockets[0];
  socket.open();
  api.images.push(new Error('認識対象なし'));
  await socket.onmessage({ data: new Blob() });
  assert.equal(socket.readyState, 1);
  assert.equal(api.timers.size, 1);
  api.images.push({ ...full, nature: null });
  await socket.onmessage({ data: new Blob() });
  assert.equal(socket.readyState, 1);
  assert.deepEqual(socket.sent, []);
  api.images.push({ ...empty, nature: full.nature });
  await socket.onmessage({ data: new Blob() });
  assert.equal(socket.readyState, 1);
  assert.deepEqual(socket.sent, []);
  api.images.push(full);
  await socket.onmessage({ data: new Blob() });
  assert.deepEqual(socket.sent, ['next']);
  api.images.push(full);
  await socket.onmessage({ data: new Blob() });
  await done;
  assert.deepEqual(socket.sent, ['next', 'close']);
});
