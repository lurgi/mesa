import type { UseInitSyncInitializer } from "../types/hooks";
import { LoadingManager } from "./loading-manager";
import { ErrorManager } from "./error-manager";

export class InitializerExecutor {
  static async executeAsync<T extends object>(
    store: T,
    initializer: UseInitSyncInitializer<T>,
    onError?: (error: Error) => void,
    onSuccess?: (data: any) => void
  ): Promise<void> {
    // LoadingManager.setLoading(store, true); // 🚫 제거 - 사용자가 직접 관리
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
      // LoadingManager.setLoading(store, false); // 🚫 제거 - 사용자가 직접 관리
      onSuccess?.(result);
    } catch (error) {
      // LoadingManager.setLoading(store, false); // 🚫 제거 - 사용자가 직접 관리
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
    // LoadingManager.setLoading(store, true); // 🚫 제거 - 사용자가 직접 관리
    ErrorManager.clearError(store);

    try {
      if (typeof initializer === "function") {
        initializer(store);
      } else {
        Object.assign(store, initializer as Partial<T>);
      }
      // LoadingManager.setLoading(store, false); // 🚫 제거 - 사용자가 직접 관리
      onSuccess?.(store);
    } catch (error) {
      // LoadingManager.setLoading(store, false); // 🚫 제거 - 사용자가 직접 관리
      const errorObj = error as Error;
      ErrorManager.setError(store, errorObj);
      onError?.(errorObj);
      throw errorObj;
    }
  }
}
