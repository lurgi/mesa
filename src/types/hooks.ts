export interface UseInitSyncOptions {
  key?: string;
  deps?: any[];
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  suspense?: boolean;
}

export type UseInitSyncInitializer<T> = T | ((state: T) => void | Promise<void>);
