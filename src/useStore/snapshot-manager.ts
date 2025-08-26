import { getSuspensePromise } from "../useInitSync";

export class SnapshotManager {
  static getSnapshot<T extends object, R>(
    store: T,
    selector: (state: T) => R,
    lastValueRef: React.RefObject<R | undefined>
  ): R {
    const suspensePromise = getSuspensePromise(store);

    if (suspensePromise) {
      const trackingPromise = suspensePromise
        .then(() => {
          lastValueRef.current = undefined;
        })
        .catch(() => {
          lastValueRef.current = undefined;
        });
      throw trackingPromise;
    }

    if (lastValueRef.current === undefined) {
      lastValueRef.current = selector(store);
    }

    return lastValueRef.current;
  }
}
