export interface UseInitSyncOptions {
  key?: string;
  deps?: any[];
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  suspense?: boolean;
  errorBoundary?: boolean;
}

export type UseInitSyncInitializer<T> =
  | T
  | ((state: T) => void | Promise<void>);

export interface UseInitSyncReturn {
  error?: Error;
  refetch: () => void;
}
