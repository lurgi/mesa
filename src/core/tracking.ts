import type { Tracker } from './types';

let currentTracker: Tracker | null = null;

export function createTracker(): Tracker {
  return { paths: new Set<string>() };
}

export function startTracking(): Tracker {
  const tracker = createTracker();
  currentTracker = tracker;
  return tracker;
}

export function stopTracking(): void {
  currentTracker = null;
}

export function getCurrentTracker(): Tracker | null {
  return currentTracker;
}

export function trackAccess(path: string): void {
  if (currentTracker) {
    currentTracker.paths.add(path);
  }
}

export function isTracking(): boolean {
  return currentTracker !== null;
}