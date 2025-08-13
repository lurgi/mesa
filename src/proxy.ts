import type { ProxyConfig } from "./core/types";
import { createGetHandler, createSetHandler, createDeleteHandler } from "./handlers/proxy-handlers";
import { isObject } from "./core/utils";

export { subscribeToPath, subscribeGlobal as subscribe } from "./core/listeners";
export { startTracking, stopTracking } from "./core/tracking";

const proxyMap = new WeakMap<object, any>();

const DEFAULT_CONFIG: Required<ProxyConfig> = {
  enableArrayTracking: true,
  enableNotifications: true,
};

export function proxy<T extends object>(target: T, parentPath: string = "", config: ProxyConfig = {}): T {
  if (proxyMap.has(target)) {
    return proxyMap.get(target);
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

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const proxied = createProxyWithHandlers(target, parentPath, finalConfig);
  proxyMap.set(target, proxied);

  return proxied;
}

function createProxyWithHandlers<T extends object>(target: T, parentPath: string, _config: Required<ProxyConfig>): T {
  return new Proxy(target, {
    get: createGetHandler(parentPath),
    set: createSetHandler(parentPath),
    deleteProperty: createDeleteHandler(parentPath),
    has: (target, property) => Reflect.has(target, property),
    ownKeys: (target) => Reflect.ownKeys(target),
    getOwnPropertyDescriptor: (target, property) => Reflect.getOwnPropertyDescriptor(target, property),
  });
}
