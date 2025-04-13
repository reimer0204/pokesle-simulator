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

  static show(component: any, bind?: object) {
    let uuid = 'p' + self.crypto.randomUUID().replace(/-/g, '');
    
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