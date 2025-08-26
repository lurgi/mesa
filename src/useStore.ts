import { useSyncExternalStore, useRef, useLayoutEffect } from "react";
import { PathTracker } from "./useStore/path-tracker";
import { SubscriptionManager } from "./useStore/subscription-manager";
import { ValueComparator } from "./useStore/value-comparator";
import { ValueUpdater } from "./useStore/value-updater";
import { SnapshotManager } from "./useStore/snapshot-manager";
import { CleanupSubscription } from "./useStore/cleanup-subscription";

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
    const { paths, initialValue } = PathTracker.trackPaths(
      store,
      selectorRef.current
    );
    lastValueRef.current = initialValue;

    subscribedPathsRef.current = new Set(paths);
    const isIdentitySelector = PathTracker.isIdentitySelector(paths, store);

    const createPathSubscription = (path: string) => {
      return SubscriptionManager.createPathSubscription(path, () => {
        const newValue = selectorRef.current(store);

        if (
          ValueComparator.shouldUpdateValue(
            newValue,
            lastValueRef.current,
            isIdentitySelector
          )
        ) {
          ValueUpdater.updateLastValue(
            newValue,
            isIdentitySelector,
            lastValueRef
          );
          callback();
        }
      });
    };

    paths.forEach((path) => {
      const unsubscriber = createPathSubscription(path);
      unsubscribersRef.current.push(unsubscriber);
    });

    const cleanup = () => {
      SubscriptionManager.cleanup(unsubscribersRef, subscribedPathsRef);
    };

    return cleanup;
  };

  const getSnapshot = (): R => {
    return SnapshotManager.getSnapshot(
      store,
      selectorRef.current,
      lastValueRef
    );
  };

  useLayoutEffect(() => {
    return CleanupSubscription.cleanupOnUnmount(unsubscribersRef);
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
