import { useSyncExternalStore, useRef } from "react";
import { subscribe } from "./proxy";

export function useStore<T extends object, R>(store: T, selector: (state: T) => R): R {
  const selectorRef = useRef(selector);
  const lastValueRef = useRef<R | undefined>(undefined);

  selectorRef.current = selector;

  const subscribeToStore = (callback: () => void) => {
    return subscribe(() => {
      const newValue = selectorRef.current(store);
      if (newValue !== lastValueRef.current) {
        lastValueRef.current = newValue;
        callback();
      }
    });
  };

  const getSnapshot = () => {
    const value = selectorRef.current(store);
    lastValueRef.current = value;
    return value;
  };

  return useSyncExternalStore(subscribeToStore, getSnapshot, getSnapshot);
}
