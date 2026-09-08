import { reactive, markRaw } from "vue";

interface PopupType {
  component: any,
  bind?: object,
  uuid: string,
  close: Function,
  input?: any,
}
interface PopupShowPromise extends Promise<any> {
  popup: PopupType
}

class Popup {
  static list = reactive<PopupType[]>([]);
  private static uuidSequence = 0;

  private static createUuid() {
    const randomUuid = globalThis.crypto?.randomUUID?.();
    if (randomUuid) {
      return 'p' + randomUuid.replace(/-/g, '');
    }

    // Android実機からLAN内のHTTP環境へアクセスするとrandomUUIDが利用できないため、
    // DOM要素の紐付けに必要な一意性を時刻とページ内連番で補う。
    return `p${Date.now().toString(36)}${(this.uuidSequence++).toString(36)}`;
  }

  static show(component: any, bind?: object) {
    let uuid = this.createUuid();
    
    let close: Function;
    const promise = new Promise(resolve => {
      close = (value: any) => {
        resolve(value ?? popup.input);
        let index = this.list.findIndex(x => x === popup);
        this.list.splice(index, 1)
      }
      // let markPopup = markRaw(popup);
    })

    let popup: PopupType = {
      component: markRaw(component),
      bind,
      uuid,
      close: close!,
    };
    this.list.push(popup)

    const result: PopupShowPromise = Object.assign(promise, { popup })

    return result;
  }
}

export default Popup;
