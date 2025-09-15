import type { UseInitSyncInitializer } from "../types/hooks";
import { ErrorManager } from "./error-manager";

const suspensePromises = new WeakMap<object, Promise<void>>();
const suspenseSetup = new WeakMap<object, boolean>();

export class SuspenseManager {
  static hasSetup<T extends object>(store: T): boolean {
    return suspenseSetup.get(store) || false;
  }

  static setSetup<T extends object>(store: T): void {
    suspenseSetup.set(store, true);
  }

  static removeSetup<T extends object>(store: T): void {
    suspenseSetup.delete(store);
  }

  static createPromise<T extends object>(
    store: T,
    initializer: UseInitSyncInitializer<T>,
    onError?: (error: Error) => void,
    errorBoundary: boolean = false
  ): void {
    if (typeof initializer !== "function") return;

    const result = initializer(store);
    if (result instanceof Promise) {
      const suspensePromise = result
        .then(() => {
          suspensePromises.delete(store);
        })
        .catch((error) => {
          onError?.(error as Error);
          if (errorBoundary) {
            ErrorManager.setErrorBoundaryError(store, error);
          }
          suspensePromises.delete(store);
          return Promise.resolve();
        });
      suspensePromises.set(store, suspensePromise);
    }
  }

  static getPromise<T extends object>(store: T): Promise<void> | undefined {
    return suspensePromises.get(store);
  }
}
