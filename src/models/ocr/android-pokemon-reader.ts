import PokemonStatusImageReader, {
  type PokemonStatusImageResult,
} from './pokemon-status-image-reader';

// 入力済みの編集値や別の画像と混ぜず、1枚の画面で読めた項目だけで完了判定する。
export function isPokemonScreenshotComplete(result: Partial<PokemonStatusImageResult>) {
  return !!(
    result.pokemonName &&
    result.lv &&
    result.mainSkillLv &&
    result.nature &&
    result.foodList?.length === 3 &&
    result.foodList.every(Boolean) &&
    result.subSkillList?.length === 5 &&
    result.subSkillList.every(Boolean)
  );
}

export function pokemonScreenshotKey(result: PokemonStatusImageResult) {
  // OCRの全文・進捗などは比較せず、認識済みの個体ステータスを比較する。
  return JSON.stringify([
    result.pokemonName,
    result.name,
    result.lv,
    result.mainSkillName,
    result.mainSkillLv,
    result.foodList,
    result.subSkillList,
    result.nature,
    result.helpTime,
    result.bag,
  ]);
}

export default class AndroidPokemonReader {
  #socket: WebSocket | null = null;
  #reader = new PokemonStatusImageReader();
  #stopped = false;
  #command: 'capture' | 'next' = 'capture';
  #finish: (() => void) | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;

  async read(
    onResult: (result: PokemonStatusImageResult) => Promise<void> | void,
    onStatus: (status: string) => void,
  ) {
    const session = crypto.randomUUID();
    const port = 23720;
    window.location.href = `pokesle-adb-screenshot://capture?mode=pokemon-quote&port=${port}&session=${session}`;
    const deadline = Date.now() + 60_000;
    let previousKey: string | null = null;
    return new Promise<void>((resolve, reject) => {
      this.#finish = resolve;
      const fail = (error: unknown) => {
        this.#finish = null;
        this.stop();
        reject(error instanceof Error ? error : new Error('Android端末からの取得に失敗しました。'));
      };
      const connect = () => {
        if (this.#stopped) {
          resolve();
          return;
        }
        onStatus(
          '専用アプリへの接続を待っています。起動・ローカルネットワークへのアクセスを許可してください。',
        );
        const socket = new WebSocket(`ws://127.0.0.1:${port}/pokemon-quote?session=${session}`);
        this.#socket = socket;
        let opened = false;
        socket.onopen = () => {
          opened = true;
          onStatus('接続しました。スマホでポケモンのステータス画面を表示してください。');
        };
        socket.onerror = () => {
          /* 起動前の接続失敗はcloseで再試行する。 */
        };
        socket.onclose = (event) => {
          if (this.#stopped) {
            resolve();
            return;
          }
          if (!opened && Date.now() < deadline) {
            this.#timer = setTimeout(connect, 1000);
          } else {
            fail(
              new Error(
                opened
                  ? '専用アプリとの接続が切れました。'
                  : '専用アプリに接続できません。最新版のexeとプロトコル登録を確認してください。',
              ),
            );
          }
        };
        socket.onmessage = async (event) => {
          try {
            if (typeof event.data === 'string') {
              const error = JSON.parse(event.data);
              if (error.type === 'next') {
                this.#command = 'capture';
                onStatus('スワイプしました。次のポケモンの画面を待っています。');
              } else {
                onStatus(`ADBエラー: ${error.message}（接続を確認してください。再試行します）`);
              }
            } else {
              onStatus(
                'スクリーンショットを解析しています。スマホの画面はそのままにしてください。',
              );
              let incoming: PokemonStatusImageResult;
              try {
                incoming = await this.#reader.read(event.data);
              } catch (error) {
                if (this.#stopped) return;
                onStatus(
                  `画像を読み取れませんでした。ステータス画面を表示してください。${error instanceof Error ? error.message : ''}`,
                );
                this.#timer = setTimeout(() => {
                  if (socket.readyState === WebSocket.OPEN) socket.send('capture');
                }, 1000);
                return;
              }
              if (this.#stopped) return;
              if (isPokemonScreenshotComplete(incoming)) {
                const key = pokemonScreenshotKey(incoming);
                if (key === previousKey) {
                  onStatus('前回と同じステータスのため、最後のポケモンとして終了しました。');
                  this.stop();
                  return;
                }
                onStatus('厳選情報を計算し、登録条件を確認しています。');
                await onResult(incoming);
                if (this.#stopped) return;
                previousKey = key;
                this.#command = 'next';
                socket.send('next');
                return;
              }
              onStatus(
                '読み取れていない項目があります。ステータス画面を表示したままお待ちください。再取得します。',
              );
            }
            if (!this.#stopped)
              this.#timer = setTimeout(() => {
                if (socket.readyState === WebSocket.OPEN) socket.send(this.#command);
              }, 1000);
          } catch (error) {
            if (this.#stopped) resolve();
            else fail(error);
          } finally {
            if (this.#stopped) await this.#reader.terminate();
          }
        };
      };
      connect();
    });
  }

  stop() {
    this.#stopped = true;
    if (this.#timer) clearTimeout(this.#timer);
    const socket = this.#socket;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send('close');
      socket.close();
    } else if (socket?.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
    void this.#reader.terminate();
    this.#finish?.();
  }
}
