import type { ProxyConfig } from "./types";

const proxyMap = new WeakMap<object, any>();
const configMap = new WeakMap<object, Required<ProxyConfig>>();

const DEFAULT_CONFIG: Required<ProxyConfig> = {
  enableArrayTracking: true,
  enableNotifications: true,
};

export function getExistingProxy(target: object): any | undefined {
  return proxyMap.get(target);
}

export function getExistingConfig(target: object): Required<ProxyConfig> | undefined {
  return configMap.get(target);
}

export function setProxyCache(target: object, proxy: any, config: Required<ProxyConfig>): void {
  proxyMap.set(target, proxy);
  configMap.set(target, config);
}

export function isSameConfig(config1: Required<ProxyConfig>, config2: Required<ProxyConfig>): boolean {
  return JSON.stringify(config1) === JSON.stringify(config2);
}

export function createFinalConfig(config: ProxyConfig = {}): Required<ProxyConfig> {
  return { ...DEFAULT_CONFIG, ...config };
}