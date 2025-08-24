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
