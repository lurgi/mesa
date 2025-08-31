const loadingStates = new WeakMap<object, boolean>();

export class LoadingManager {
  static setLoading<T extends object>(
    store: T,
    loading: boolean
  ): void {
    loadingStates.set(store, loading);
    (store as any).loading = loading;
  }

  static removeLoading<T extends object>(store: T): void {
    loadingStates.delete(store);
    (store as any).loading = false;
  }

  static getLoading<T extends object>(store: T): boolean {
    return loadingStates.get(store) || false;
  }
}
