import { useEffect, useRef } from "react";
import type { UseInitSyncInitializer, UseInitSyncOptions } from "./types";

const storeRegistry = new WeakMap<object, Set<string>>();

export function useInitSync<T extends object>(
  store: T,
  initializer: UseInitSyncInitializer<T>,
  options: UseInitSyncOptions = {}
): void {
  const { key = "default", onError, deps = [], suspense = false } = options;
  const isInitialized = useRef(false);

  if (!storeRegistry.has(store)) {
    storeRegistry.set(store, new Set<string>());
  }

  const keys = storeRegistry.get(store)!;

  useEffect(() => {
    if (keys.has(key) && !isInitialized.current) {
      throw new Error("Multiple useInitSync calls detected on the same store");
    }

    if (!isInitialized.current) {
      keys.add(key);
      isInitialized.current = true;

      const execute = async () => {
        try {
          if (typeof initializer === "function") {
            const result = initializer(store);
            if (result instanceof Promise) {
              if (suspense) {
                (store as any).__mesa_loading = true;
              }
              await result;
              if (suspense) {
                (store as any).__mesa_loading = false;
              }
            }
          } else {
            Object.assign(store, initializer as Partial<T>);
          }
        } catch (error) {
          if (suspense) {
            (store as any).__mesa_loading = false;
          }
          onError?.(error as Error);
        }
      };

      execute();
    }

    return () => {
      if (isInitialized.current) {
        keys.delete(key);
        isInitialized.current = false;
      }
    };
  }, [key, ...deps]);
}
