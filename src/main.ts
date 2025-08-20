export { proxy, subscribe, subscribeToPath, startTracking, stopTracking } from "./proxy";
export { useStore } from "./useStore";

export type { 
  Tracker, 
  Callback, 
  Unsubscriber, 
  PathNotificationOptions, 
  ProxyConfig,
  PlainObject,
  WithSyncResult
} from "./core/types";
