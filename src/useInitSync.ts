import { useEffect, useRef, useState, useCallback } from "react";
import type {
  UseInitSyncInitializer,
  UseInitSyncOptions,
  UseInitSyncReturn,
} from "./types/hooks";
import { SuspenseManager } from "./useInitSync/suspense-manager";
import { StoreValidator } from "./useInitSync/store-validator";
import { InitializerExecutor } from "./useInitSync/initializer-executor";
import { CleanupManager } from "./useInitSync/cleanup-manager";
import { ErrorManager } from "./useInitSync/error-manager";
import { startGlobalBatch, endGlobalBatch, maybeBatchCallback } from "./core/batch-manager";

export function useInitSync<T extends object>(
  store: T,
  initializer: UseInitSyncInitializer<T>,
  options: UseInitSyncOptions = {}
): UseInitSyncReturn {
  const {
    onError,
    onSuccess,
    deps = [],
    suspense = false,
    errorBoundary = false,
  } = options;

  const isInitialized = useRef(false);
  const hasSetupSuspense = useRef(false);
  const [, forceUpdate] = useState({});

  const triggerUpdate = useCallback(() => {
    // Try to batch the update - if batching is active, it will be queued
    // If not active, execute immediately
    if (!maybeBatchCallback(() => forceUpdate({}))) {
      forceUpdate({});
    }
  }, []);

  const refetch = useCallback(() => {
    if (!isInitialized.current) return;

    const execute = async () => {
      try {
        startGlobalBatch(); // 🔥 모든 알림 큐잉 시작
        
        if (!suspense) {
          await InitializerExecutor.executeAsync(
            store,
            initializer,
            onError,
            onSuccess
          );
        } else {
          InitializerExecutor.executeSync(
            store,
            initializer,
            onError,
            onSuccess
          );
        }
        triggerUpdate();
      } catch (error) {
        triggerUpdate();
        if (errorBoundary) {
          throw error;
        }
      } finally {
        endGlobalBatch(); // 🔥 일괄 플러시
      }
    };

    execute();
  }, [
    store,
    initializer,
    onError,
    onSuccess,
    suspense,
    errorBoundary,
    triggerUpdate,
  ]);

  if (
    !SuspenseManager.hasSetup(store) &&
    suspense &&
    typeof initializer === "function"
  ) {
    SuspenseManager.setSetup(store);
    hasSetupSuspense.current = true;
    SuspenseManager.createPromise(store, initializer, onError, errorBoundary);
  }

  if (suspense && errorBoundary) {
    const errorBoundaryError = ErrorManager.getErrorBoundaryError(store);
    if (errorBoundaryError) {
      throw errorBoundaryError;
    }

    const suspensePromise = SuspenseManager.getPromise(store);
    if (suspensePromise) {
      throw suspensePromise;
    }
  }

  useEffect(() => {
    StoreValidator.validateSingleUse(store, isInitialized.current);

    if (!isInitialized.current) {
      StoreValidator.markAsInitialized(store);
      isInitialized.current = true;

      const execute = async () => {
        try {
          startGlobalBatch(); // 🔥 모든 알림 큐잉 시작
          
          if (!suspense) {
            await InitializerExecutor.executeAsync(
              store,
              initializer,
              onError,
              onSuccess
            );
          } else {
            InitializerExecutor.executeSync(
              store,
              initializer,
              onError,
              onSuccess
            );
          }
          
          // triggerUpdate will be batched and executed after endGlobalBatch
          triggerUpdate();
        } catch (error) {
          triggerUpdate();
          if (errorBoundary) {
            throw error;
          }
        } finally {
          endGlobalBatch(); // 🔥 일괄 플러시 (여기서 triggerUpdate 실행됨)
        }
      };

      execute();
    }

    return () => {
      CleanupManager.cleanup(store, isInitialized, hasSetupSuspense);
    };
  }, [...deps]);

  const error = ErrorManager.getError(store);

  return { error, refetch };
}

export function getSuspensePromise<T extends object>(
  store: T
): Promise<void> | undefined {
  return SuspenseManager.getPromise(store);
}
