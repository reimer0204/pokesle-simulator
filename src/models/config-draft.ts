import { computed, ref } from 'vue';

// 編集した項目だけを反映し、編集中に他の場所で更新された設定は保持する。
function getChanges(before: any, after: any): Record<string, any> {
  const changes: Record<string, any> = {};
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) === JSON.stringify(after[key])) continue;
    if (before[key]?.constructor === Object && after[key]?.constructor === Object) {
      changes[key] = getChanges(before[key], after[key]);
    } else {
      changes[key] = after[key];
    }
  }
  return changes;
}

export function useConfigDraft<T extends { clone(): any; save(value: any): void }>(source: T) {
  const draft = ref<any>(null);
  let original: any = null;
  const config = computed<T>(() => draft.value ?? source);

  function begin() {
    original = source.clone();
    draft.value = source.clone();
  }

  function commit() {
    if (draft.value == null) return false;
    const changes = getChanges(original, draft.value);
    draft.value = null;
    original = null;
    if (!Object.keys(changes).length) return false;
    source.save(changes);
    return true;
  }

  return { config, begin, commit };
}
