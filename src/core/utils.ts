export function createPath(parentPath: string, property: string | symbol): string {
  const propertyStr = String(property);
  return parentPath ? `${parentPath}.${propertyStr}` : propertyStr;
}

export function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

export function validateCallback(callback: unknown, functionName: string): void {
  if (typeof callback !== "function") {
    throw new Error(`${functionName}: Expected a function, got ${typeof callback}`);
  }
}

export function isArrayMutationMethod(method: string): boolean {
  const arrayMethods = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill"];
  return arrayMethods.includes(method);
}

export function getArrayIndexRange(originalLength: number, newLength: number): number[] {
  const maxLength = Math.max(originalLength, newLength);
  return Array.from({ length: maxLength }, (_, i) => i);
}

export function isPlainObject(value: unknown): value is Record<string, any> {
  if (!isObject(value)) return false;
  
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

export function deepMerge(target: any, source: any): any {
  if (!isPlainObject(source)) {
    throw new Error('deepMerge: source must be a plain object');
  }

  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

export function isValidData(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (!isPlainObject(value)) return false;
  
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}
