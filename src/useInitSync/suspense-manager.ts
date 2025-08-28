import type { UseInitSyncInitializer } from "../types/hooks";

const suspensePromises = new WeakMap<object, Promise<void>>();
const suspenseSetup = new WeakMap<object, Map<string, boolean>>();
const errorBoundaryErrors = new WeakMap<object, Error>();

export class SuspenseManager {
  static getSetupMap<T extends object>(store: T): Map<string, boolean> {
    if (!suspenseSetup.has(store)) {
      suspenseSetup.set(store, new Map<string, boolean>());
    }
    return suspenseSetup.get(store)!;
  }

  static hasSetup<T extends object>(store: T, key: string): boolean {
    const setupMap = this.getSetupMap(store);
    return setupMap.has(key);
  }

  static setSetup<T extends object>(store: T, key: string): void {
    const setupMap = this.getSetupMap(store);
    setupMap.set(key, true);
  }

  static removeSetup<T extends object>(store: T, key: string): void {
    const setupMap = this.getSetupMap(store);
    setupMap.delete(key);
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
            // For ErrorBoundary integration, store the error and remove the promise
            // This will allow the component to re-render and then throw the error
            errorBoundaryErrors.set(store, error);
            suspensePromises.delete(store);
            return Promise.resolve(); // Resolve so suspense ends and component re-renders
          } else {
            // For non-errorBoundary errors, resolve the promise so suspense ends
            suspensePromises.delete(store);
            return Promise.resolve();
          }
        });
      suspensePromises.set(store, suspensePromise);
    }
  }

  static getPromise<T extends object>(store: T): Promise<void> | undefined {
    return suspensePromises.get(store);
  }

  static getErrorBoundaryError<T extends object>(store: T): Error | undefined {
    return errorBoundaryErrors.get(store);
  }

  static clearErrorBoundaryError<T extends object>(store: T): void {
    errorBoundaryErrors.delete(store);
  }
}
