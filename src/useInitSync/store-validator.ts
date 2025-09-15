const storeInitMap = new WeakMap<object, boolean>();

export class StoreValidator {
  static validateSingleUse<T extends object>(
    store: T,
    isInitialized: boolean
  ): void {
    if (storeInitMap.has(store) && !isInitialized) {
      throw new Error("Multiple useInitSync calls detected on the same store. Use separate stores for different concerns.");
    }
  }

  static markAsInitialized<T extends object>(store: T): void {
    storeInitMap.set(store, true);
  }

  static cleanup<T extends object>(store: T): void {
    storeInitMap.delete(store);
  }
}