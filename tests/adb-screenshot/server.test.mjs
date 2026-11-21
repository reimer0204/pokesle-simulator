import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, writeFileSync, unlinkSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const exe = process.env.POKESLE_TEST_EXE;
const adb = process.env.POKESLE_TEST_ADB;
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAICAIAAABRUclSAAAAD0lEQVR4nGP4jwQYaMcBAG4FX6GzdZeAAAAAAElFTkSuQmCC',
  'base64',
);

function launch(args, env = {}) {
  const child = spawn(exe, args, { windowsHide: true, env: { ...process.env, ...env } });
  let log = '';
  child.stdout.on('data', (data) => {
    log += data;
  });
  child.stderr.on('data', (data) => {
    log += data;
  });
  return { child, log: () => log };
}

async function connect(url) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    const messages = [];
    let notify;
    socket.onmessage = (event) => {
      messages.push(event.data);
      notify?.();
    };
    const opened = await new Promise((resolve) => {
      socket.onopen = () => resolve(true);
      socket.onerror = () => resolve(false);
    });
    if (opened)
      return {
        socket,
        async next() {
          if (!messages.length)
            await new Promise((resolve) => {
              notify = resolve;
            });
          notify = null;
          return messages.shift();
        },
      };
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('WebSocket server did not start');
}

test(
  '実exe: 既定ポートでADBエラー後も待機し、closeで正常終了',
  { skip: !exe, timeout: 15000 },
  async () => {
    const server = launch([
      '--mode',
      'pokemon-quote',
      '--adb',
      'C:\\nonexistent-pokesle-test\\adb.exe',
    ]);
    try {
      const { socket, next } = await connect('ws://127.0.0.1:23720/pokemon-quote');
      assert.equal(JSON.parse(await next()).type, 'error');
      assert.equal(server.child.exitCode, null);
      assert.match(server.log(), /ADB/);
      const exited = once(server.child, 'exit');
      socket.send('close');
      assert.equal((await exited)[0], 0);
    } finally {
      server.child.kill();
    }
  },
);

test(
  '実exe: スワイプ後も接続を保って再撮影し、ADBエラーから復旧する',
  { skip: !exe || !adb, timeout: 20000 },
  async () => {
    const directory = mkdtempSync(join(tmpdir(), 'pokesle-adb-test-'));
    const marker = join(directory, 'offline');
    const commandLog = join(directory, 'commands.log');
    const server = launch(
      [
        '--protocol',
        'pokesle-adb-screenshot://capture?mode=pokemon-quote&port=23729&session=integration',
        '--adb',
        adb,
      ],
      { POKESLE_TEST_ADB_ERROR: marker, POKESLE_TEST_ADB_LOG: commandLog },
    );
    try {
      const { socket, next } = await connect(
        'ws://127.0.0.1:23729/pokemon-quote?session=integration',
      );
      assert.deepEqual(Buffer.from(await next()), png);
      const rejected = new WebSocket('ws://127.0.0.1:23729/pokemon-quote?session=wrong');
      await new Promise((resolve) => {
        rejected.onerror = resolve;
      });
      writeFileSync(marker, 'offline');
      socket.send('capture');
      assert.match(JSON.parse(await next()).message, /device offline/);
      assert.equal(server.child.exitCode, null);
      unlinkSync(marker);
      socket.send('capture');
      assert.deepEqual(Buffer.from(await next()), png);
      writeFileSync(marker, 'offline');
      socket.send('next');
      assert.match(JSON.parse(await next()).message, /device offline/);
      assert.equal(server.child.exitCode, null);
      unlinkSync(marker);
      const exited = once(server.child, 'exit');
      socket.send('next');
      assert.equal(JSON.parse(await next()).type, 'next');
      assert.equal(server.child.exitCode, null);
      socket.send('capture');
      assert.deepEqual(Buffer.from(await next()), png);
      socket.send('close');
      assert.equal((await exited)[0], 0);
      assert.match(readFileSync(commandLog, 'utf8'), /shell input swipe 1 4 3 4 300/);
      assert.match(server.log(), /device offline/);
    } finally {
      server.child.kill();
      rmSync(directory, { recursive: true, force: true });
    }
  },
);

test(
  '実exe: 撮影後のcloseではスワイプせず終了する',
  { skip: !exe || !adb, timeout: 15000 },
  async () => {
    const directory = mkdtempSync(join(tmpdir(), 'pokesle-adb-cancel-'));
    const commandLog = join(directory, 'commands.log');
    const server = launch(['--mode', 'pokemon-quote', '--port', '23730', '--adb', adb], {
      POKESLE_TEST_ADB_LOG: commandLog,
    });
    try {
      const { socket, next } = await connect('ws://127.0.0.1:23730/pokemon-quote');
      assert.deepEqual(Buffer.from(await next()), png);
      const exited = once(server.child, 'exit');
      socket.send('close');
      assert.equal((await exited)[0], 0);
      assert.doesNotMatch(readFileSync(commandLog, 'utf8'), /swipe/);
    } finally {
      server.child.kill();
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
