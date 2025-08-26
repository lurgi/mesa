import type { UseInitSyncInitializer } from "../types/hooks";

export class InitializerExecutor {
  static async executeAsync<T extends object>(
    store: T,
    initializer: UseInitSyncInitializer<T>,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      if (typeof initializer === "function") {
        const result = initializer(store);
        if (result instanceof Promise) {
          await result;
        }
      } else {
        Object.assign(store, initializer as Partial<T>);
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }

  static executeSync<T extends object>(
    store: T,
    initializer: UseInitSyncInitializer<T>
  ): void {
    if (typeof initializer !== "function") {
      Object.assign(store, initializer as Partial<T>);
    }
  }
}