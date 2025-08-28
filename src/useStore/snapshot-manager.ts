import { getSuspensePromise } from "../useInitSync";
import { ErrorManager } from "../useInitSync/error-manager";

export class SnapshotManager {
  static getSnapshot<T extends object, R>(
    store: T,
    selector: (state: T) => R,
    lastValueRef: React.RefObject<R | undefined>
  ): R {
    const suspensePromise = getSuspensePromise(store);

    const errorBoundaryError = ErrorManager.getErrorBoundaryError(store);
    if (errorBoundaryError) {
      throw errorBoundaryError;
    }

    if (suspensePromise) {
      const trackingPromise = suspensePromise
        .then(() => {
          lastValueRef.current = undefined;
        })
        .catch((error) => {
          lastValueRef.current = undefined;
          throw error;
        });
      throw trackingPromise;
    }

    if (lastValueRef.current === undefined) {
      lastValueRef.current = selector(store);
    }

    return lastValueRef.current;
  }
}
