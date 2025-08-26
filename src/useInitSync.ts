import { useEffect, useRef } from "react";
import type { UseInitSyncInitializer, UseInitSyncOptions } from "./types/hooks";
import { StoreRegistry } from "./useInitSync/store-registry";
import { SuspenseManager } from "./useInitSync/suspense-manager";
import { StoreValidator } from "./useInitSync/store-validator";
import { InitializerExecutor } from "./useInitSync/initializer-executor";
import { CleanupManager } from "./useInitSync/cleanup-manager";

export function useInitSync<T extends object>(
  store: T,
  initializer: UseInitSyncInitializer<T>,
  options: UseInitSyncOptions = {}
): void {
  const { key = "default", onError, deps = [], suspense = false } = options;
  const isInitialized = useRef(false);
  const hasSetupSuspense = useRef(false);

  if (
    !SuspenseManager.hasSetup(store, key) &&
    suspense &&
    typeof initializer === "function"
  ) {
    SuspenseManager.setSetup(store, key);
    hasSetupSuspense.current = true;
    SuspenseManager.createPromise(store, initializer, onError);
  }

  useEffect(() => {
    StoreValidator.validateSingleUse(store, key, isInitialized.current);

    if (!isInitialized.current) {
      StoreRegistry.addKey(store, key);
      isInitialized.current = true;

      if (!suspense) {
        InitializerExecutor.executeAsync(store, initializer, onError);
      } else {
        InitializerExecutor.executeSync(store, initializer);
      }
    }

    return () => {
      CleanupManager.cleanup(store, key, isInitialized, hasSetupSuspense);
    };
  }, [key, ...deps]);
}

export function getSuspensePromise<T extends object>(
  store: T
): Promise<void> | undefined {
  return SuspenseManager.getPromise(store);
}
