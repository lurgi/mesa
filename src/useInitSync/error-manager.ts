const errorStates = new WeakMap<object, Map<string, Error | undefined>>();

export class ErrorManager {
  static getErrorMap<T extends object>(store: T): Map<string, Error | undefined> {
    if (!errorStates.has(store)) {
      errorStates.set(store, new Map<string, Error | undefined>());
    }
    return errorStates.get(store)!;
  }

  static setError<T extends object>(store: T, key: string, error: Error | undefined): void {
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

  static removeError<T extends object>(store: T, key: string): void {
    const errorMap = this.getErrorMap(store);
    errorMap.delete(key);
  }
}