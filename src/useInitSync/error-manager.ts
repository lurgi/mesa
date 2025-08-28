const errorStates = new WeakMap<object, Map<string, Error | undefined>>();
const errorBoundaryErrors = new WeakMap<object, Error>();

export class ErrorManager {
  private static getErrorMap<T extends object>(
    store: T
  ): Map<string, Error | undefined> {
    if (!errorStates.has(store)) {
      errorStates.set(store, new Map<string, Error | undefined>());
    }
    return errorStates.get(store)!;
  }

  static setError<T extends object>(
    store: T,
    key: string,
    error: Error | undefined
  ): void {
    const errorMap = this.getErrorMap(store);
    errorMap.set(key, error);
  }

  static getError<T extends object>(store: T, key: string): Error | undefined {
    const errorMap = this.getErrorMap(store);
    return errorMap.get(key);
  }

  static clearError<T extends object>(store: T, key: string): void {
    const errorMap = this.getErrorMap(store);
    errorMap.delete(key);
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
