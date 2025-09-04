export {
  proxy,
  subscribe,
  subscribeToPath,
  startTracking,
  stopTracking,
} from "./proxy";
export { useStore } from "./useStore";
export { useInitSync } from "./useInitSync";
export {
  startGlobalBatch,
  endGlobalBatch,
  isBatchingActive,
  getBatchDepth,
  clearBatchedCallbacks,
  withBatch,
  flushBatchedCallbacks,
  maybeBatchCallback,
} from "./core/batch-manager";

export type * from "./types";
