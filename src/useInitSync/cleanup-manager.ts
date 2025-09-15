import { SuspenseManager } from "./suspense-manager";
import { ErrorManager } from "./error-manager";
import { StoreValidator } from "./store-validator";
import type React from "react";

export class CleanupManager {
  static cleanup<T extends object>(
    store: T,
    isInitializedRef: React.RefObject<boolean>,
    hasSetupSuspenseRef: React.RefObject<boolean>
  ): void {
    if (isInitializedRef.current) {
      StoreValidator.cleanup(store);
      SuspenseManager.removeSetup(store);
      ErrorManager.clearError(store);
      isInitializedRef.current = false;
      hasSetupSuspenseRef.current = false;
    }
  }
}
