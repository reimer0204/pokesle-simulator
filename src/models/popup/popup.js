import { reactive, markRaw, ref } from "vue";

class Popup {
  static list = reactive([]);

  static show(component, bind) {
    let uuid = 'p' + self.crypto.randomUUID().replace(/-/g, '');
    
    let popup = {
      component,
      bind,
      uuid,
    };

    const promise = new Promise(resolve => {
      popup.close = (value) => {
        resolve(value ?? popup.input);
        let index = this.list.findIndex(x => x === popup);
        this.list.splice(index, 1)
      }

      let markPopup = markRaw(popup);
  
      this.list.push(markPopup)
    })

    promise.popup = popup;

    return promise;
  }
}

export default Popup;