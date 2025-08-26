import { StoreRegistry } from "./store-registry";

export class StoreValidator {
  static validateSingleUse<T extends object>(
    store: T,
    key: string,
    isInitialized: boolean
  ): void {
    if (StoreRegistry.hasKey(store, key) && !isInitialized) {
      throw new Error("Multiple useInitSync calls detected on the same store");
    }
  }
}