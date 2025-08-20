import type { ProxyConfig, PlainObject, WithSyncResult } from "./core/types";
import {
  createGetHandler,
  createSetHandler,
  createDeleteHandler,
} from "./handlers/proxy-handlers";
import { isObject, deepMerge, isValidData } from "./core/utils";
import {
  getExistingProxy,
  getExistingConfig,
  setProxyCache,
  isSameConfig,
  createFinalConfig,
} from "./core/proxy-cache";
import { useEffect, useRef, useState } from "react";

export {
  subscribeToPath,
  subscribeGlobal as subscribe,
} from "./core/listeners";
export { startTracking, stopTracking } from "./core/tracking";

export function proxy<T extends object>(
  target: T,
  parentPath: string = "",
  config: ProxyConfig = {}
): T {
  const existing = getExistingProxy(target);
  if (existing) {
    const existingConfig = getExistingConfig(target);
    const finalConfig = createFinalConfig(config);

    if (existingConfig && isSameConfig(existingConfig, finalConfig)) {
      return existing;
    }
  }

  if (!isObject(target)) {
    throw new Error(`proxy: Expected an object, got ${typeof target}`);
  }

  if (typeof parentPath !== "string") {
    throw new Error("proxy: parentPath must be a string");
  }

  if (config !== null && typeof config !== "object") {
    throw new Error("proxy: config must be an object");
  }

  const finalConfig = createFinalConfig(config);

  const proxied = createProxyWithHandlers(target, parentPath, finalConfig);
  setProxyCache(target, proxied, finalConfig);

  return proxied;
}

function createProxyWithHandlers<T extends object>(
  target: T,
  parentPath: string,
  _config: Required<ProxyConfig>
): T {
  return new Proxy(target, {
    get: createGetHandler(parentPath),
    set: createSetHandler(parentPath),
    deleteProperty: createDeleteHandler(parentPath),
    has: (target, property) => Reflect.has(target, property),
    ownKeys: (target) => Reflect.ownKeys(target),
    getOwnPropertyDescriptor: (target, property) =>
      Reflect.getOwnPropertyDescriptor(target, property),
  });
}

function withSync<T extends PlainObject>(initialState: T): WithSyncResult<T> {
  if (!isValidData(initialState)) {
    throw new Error("withSync: initialState must be a valid plain object");
  }

  const state = proxy(initialState);

  const useSync = (data: Parameters<WithSyncResult<T>["useSync"]>[0]) => {
    const prevDataRef = useRef<typeof data>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (!isValidData(data)) {
        return;
      }

      if (prevDataRef.current === data) {
        return;
      }

      prevDataRef.current = data;
      setIsLoading(true);

      try {
        const merged = deepMerge(state, data);
        Object.keys(data as object).forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            (state as any)[key] = merged[key];
          }
        });
      } catch (error) {
        console.error("useSync: Failed to merge data", error);
      } finally {
        setIsLoading(false);
      }
    }, [data]);

    return { isLoading };
  };

  return { state, useSync };
}

proxy.withSync = withSync;
