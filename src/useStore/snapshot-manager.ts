import { getSuspensePromise } from "../useInitSync";
import { SuspenseManager } from "../useInitSync/suspense-manager";

export class SnapshotManager {
  static getSnapshot<T extends object, R>(
    store: T,
    selector: (state: T) => R,
    lastValueRef: React.RefObject<R | undefined>
  ): R {
    const suspensePromise = getSuspensePromise(store);

    // Check for ErrorBoundary errors first
    const errorBoundaryError = SuspenseManager.getErrorBoundaryError(store);
    if (errorBoundaryError) {
      // Don't clear immediately - let ErrorBoundary handle it first
      throw errorBoundaryError;
    }

    if (suspensePromise) {
      const trackingPromise = suspensePromise
        .then(() => {
          lastValueRef.current = undefined;
        })
        .catch((error) => {
          lastValueRef.current = undefined;
          // Re-throw the error so ErrorBoundary can catch it
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
