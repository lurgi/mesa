import { useEffect, useRef } from "react";
import type { UseInitSyncInitializer, UseInitSyncOptions } from "./types";

const storeRegistry = new WeakMap<object, Set<string>>();
const suspensePromises = new WeakMap<object, Promise<void>>();
const suspenseSetup = new WeakMap<object, Map<string, boolean>>();

export function useInitSync<T extends object>(
  store: T,
  initializer: UseInitSyncInitializer<T>,
  options: UseInitSyncOptions = {}
): void {
  const { key = "default", onError, deps = [], suspense = false } = options;
  const isInitialized = useRef(false);
  const hasSetupSuspense = useRef(false);

  if (!storeRegistry.has(store)) {
    storeRegistry.set(store, new Set<string>());
  }

  if (!suspenseSetup.has(store)) {
    suspenseSetup.set(store, new Map<string, boolean>());
  }

  const keys = storeRegistry.get(store)!;
  const setupMap = suspenseSetup.get(store)!;

  if (!setupMap.has(key) && suspense && typeof initializer === "function") {
    setupMap.set(key, true);
    hasSetupSuspense.current = true;

    const result = initializer(store);
    if (result instanceof Promise) {
      const suspensePromise = result
        .then(() => {
          suspensePromises.delete(store);
        })
        .catch((error) => {
          suspensePromises.delete(store);
          onError?.(error as Error);
        });
      suspensePromises.set(store, suspensePromise);
    }
  }

  useEffect(() => {
    if (keys.has(key) && !isInitialized.current) {
      throw new Error("Multiple useInitSync calls detected on the same store");
    }

    if (!isInitialized.current) {
      keys.add(key);
      isInitialized.current = true;

      if (!suspense) {
        const execute = async () => {
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
        };

        execute();
      } else {
        if (typeof initializer !== "function") {
          Object.assign(store, initializer as Partial<T>);
        }
      }
    }

    return () => {
      if (isInitialized.current) {
        keys.delete(key);
        setupMap.delete(key);
        isInitialized.current = false;
        hasSetupSuspense.current = false;
      }
    };
  }, [key, ...deps]);
}

export function getSuspensePromise<T extends object>(
  store: T
): Promise<void> | undefined {
  return suspensePromises.get(store);
}
