// Store validation for useInitSync - ensures one hook per store rule
export const storeTracker = new WeakMap<object, Set<string>>();

export function validateStoreUsage(store: object, instanceKey: string) {
  // Initialize store tracking
  if (!storeTracker.has(store)) {
    storeTracker.set(store, new Set<string>());
  }
  
  const existingKeys = storeTracker.get(store)!;
  
  if (existingKeys.has(instanceKey)) {
    throw new Error("Multiple useInitSync calls detected on the same store");
  }
  
  // Track this instance
  existingKeys.add(instanceKey);
}