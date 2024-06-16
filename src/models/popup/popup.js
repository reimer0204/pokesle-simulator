import { reactive, markRaw } from "vue";

class Popup {
  static list = reactive([]);

  static async show(component, bind) {
    return new Promise(resolve => {

      let popup = {
        component,
        bind,
        close: (value) => {
          resolve(value);
          let index = this.list.findIndex(x => x !== popup);
          this.list.splice(index, 1)
        }
      };

      let markPopup = markRaw(popup);
  
      this.list.push(markPopup)
    })
  }
}

export default Popup;