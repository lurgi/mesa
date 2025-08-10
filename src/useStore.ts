import { useSyncExternalStore, useRef, useLayoutEffect } from "react";
import { subscribeToPath, startTracking, stopTracking } from "./proxy";

export function useStore<T extends object, R = T>(store: T, selector?: (state: T) => R): R {
  const actualSelector = selector || ((state: T) => state as unknown as R);
  const selectorRef = useRef(actualSelector);
  const subscribedPathsRef = useRef<Set<string>>(new Set());
  const unsubscribersRef = useRef<Array<() => void>>([]);
  const lastValueRef = useRef<R | undefined>(undefined);

  selectorRef.current = actualSelector;

  const subscribe = (callback: () => void) => {
    const tracker = startTracking();
    const initialValue = selectorRef.current(store);
    stopTracking();

    lastValueRef.current = initialValue;
    let paths = Array.from(tracker.paths);

    if (paths.length === 0) {
      paths = Object.keys(store);
    }

    subscribedPathsRef.current = new Set(paths);

    const isIdentitySelector =
      paths.length === Object.keys(store).length && paths.every((p) => Object.keys(store).includes(p));

    paths.forEach((path) => {
      const unsubscriber = subscribeToPath(path, () => {
        const newValue = selectorRef.current(store);

        if (Array.isArray(newValue) || isIdentitySelector) {
          if (Array.isArray(newValue)) {
            lastValueRef.current = [...newValue] as R;
          } else if (typeof newValue === "object" && newValue !== null) {
            lastValueRef.current = { ...newValue } as R;
          } else {
            lastValueRef.current = newValue;
          }
          callback();
        } else if (!Object.is(lastValueRef.current, newValue)) {
          lastValueRef.current = newValue;
          callback();
        } else if (typeof newValue === "object" && newValue !== null && lastValueRef.current !== null) {
          const oldValue = lastValueRef.current as any;
          const hasChanges =
            Object.keys(newValue).some((key) => !Object.is(oldValue[key], (newValue as any)[key])) ||
            Object.keys(oldValue).some((key) => !Object.is(oldValue[key], (newValue as any)[key]));
          if (hasChanges) {
            lastValueRef.current = { ...newValue } as R;
            callback();
          }
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
    return lastValueRef.current;
  };

  useLayoutEffect(() => {
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
    };
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
