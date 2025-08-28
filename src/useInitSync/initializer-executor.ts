import type { UseInitSyncInitializer } from "../types/hooks";
import { LoadingManager } from "./loading-manager";
import { ErrorManager } from "./error-manager";

export class InitializerExecutor {
  static async executeAsync<T extends object>(
    store: T,
    initializer: UseInitSyncInitializer<T>,
    key: string,
    onError?: (error: Error) => void,
    onSuccess?: (data: any) => void
  ): Promise<void> {
    LoadingManager.setLoading(store, key, true);
    ErrorManager.clearError(store, key);

    try {
      let result: any;
      if (typeof initializer === "function") {
        result = initializer(store);
        if (result instanceof Promise) {
          result = await result;
          // If the promise resolves to a value, assign it to store.data
          if (result !== undefined && result !== null && typeof result !== 'object') {
            (store as any).data = result;
          }
        }
      } else {
        Object.assign(store, initializer as Partial<T>);
        result = store;
      }
      LoadingManager.setLoading(store, key, false);
      onSuccess?.(result);
    } catch (error) {
      LoadingManager.setLoading(store, key, false);
      const errorObj = error as Error;
      ErrorManager.setError(store, key, errorObj);
      onError?.(errorObj);
      throw errorObj; // Re-throw for error boundary handling
    }
  }

  static executeSync<T extends object>(
    store: T,
    initializer: UseInitSyncInitializer<T>,
    key: string,
    onError?: (error: Error) => void,
    onSuccess?: (data: any) => void
  ): void {
    LoadingManager.setLoading(store, key, true);
    ErrorManager.clearError(store, key);

    try {
      if (typeof initializer === "function") {
        initializer(store);
      } else {
        Object.assign(store, initializer as Partial<T>);
      }
      LoadingManager.setLoading(store, key, false);
      onSuccess?.(store);
    } catch (error) {
      LoadingManager.setLoading(store, key, false);
      const errorObj = error as Error;
      ErrorManager.setError(store, key, errorObj);
      onError?.(errorObj);
      throw errorObj; // Re-throw for error boundary handling
    }
  }
}
