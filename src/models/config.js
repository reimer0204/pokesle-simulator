import { reactive, watch } from "vue";
import defaultConfig from "../data/default-config";
import mergeObject from "./utils/merge-object";

let config = reactive({
  ...defaultConfig,
  clone() {
    return JSON.parse(JSON.stringify(this));
  },
  save(newConfig) {
    if (newConfig) {
      mergeObject(this, newConfig)
    }

    try {
      localStorage.setItem('config', JSON.stringify({
        ...this,
      }));
    } catch(e) {
      // ignore
    }
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