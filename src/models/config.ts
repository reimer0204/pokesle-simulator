import { reactive, watch } from "vue";
import defaultConfig from "../data/default-config";
import mergeObject from "./utils/merge-object";
import SubSkill from "@/data/sub-skill";
import { migrateEvaluateConfig } from "./evaluate-setting";

const EVALUATE_SETTING_MIGRATION_VERSION = 20260919;

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
  const savedConfigVersion = Number(cookieConfig.v) || 0;
  if (cookieConfig.selectEvaluate.silverSeedUse != null) {
    cookieConfig.selectEvaluate.silverSeed = Object.fromEntries(
      SubSkill.list
      .filter(x => x.next != null)
      .map(x => [x.name, cookieConfig.selectEvaluate.silverSeedUse])
    )
  }
  if (savedConfigVersion < EVALUATE_SETTING_MIGRATION_VERSION) {
    migrateEvaluateConfig(cookieConfig.selectEvaluate);
    migrateEvaluateConfig(cookieConfig.tmpEvaluate);
  }
  cookieConfig.v = Math.max(savedConfigVersion, defaultConfig.v);
  mergeObject(config, cookieConfig);

  if (config.simulation.fixSkillSeed === true) {
    config.simulation.fixSkillSeed = 1;
  }
} catch(e) {
  // NOP
}

watchEffect(() => {
  config.save()
})

export default config;
