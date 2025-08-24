import type { UseInitSyncInitializer, UseInitSyncResult, UseInitSyncOptions } from "../useInitSync";

// Direct value initializer - applies values immediately without async behavior
export function handleDirectValue<T extends object, R>(
  store: T,
  initializer: UseInitSyncInitializer<T, R>
): UseInitSyncResult<R> | null {
  // Direct object value - apply immediately
  if (typeof initializer === "object" && initializer !== null && typeof (initializer as any).then !== "function") {
    Object.assign(store, initializer);
    return {
      data: initializer as R,
      loading: false,
      error: null,
      refetch: async () => initializer as R,
    };
  }

  // Primitive value
  if (typeof initializer !== "function" && (!initializer || typeof (initializer as any).then !== "function")) {
    return {
      data: initializer as R,
      loading: false,
      error: null,
      refetch: async () => initializer as R,
    };
  }

  return null; // Not a direct value
}

// Sync function initializer - executes function immediately
export function handleSyncFunction<T extends object, R>(
  store: T,
  initializer: UseInitSyncInitializer<T, R>,
  options: UseInitSyncOptions
): { result: UseInitSyncResult<R> | null; promise: Promise<R> | null } {
  const { errorBoundary, onSuccess, onError } = options;

  if (typeof initializer === "function") {
    try {
      const result = (initializer as any)(store);
      if (result && typeof result.then === "function") {
        // It's a promise, return it for async handling
        return { result: null, promise: result };
      } else {
        // Sync function result
        if (onSuccess) onSuccess(result);
        return {
          result: {
            data: result as R,
            loading: false,
            error: null,
            refetch: async () => result as R,
          },
          promise: null
        };
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (onError) onError(err);
      if (errorBoundary) throw err;
      return {
        result: {
          data: undefined,
          loading: false,
          error: err,
          refetch: async () => { throw err; },
        },
        promise: null
      };
    }
  } else if (typeof (initializer as any).then === "function") {
    // Direct promise
    return { result: null, promise: initializer as Promise<R> };
  }

  return { result: null, promise: null };
}

// Promise setup and handling
export function setupPromise<R>(
  promise: Promise<R>,
  promises: Map<string, Promise<any>>,
  results: Map<string, { data: any; error: Error | null }>,
  cacheKey: string,
  onSuccess: ((data: R) => void) | undefined,
  onError: ((error: Error) => void) | undefined,
  forceUpdate: () => void
) {
  promises.set(cacheKey, promise);
  
  // Handle promise resolution/rejection
  promise
    .then((result) => {
      promises.delete(cacheKey);
      results.set(cacheKey, { data: result, error: null });
      if (onSuccess) onSuccess(result);
      forceUpdate(); // Trigger re-render
    })
    .catch((error) => {
      promises.delete(cacheKey);
      const err = error instanceof Error ? error : new Error(String(error));
      results.set(cacheKey, { data: undefined, error: err });
      if (onError) onError(err);
      forceUpdate(); // Trigger re-render
    });
}