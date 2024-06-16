import { reactive, watch } from "vue";
import defaultConfig from "../data/default-config";
import mergeObject from "./utils/merge-object";

let config = reactive({
  ...defaultConfig,
  clone() {
    let result = {};
    for(const key of Object.keys(defaultConfig)) {
      result[key] = this[key];
    }
    return result;
  },
  save(newConfig) {
    if (newConfig) {
      mergeObject(this, newConfig)
    }

    localStorage.setItem('config', JSON.stringify({
      ...this,
    }));
  },
});

try {
  const cookieConfig = JSON.parse(localStorage.getItem('config'));
  mergeObject(config, cookieConfig);
} catch(e) {
  // NOP
}

watchEffect(() => {
  config.save()
})

export default config;