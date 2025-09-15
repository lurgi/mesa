const errorStates = new WeakMap<object, Error>();
const errorBoundaryErrors = new WeakMap<object, Error>();

export class ErrorManager {
  static setError<T extends object>(
    store: T,
    error: Error | undefined
  ): void {
    if (error) {
      errorStates.set(store, error);
    } else {
      errorStates.delete(store);
    }
  }

  static getError<T extends object>(store: T): Error | undefined {
    return errorStates.get(store);
  }

  static clearError<T extends object>(store: T): void {
    errorStates.delete(store);
  }

  static setErrorBoundaryError<T extends object>(store: T, error: Error): void {
    errorBoundaryErrors.set(store, error);
  }

  static getErrorBoundaryError<T extends object>(store: T): Error | undefined {
    return errorBoundaryErrors.get(store);
  }

  static clearErrorBoundaryError<T extends object>(store: T): void {
    errorBoundaryErrors.delete(store);
  }
}
