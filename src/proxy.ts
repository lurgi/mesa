const proxyMap = new WeakMap<object, any>();
const listeners = new Set<() => void>();

export function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyAll() {
  listeners.forEach(callback => callback());
}

export function proxy<T extends object>(target: T): T {
  if (proxyMap.has(target)) {
    return proxyMap.get(target);
  }

  if (target === null || typeof target !== 'object') {
    return target;
  }

  const proxied = new Proxy(target, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      
      if (value !== null && typeof value === 'object') {
        return proxy(value);
      }
      
      return value;
    },

    set(target, property, value, receiver) {
      const result = Reflect.set(target, property, value, receiver);
      
      if (result) {
        notifyAll();
      }
      
      return result;
    },

    deleteProperty(target, property) {
      const result = Reflect.deleteProperty(target, property);
      
      if (result) {
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
    }
  });

  proxyMap.set(target, proxied);
  
  return proxied;
}
