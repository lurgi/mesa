import { notifyPath } from "../core/notifications";
import { isArrayMutationMethod, getArrayIndexRange } from "../core/utils";

export function createArrayMethodHandler(originalMethod: Function, arrayPath: string): Function {
  return function (this: any[], ...args: any[]): any {
    const originalLength = this.length;
    const result = originalMethod.apply(this, args);
    const newLength = this.length;

    notifyArrayChanges(arrayPath, originalLength, newLength);

    return result;
  };
}

export function handleArrayMethodCall(
  target: any[],
  property: string,
  value: Function,
  arrayPath: string
): Function | undefined {
  if (!Array.isArray(target) || typeof value !== "function") {
    return undefined;
  }

  if (isArrayMutationMethod(property)) {
    return createArrayMethodHandler(value, arrayPath);
  }

  return undefined;
}

function notifyArrayChanges(arrayPath: string, originalLength: number, newLength: number): void {
  notifyPath(arrayPath);
  notifyPath(`${arrayPath}.length`);

  const affectedIndices = getArrayIndexRange(originalLength, newLength);
  affectedIndices.forEach((index) => {
    notifyPath(`${arrayPath}.${index}`);
  });
}
