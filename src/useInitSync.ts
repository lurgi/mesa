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

type UseInitSyncInitializer<T, R> =
  | R // Direct value
  | Partial<T> // Store partial update
  | Promise<R> // Promise
  | ((state: T) => R) // Sync function
  | ((state: T) => Promise<R>) // Async function
  | ((state: T) => void); // Side-effect function

export function useInitSync<T extends object, R = any>(
  store: T,
  initializer: UseInitSyncInitializer<T, R>,
  options: UseInitSyncOptions = {}
): UseInitSyncResult<R> {
  // TODO: Implement useInitSync with support for:
  // - Direct values: useInitSync(store, { user: { name: "John" } })
  // - Primitive values: useInitSync(store, "ready")
  // - Promises: useInitSync(store, fetchData())
  // - Sync functions: useInitSync(store, (state) => { state.ready = true; })
  // - Async functions: useInitSync(store, async (state) => { ... })
  // - Void functions: useInitSync(store, (state) => { state.init = true; })
  throw new Error("useInitSync not implemented yet");
}
