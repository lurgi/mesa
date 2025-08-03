const proxyMap = new WeakMap<object, any>();

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
      
      // TODO: 여기서 구독자들에게 변경 사항을 알릴 예정
      
      return result;
    },

    deleteProperty(target, property) {
      const result = Reflect.deleteProperty(target, property);
      
      // TODO: 여기서 구독자들에게 삭제 사항을 알릴 예정
      
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
