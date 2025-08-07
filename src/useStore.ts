import { useSyncExternalStore, useRef, useLayoutEffect } from "react";
import { subscribeToPath, startTracking, stopTracking } from "./proxy";

export function useStore<T extends object, R>(store: T, selector: (state: T) => R): R {
  const selectorRef = useRef(selector);
  const subscribedPathsRef = useRef<Set<string>>(new Set());
  const unsubscribersRef = useRef<Array<() => void>>([]);
  const lastValueRef = useRef<R | undefined>(undefined);

  selectorRef.current = selector;

  const subscribe = (callback: () => void) => {
    const tracker = startTracking();
    const initialValue = selectorRef.current(store);
    stopTracking();

    lastValueRef.current = initialValue;
    const paths = tracker.paths;
    subscribedPathsRef.current = new Set(paths);

    paths.forEach((path) => {
      const unsubscriber = subscribeToPath(path, () => {
        const newValue = selectorRef.current(store);

        if (!Object.is(lastValueRef.current, newValue)) {
          lastValueRef.current = newValue;
          callback();
        } else if (Array.isArray(newValue)) {
          // For arrays, create a shallow copy to force re-render on item changes
          lastValueRef.current = [...newValue] as R;
          callback();
        }
      });
      unsubscribersRef.current.push(unsubscriber);
    });

    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
      subscribedPathsRef.current.clear();
    };
  };

  const getSnapshot = (): R => {
    if (lastValueRef.current === undefined) {
      lastValueRef.current = selectorRef.current(store);
    }
    // Include force update count to ensure different snapshots for array item changes
    return lastValueRef.current;
  };

  useLayoutEffect(() => {
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
    };
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
