import { useCallback } from "react";
import type { UseInitSyncInitializer } from "../useInitSync";
import { clearCaches, setCachedResult } from "./caching";

// Refetch functionality for useInitSync
export function createRefetchFunction<T extends object, R>(
  store: T,
  initializer: UseInitSyncInitializer<T, R>,
  cacheKey: string,
  results: Map<string, { data: any; error: Error | null }>,
  forceUpdate: () => void
) {
  return useCallback(async () => {
    clearCaches(store, cacheKey);
    
    if (typeof initializer === "function") {
      const result = await (initializer as any)(store);
      setCachedResult(results, cacheKey, result);
      forceUpdate();
      return result;
    } else if (typeof (initializer as any).then === "function") {
      const result = await initializer;
      setCachedResult(results, cacheKey, result);
      forceUpdate();
      return result;
    }
    throw new Error("Invalid initializer type");
  }, [store, initializer, cacheKey, results, forceUpdate]);
}