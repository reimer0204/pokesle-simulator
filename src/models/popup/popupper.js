import PopupArea from "./popup-area.vue"
import PopupList from "./popup";

export default class Popupper {

  static install(app) {
    app.component('popup-area', PopupArea);

    
  }

  static showPopup(component, bind) {
    PopupList.add(component, bind)
  }
}