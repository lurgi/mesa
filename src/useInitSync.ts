import { useEffect, useRef } from "react";
import type { UseInitSyncInitializer, UseInitSyncOptions } from "./types";

const storeRegistry = new WeakMap<object, Set<string>>();

export function useInitSync<T extends object>(
  store: T,
  initializer: UseInitSyncInitializer<T>,
  options: UseInitSyncOptions = {}
): void {
  const { key = "default", onError, deps = [] } = options;
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
            await initializer(store);
          } else {
            Object.assign(store, initializer as Partial<T>);
          }
        } catch (error) {
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
