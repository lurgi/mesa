import type { UseInitSyncInitializer } from "../types/hooks";
import { ErrorManager } from "./error-manager";

export class InitializerExecutor {
  static async executeAsync<T extends object>(
    store: T,
    initializer: UseInitSyncInitializer<T>,
    onError?: (error: Error) => void,
    onSuccess?: (data: any) => void
  ): Promise<void> {
    ErrorManager.clearError(store);

    try {
      let result: any;
      if (typeof initializer === "function") {
        result = initializer(store);
        if (result instanceof Promise) {
          result = await result;
          if (
            result !== undefined &&
            result !== null &&
            typeof result !== "object"
          ) {
            (store as any).data = result;
          }
        }
      } else {
        Object.assign(store, initializer as Partial<T>);
        result = store;
      }

      onSuccess?.(result);
    } catch (error) {
      const errorObj = error as Error;
      ErrorManager.setError(store, errorObj);
      onError?.(errorObj);
      throw errorObj;
    }
  }

  static executeSync<T extends object>(
    store: T,
    initializer: UseInitSyncInitializer<T>,
    onError?: (error: Error) => void,
    onSuccess?: (data: any) => void
  ): void {
    ErrorManager.clearError(store);

    try {
      if (typeof initializer === "function") {
        initializer(store);
      } else {
        Object.assign(store, initializer as Partial<T>);
      }

      onSuccess?.(store);
    } catch (error) {
      const errorObj = error as Error;
      ErrorManager.setError(store, errorObj);
      onError?.(errorObj);
      throw errorObj;
    }
  }
}
