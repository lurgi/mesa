// Loading state management for proxy objects

// WeakMap to store loading metadata for each proxy object
const loadingMetadata = new WeakMap<
  object,
  {
    loadingPromises: Map<string, Promise<any>>;
    loadingFields: Set<string>;
    errorStates: Map<string, Error>;
  }
>();

export function initializeLoadingState(target: object): void {
  if (!loadingMetadata.has(target)) {
    loadingMetadata.set(target, {
      loadingPromises: new Map(),
      loadingFields: new Set(),
      errorStates: new Map(),
    });
  }
}

export function setFieldLoading<T>(target: object, field: string, promise: Promise<T>): void {
  initializeLoadingState(target);
  const metadata = loadingMetadata.get(target)!;

  metadata.loadingFields.add(field);
  metadata.loadingPromises.set(field, promise);
  metadata.errorStates.delete(field);

  promise
    .then(() => {
      metadata.loadingFields.delete(field);
      metadata.loadingPromises.delete(field);
    })
    .catch((error) => {
      metadata.loadingFields.delete(field);
      metadata.loadingPromises.delete(field);
      metadata.errorStates.set(field, error);
    });
}

export function isFieldLoading(target: object, field: string): boolean {
  const metadata = loadingMetadata.get(target);
  return metadata?.loadingFields.has(field) ?? false;
}

export function getFieldLoadingPromise(target: object, field: string): Promise<any> | undefined {
  const metadata = loadingMetadata.get(target);
  return metadata?.loadingPromises.get(field);
}

export function getFieldError(target: object, field: string): Error | undefined {
  const metadata = loadingMetadata.get(target);
  return metadata?.errorStates.get(field);
}

export function clearFieldError(target: object, field: string): void {
  const metadata = loadingMetadata.get(target);
  if (metadata) {
    metadata.errorStates.delete(field);
  }
}

export function clearLoadingState(target: object): void {
  loadingMetadata.delete(target);
}

export function getFieldNameFromPath(path: string): string {
  const normalizedPath = path.startsWith("root.") ? path.slice(5) : path;

  const firstDotIndex = normalizedPath.indexOf(".");
  return firstDotIndex === -1 ? normalizedPath : normalizedPath.slice(0, firstDotIndex);
}

export function getModifiedFields(target: object): string[] {
  if (typeof target !== "object" || target === null) {
    return [];
  }
  return Object.keys(target);
}
