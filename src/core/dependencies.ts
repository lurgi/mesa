import { useRef, useEffect } from "react";

// Dependency change detection for useInitSync
export function useDependencyTracking(deps: any[] | undefined, onDepsChange: () => void) {
  const prevDepsRef = useRef<any[] | undefined>(undefined);
  
  useEffect(() => {
    if (deps && prevDepsRef.current) {
      const depsChanged =
        deps.length !== prevDepsRef.current.length || 
        deps.some((dep, i) => !Object.is(dep, prevDepsRef.current![i]));

      if (depsChanged) {
        onDepsChange();
      }
    }
    prevDepsRef.current = deps ? [...deps] : undefined;
  }, deps || []);
}