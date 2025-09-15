import type { Callback, Unsubscriber } from "../types";
import { validateCallback } from "./utils";
import { maybeBatchCallback } from "./batch-manager";

const pathListeners = new Map<string, Set<Callback>>();
const globalListeners = new Set<Callback>();

export function subscribeToPath(
  path: string,
  callback: Callback
): Unsubscriber {
  validateCallback(callback, "subscribeToPath");

  if (typeof path !== "string") {
    throw new Error("subscribeToPath: path must be a string");
  }

  if (!pathListeners.has(path)) {
    pathListeners.set(path, new Set());
  }

  const listeners = pathListeners.get(path)!;
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) {
      pathListeners.delete(path);
    }
  };
}

export function subscribeGlobal(callback: Callback): Unsubscriber {
  validateCallback(callback, "subscribeGlobal");

  globalListeners.add(callback);
  return () => globalListeners.delete(callback);
}

export function notifyPathListeners(path: string): void {
  const listeners = pathListeners.get(path);
  if (listeners) {
    listeners.forEach((callback) => {
      // Try to batch the callback, if batching is not active, execute immediately
      if (!maybeBatchCallback(callback)) {
        callback();
      }
    });
  }
}

export function notifyGlobalListeners(): void {
  globalListeners.forEach((callback) => {
    // Try to batch the callback, if batching is not active, execute immediately
    if (!maybeBatchCallback(callback)) {
      callback();
    }
  });
}

export function getPathListeners(): Map<string, Set<Callback>> {
  return pathListeners;
}

export function clearAllListeners(): void {
  pathListeners.clear();
  globalListeners.clear();
}
