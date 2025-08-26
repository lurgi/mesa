import { useSyncExternalStore, useRef, useLayoutEffect } from "react";
import { subscribeToPath, startTracking, stopTracking } from "./proxy";
import { getSuspensePromise } from "./useInitSync";

export function useStore<T extends object, R = T>(
  store: T,
  selector?: (state: T) => R
): R {
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

    // If no paths are tracked, use all keys of the store
    if (paths.length === 0) {
      paths = Object.keys(store);
    }

    subscribedPathsRef.current = new Set(paths);

    const isIdentitySelector =
      paths.length === Object.keys(store).length &&
      paths.every((p) => Object.keys(store).includes(p));

    const createPathSubscription = (path: string) => {
      return subscribeToPath(path, () => {
        const newValue = selectorRef.current(store);

        if (
          shouldUpdateValue(newValue, lastValueRef.current, isIdentitySelector)
        ) {
          updateLastValue(newValue, isIdentitySelector);
          callback();
        }
      });
    };

    const shouldUpdateValue = (
      newValue: R,
      oldValue: R | undefined,
      isIdentity: boolean
    ): boolean => {
      if (Array.isArray(newValue) || isIdentity) {
        return true;
      }

      if (!Object.is(oldValue, newValue)) {
        return true;
      }

      if (
        typeof newValue === "object" &&
        newValue !== null &&
        oldValue !== null
      ) {
        return hasObjectChanges(newValue, oldValue as any);
      }

      return false;
    };

    const hasObjectChanges = (newValue: any, oldValue: any): boolean => {
      return (
        Object.keys(newValue).some(
          (key) => !Object.is(oldValue[key], newValue[key])
        ) ||
        Object.keys(oldValue).some(
          (key) => !Object.is(oldValue[key], newValue[key])
        )
      );
    };

    const updateLastValue = (newValue: R, isIdentity: boolean): void => {
      if (Array.isArray(newValue)) {
        lastValueRef.current = [...newValue] as R;
      } else if (
        typeof newValue === "object" &&
        newValue !== null &&
        isIdentity
      ) {
        lastValueRef.current = { ...newValue } as R;
      } else {
        lastValueRef.current = newValue;
      }
    };

    paths.forEach((path) => {
      const unsubscriber = createPathSubscription(path);
      unsubscribersRef.current.push(unsubscriber);
    });

    const cleanup = () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
      subscribedPathsRef.current.clear();
    };

    return cleanup;
  };

  const getSnapshot = (): R => {
    const suspensePromise = getSuspensePromise(store);
    if (suspensePromise) {
      throw suspensePromise;
    }

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
