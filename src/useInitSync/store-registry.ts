const storeRegistry = new WeakMap<object, Set<string>>();

export class StoreRegistry {
  private static getKeys<T extends object>(store: T): Set<string> {
    if (!storeRegistry.has(store)) {
      storeRegistry.set(store, new Set<string>());
    }
    return storeRegistry.get(store)!;
  }

  static addKey<T extends object>(store: T, key: string): void {
    const keys = this.getKeys(store);
    keys.add(key);
  }

  static removeKey<T extends object>(store: T, key: string): void {
    const keys = this.getKeys(store);
    keys.delete(key);
  }

  static hasKey<T extends object>(store: T, key: string): boolean {
    const keys = this.getKeys(store);
    return keys.has(key);
  }
}
