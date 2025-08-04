const proxyMap = new WeakMap<object, any>();
const pathListeners = new Map<string, Set<() => void>>();
const globalListeners = new Set<() => void>();
let currentTracker: { paths: Set<string> } | null = null;

export function subscribe(callback: () => void) {
  globalListeners.add(callback);
  return () => globalListeners.delete(callback);
}

export function subscribeToPath(path: string, callback: () => void) {
  if (!pathListeners.has(path)) {
    pathListeners.set(path, new Set());
  }
  pathListeners.get(path)!.add(callback);

  return () => {
    const listeners = pathListeners.get(path);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        pathListeners.delete(path);
      }
    }
  };
}

function notifyPath(path: string) {
  const listeners = pathListeners.get(path);
  if (listeners) {
    listeners.forEach((callback) => callback());
  }

  let parentPath = path;
  while (parentPath.includes(".")) {
    parentPath = parentPath.substring(0, parentPath.lastIndexOf("."));
    const parentListeners = pathListeners.get(parentPath);
    if (parentListeners) {
      parentListeners.forEach((callback) => callback());
    }
  }

  for (const [listenerPath, listenerSet] of pathListeners.entries()) {
    if (listenerPath.startsWith(path + ".")) {
      listenerSet.forEach((callback) => callback());
    }
  }
}

function notifyAll() {
  globalListeners.forEach((callback) => callback());
}

export function startTracking(): { paths: Set<string> } {
  const tracker = { paths: new Set<string>() };
  currentTracker = tracker;
  return tracker;
}

export function stopTracking() {
  currentTracker = null;
}

function trackAccess(path: string) {
  if (currentTracker) {
    currentTracker.paths.add(path);
  }
}

export function proxy<T extends object>(target: T, parentPath: string = ""): T {
  if (proxyMap.has(target)) {
    return proxyMap.get(target);
  }

  if (target === null || typeof target !== "object") {
    return target;
  }

  const proxied = new Proxy(target, {
    get(target, property, receiver) {
      const currentPath = parentPath ? `${parentPath}.${String(property)}` : String(property);
      trackAccess(currentPath);

      const value = Reflect.get(target, property, receiver);

      if (Array.isArray(target) && typeof value === "function") {
        const arrayMethods = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill"];
        if (arrayMethods.includes(String(property))) {
          return function (this: any, ...args: any[]) {
            const result = value.apply(this, args);
            const arrayPath = parentPath || "root";
            notifyPath(arrayPath);
            notifyPath(`${arrayPath}.length`);
            for (let i = 0; i < this.length; i++) {
              notifyPath(`${arrayPath}.${i}`);
            }
            notifyAll();
            return result;
          };
        }
      }

      if (value !== null && typeof value === "object") {
        return proxy(value, currentPath);
      }

      return value;
    },

    set(target, property, value, receiver) {
      const oldValue = Reflect.get(target, property, receiver);
      const result = Reflect.set(target, property, value, receiver);

      if (result && !Object.is(oldValue, value)) {
        const currentPath = parentPath ? `${parentPath}.${String(property)}` : String(property);
        notifyPath(currentPath);

        if (Array.isArray(target)) {
          if (property === "length" || !isNaN(Number(property))) {
            notifyPath(parentPath);
            notifyPath(`${parentPath}.length`);
          }
        }

        notifyAll();
      }

      return result;
    },

    deleteProperty(target, property) {
      const result = Reflect.deleteProperty(target, property);

      if (result) {
        const currentPath = parentPath ? `${parentPath}.${String(property)}` : String(property);
        notifyPath(currentPath);
        notifyAll();
      }

      return result;
    },

    has(target, property) {
      return Reflect.has(target, property);
    },

    ownKeys(target) {
      return Reflect.ownKeys(target);
    },

    getOwnPropertyDescriptor(target, property) {
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
  });

  proxyMap.set(target, proxied);

  return proxied;
}
