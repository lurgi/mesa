const loadingStates = new WeakMap<object, Map<string, boolean>>();

export class LoadingManager {
  private static getLoadingMap<T extends object>(
    store: T
  ): Map<string, boolean> {
    if (!loadingStates.has(store)) {
      loadingStates.set(store, new Map<string, boolean>());
    }
    return loadingStates.get(store)!;
  }

  static setLoading<T extends object>(
    store: T,
    key: string,
    loading: boolean
  ): void {
    const loadingMap = this.getLoadingMap(store);
    loadingMap.set(key, loading);

    (store as any).loading = loading;
  }

  static removeLoading<T extends object>(store: T, key: string): void {
    const loadingMap = this.getLoadingMap(store);
    loadingMap.delete(key);

    const hasLoadingOperations = Array.from(loadingMap.values()).some(
      (loading) => loading
    );
    (store as any).loading = hasLoadingOperations;
  }
}
