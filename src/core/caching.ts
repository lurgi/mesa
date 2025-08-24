// Cache management for useInitSync
export const promiseCache = new WeakMap<object, Map<string, Promise<any>>>();
export const resultCache = new WeakMap<object, Map<string, { data: any; error: Error | null }>>();

export function initializeCaches(store: object) {
  if (!promiseCache.has(store)) {
    promiseCache.set(store, new Map());
  }
  if (!resultCache.has(store)) {
    resultCache.set(store, new Map());
  }
  
  return {
    promises: promiseCache.get(store)!,
    results: resultCache.get(store)!,
  };
}

export function clearCaches(store: object, cacheKey: string) {
  if (promiseCache.has(store)) {
    promiseCache.get(store)!.delete(cacheKey);
  }
  if (resultCache.has(store)) {
    resultCache.get(store)!.delete(cacheKey);
  }
}

export function getCachedResult<R>(results: Map<string, { data: any; error: Error | null }>, cacheKey: string) {
  return results.get(cacheKey) as { data: R; error: Error | null } | undefined;
}

export function setCachedResult<R>(results: Map<string, { data: any; error: Error | null }>, cacheKey: string, data: R, error: Error | null = null) {
  results.set(cacheKey, { data, error });
}