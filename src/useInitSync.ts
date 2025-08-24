export interface UseInitSyncOptions {
  suspense?: boolean;
  errorBoundary?: boolean;
  key?: string;
  deps?: any[];
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseInitSyncResult<R> {
  data: R | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<R>;
}

export type UseInitSyncInitializer<T, R> =
  | R
  | Partial<T>
  | Promise<R>
  | ((state: T) => R)
  | ((state: T) => Promise<R>)
  | ((state: T) => void);

import { useRef } from "react";
import { initializeCaches, getCachedResult } from "./core/caching";
import { validateStoreUsage } from "./core/validation";
import { useDependencyTracking } from "./core/dependencies";
import { handleDirectValue, handleSyncFunction, setupPromise } from "./core/initializers";
import { createRefetchFunction } from "./core/refetch";
import { useForceUpdate } from "./core/forceUpdate";

export function useInitSync<T extends object, R = any>(
  store: T,
  initializer: UseInitSyncInitializer<T, R>,
  options: UseInitSyncOptions = {}
): UseInitSyncResult<R> {
  const { errorBoundary = false, key, onSuccess, onError, deps } = options;
  const forceUpdate = useForceUpdate();
  const cacheKey = key || "default";
  const instanceKey = key || "default";
  const hasValidated = useRef(false);

  // Initialize caches
  const { promises, results } = initializeCaches(store);

  // Handle dependency changes
  useDependencyTracking(deps, () => {
    promises.delete(cacheKey);
    results.delete(cacheKey);
    forceUpdate();
  });

  // Create refetch function
  const refetch = createRefetchFunction(store, initializer, cacheKey, results, forceUpdate);

  // Validate store usage (only once per hook instance)
  if (!hasValidated.current) {
    validateStoreUsage(store, instanceKey);
    hasValidated.current = true;
  }

  // Check for cached result
  const cachedResult = getCachedResult<R>(results, cacheKey);
  if (cachedResult) {
    if (cachedResult.error) {
      if (errorBoundary) throw cachedResult.error;
      return {
        data: undefined,
        loading: false,
        error: cachedResult.error,
        refetch: async () => { throw cachedResult.error; },
      };
    }
    return {
      data: cachedResult.data,
      loading: false,
      error: null,
      refetch,
    };
  }

  // Check for existing promise (Suspense re-render)
  if (promises.has(cacheKey)) {
    throw promises.get(cacheKey)!;
  }

  // Handle direct values
  const directResult = handleDirectValue(store, initializer);
  if (directResult) {
    return directResult;
  }

  // Handle sync/async functions
  const { result: syncResult, promise } = handleSyncFunction(store, initializer, options);
  if (syncResult) {
    return syncResult;
  }

  // Handle async operations
  if (promise) {
    const isFirstRender = !promises.has(cacheKey);
    setupPromise(promise, promises, results, cacheKey, onSuccess, onError, forceUpdate);

    if (isFirstRender) {
      return {
        data: undefined,
        loading: true,
        error: null,
        refetch,
      };
    } else {
      throw promise;
    }
  }

  // Fallback (shouldn't reach here)
  return {
    data: undefined,
    loading: false,
    error: null,
    refetch: async () => undefined as any,
  };
}
