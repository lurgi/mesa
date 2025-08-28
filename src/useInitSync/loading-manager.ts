const loadingStates = new WeakMap<object, Map<string, boolean>>();

export class LoadingManager {
  static getLoadingMap<T extends object>(store: T): Map<string, boolean> {
    if (!loadingStates.has(store)) {
      loadingStates.set(store, new Map<string, boolean>());
    }
    return loadingStates.get(store)!;
  }

  static setLoading<T extends object>(store: T, key: string, loading: boolean): void {
    const loadingMap = this.getLoadingMap(store);
    loadingMap.set(key, loading);
    
    // Set loading property on store
    (store as any).loading = loading;
  }

  static isLoading<T extends object>(store: T, key: string): boolean {
    const loadingMap = this.getLoadingMap(store);
    return loadingMap.get(key) || false;
  }

  static removeLoading<T extends object>(store: T, key: string): void {
    const loadingMap = this.getLoadingMap(store);
    loadingMap.delete(key);
    
    // Check if any other operations are still loading
    const hasLoadingOperations = Array.from(loadingMap.values()).some(loading => loading);
    (store as any).loading = hasLoadingOperations;
  }
}