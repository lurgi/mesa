export function createPath(
  parentPath: string,
  property: string | symbol
): string {
  const propertyStr = String(property);
  return parentPath ? `${parentPath}.${propertyStr}` : propertyStr;
}

export function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

export function isValidProperty(property: string | symbol): boolean {
  return typeof property === "string" || typeof property === "symbol";
}

export function validateCallback(
  callback: unknown,
  functionName: string
): void {
  if (typeof callback !== "function") {
    throw new Error(
      `${functionName}: Expected a function, got ${typeof callback}`
    );
  }
}

export function isArrayMutationMethod(method: string): boolean {
  const arrayMethods = [
    "push",
    "pop",
    "shift",
    "unshift",
    "splice",
    "sort",
    "reverse",
    "fill",
  ];
  return arrayMethods.includes(method);
}

export function getArrayIndexRange(
  originalLength: number,
  newLength: number
): number[] {
  const maxLength = Math.max(originalLength, newLength);
  return Array.from({ length: maxLength }, (_, i) => i);
}
