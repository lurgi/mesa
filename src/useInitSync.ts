import { useEffect, useRef, useState, useCallback } from "react";
import type { UseInitSyncInitializer, UseInitSyncOptions, UseInitSyncReturn } from "./types/hooks";
import { StoreRegistry } from "./useInitSync/store-registry";
import { SuspenseManager } from "./useInitSync/suspense-manager";
import { StoreValidator } from "./useInitSync/store-validator";
import { InitializerExecutor } from "./useInitSync/initializer-executor";
import { CleanupManager } from "./useInitSync/cleanup-manager";
import { ErrorManager } from "./useInitSync/error-manager";
import { LoadingManager } from "./useInitSync/loading-manager";

export function useInitSync<T extends object>(
  store: T,
  initializer: UseInitSyncInitializer<T>,
  options: UseInitSyncOptions = {}
): UseInitSyncReturn {
  const { 
    key = "default", 
    onError, 
    onSuccess,
    deps = [], 
    suspense = false, 
    errorBoundary = false 
  } = options;
  
  const isInitialized = useRef(false);
  const hasSetupSuspense = useRef(false);
  const [, forceUpdate] = useState({});

  // Force re-render when error state changes
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  const refetch = useCallback(() => {
    if (!isInitialized.current) return;

    const execute = async () => {
      try {
        if (!suspense) {
          await InitializerExecutor.executeAsync(store, initializer, key, onError, onSuccess);
        } else {
          InitializerExecutor.executeSync(store, initializer, key, onError, onSuccess);
        }
        triggerUpdate();
      } catch (error) {
        triggerUpdate();
        if (errorBoundary) {
          throw error; // Re-throw for ErrorBoundary
        }
      }
    };

    execute();
  }, [store, initializer, key, onError, onSuccess, suspense, errorBoundary, triggerUpdate]);

  // Handle suspense setup outside of useEffect
  if (
    !SuspenseManager.hasSetup(store, key) &&
    suspense &&
    typeof initializer === "function"
  ) {
    SuspenseManager.setSetup(store, key);
    hasSetupSuspense.current = true;
    SuspenseManager.createPromise(store, initializer, onError, errorBoundary);
  }

  // When errorBoundary is true and suspense is enabled, useInitSync needs to handle throwing
  // This is for cases where there's no useStore call in the component
  if (suspense && errorBoundary) {
    const errorBoundaryError = SuspenseManager.getErrorBoundaryError(store);
    if (errorBoundaryError) {
      throw errorBoundaryError;
    }
    
    // If there's a suspense promise, throw it (for components without useStore)
    const suspensePromise = SuspenseManager.getPromise(store);
    if (suspensePromise) {
      throw suspensePromise;
    }
  }

  useEffect(() => {
    StoreValidator.validateSingleUse(store, key, isInitialized.current);

    if (!isInitialized.current) {
      StoreRegistry.addKey(store, key);
      isInitialized.current = true;

      const execute = async () => {
        try {
          if (!suspense) {
            await InitializerExecutor.executeAsync(store, initializer, key, onError, onSuccess);
          } else {
            InitializerExecutor.executeSync(store, initializer, key, onError, onSuccess);
          }
          triggerUpdate();
        } catch (error) {
          triggerUpdate();
          if (errorBoundary) {
            throw error; // Re-throw for ErrorBoundary
          }
        }
      };

      execute();
    }

    return () => {
      CleanupManager.cleanup(store, key, isInitialized, hasSetupSuspense);
    };
  }, [key, ...deps]);

  // Get current error state
  const error = ErrorManager.getError(store, key);

  return { error, refetch };
}

export function getSuspensePromise<T extends object>(
  store: T
): Promise<void> | undefined {
  return SuspenseManager.getPromise(store);
}
