import { useSyncExternalStore, useRef, useLayoutEffect } from "react";
import { subscribeToPath, startTracking, stopTracking } from "./proxy";

export function useStore<T extends object, R>(store: T, selector: (state: T) => R): R {
  const selectorRef = useRef(selector);
  const subscribedPathsRef = useRef<Set<string>>(new Set());
  const unsubscribersRef = useRef<Array<() => void>>([]);

  selectorRef.current = selector;

  const updateSubscriptions = (callback: () => void) => {
    const tracker = startTracking();
    selectorRef.current(store);
    stopTracking();

    const newPaths = tracker.paths;
    const currentPaths = subscribedPathsRef.current;

    if (!areSetsEqual(newPaths, currentPaths)) {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
      subscribedPathsRef.current = new Set(newPaths);

      newPaths.forEach(path => {
        const unsubscriber = subscribeToPath(path, () => {
          updateSubscriptions(callback);
          callback();
        });
        unsubscribersRef.current.push(unsubscriber);
      });
    }
  };

  const subscribeToStore = (callback: () => void) => {
    updateSubscriptions(callback);

    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
      subscribedPathsRef.current.clear();
    };
  };

  const getSnapshot = (): R => {
    return selectorRef.current(store);
  };

  useLayoutEffect(() => {
    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
    };
  }, []);

  return useSyncExternalStore(subscribeToStore, getSnapshot, getSnapshot);
}

function areSetsEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
}
