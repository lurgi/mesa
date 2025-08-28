import { StoreRegistry } from "./store-registry";
import { SuspenseManager } from "./suspense-manager";
import { LoadingManager } from "./loading-manager";
import { ErrorManager } from "./error-manager";
import type React from "react";

export class CleanupManager {
  static cleanup<T extends object>(
    store: T,
    key: string,
    isInitializedRef: React.RefObject<boolean>,
    hasSetupSuspenseRef: React.RefObject<boolean>
  ): void {
    if (isInitializedRef.current) {
      StoreRegistry.removeKey(store, key);
      SuspenseManager.removeSetup(store, key);
      LoadingManager.removeLoading(store, key);
      ErrorManager.clearError(store, key);
      isInitializedRef.current = false;
      hasSetupSuspenseRef.current = false;
    }
  }
}
