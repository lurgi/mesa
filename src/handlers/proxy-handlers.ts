import { trackAccess } from "../core/tracking";
import { notifyPath } from "../core/notifications";
import { createPath, isObject } from "../core/utils";
import { handleArrayMethodCall } from "./array-handler";
import { proxy } from "../proxy";

export function createGetHandler(parentPath: string) {
  return function get(
    target: any,
    property: string | symbol,
    receiver: any
  ): any {
    const currentPath = createPath(parentPath, property);
    trackAccess(currentPath);

    const value = Reflect.get(target, property, receiver);

    const arrayHandler = handleArrayMethodCall(
      target,
      String(property),
      value,
      parentPath || "root"
    );
    if (arrayHandler) {
      return arrayHandler;
    }

    if (isObject(value)) {
      return proxy(value, currentPath);
    }

    return value;
  };
}

export function createSetHandler(parentPath: string) {
  return function set(
    target: any,
    property: string | symbol,
    value: any,
    receiver: any
  ): boolean {
    const oldValue = Reflect.get(target, property, receiver);

    if (isObject(value)) {
      const currentPath = createPath(parentPath, property);
      value = proxy(value, currentPath);
    }

    const result = Reflect.set(target, property, value, receiver);

    if (result && !Object.is(oldValue, value)) {
      const currentPath = createPath(parentPath, property);
      notifyPath(currentPath);

      if (Array.isArray(target)) {
        handleArrayPropertyChange(target, property, parentPath);
      }
    }

    return result;
  };
}

export function createDeleteHandler(parentPath: string) {
  return function deleteProperty(
    target: any,
    property: string | symbol
  ): boolean {
    const result = Reflect.deleteProperty(target, property);

    if (result) {
      const currentPath = createPath(parentPath, property);
      notifyPath(currentPath);
    }

    return result;
  };
}

function handleArrayPropertyChange(
  _target: any[],
  property: string | symbol,
  parentPath: string
): void {
  const rootPath = parentPath || "root";

  if (property === "length" || !isNaN(Number(property))) {
    notifyPath(rootPath);
    notifyPath(`${rootPath}.length`);
  }
}
