import { useState, useCallback } from "react";

// Force update hook for triggering re-renders
export function useForceUpdate() {
  const [, setForceUpdate] = useState({});
  return useCallback(() => setForceUpdate({}), []);
}