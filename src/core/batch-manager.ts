/**
 * Global batch manager for Mesa state updates
 * 
 * This system ensures that multiple state changes are batched together
 * to prevent excessive re-renders, especially during useInitSync operations.
 */

let batchedCallbacks: Set<() => void> = new Set();
let isBatching = false;
let batchDepth = 0;
let flushScheduled = false;

/**
 * Start global batch mode - all notifications will be queued instead of immediately executed
 */
export function startGlobalBatch(): void {
  batchDepth++;
  if (batchDepth === 1) {
    isBatching = true;
    batchedCallbacks.clear();
  }
}

/**
 * End global batch mode - flush all queued notifications
 */
export function endGlobalBatch(): void {
  batchDepth--;
  if (batchDepth === 0 && isBatching) {
    isBatching = false;
    scheduleFlush();
  }
}

/**
 * Schedule a flush of all batched callbacks
 * Uses queueMicrotask to ensure proper timing across async boundaries
 */
function scheduleFlush(): void {
  if (flushScheduled) return;
  
  flushScheduled = true;
  
  // Use queueMicrotask to ensure all callbacks are executed in a single microtask
  // This ensures that even if the user's async function has multiple await points,
  // all state changes are batched together and flushed at the right time
  queueMicrotask(() => {
    flushScheduled = false;
    
    if (batchedCallbacks.size === 0) return;
    
    const callbacks = Array.from(batchedCallbacks);
    batchedCallbacks.clear();
    
    // Execute all batched callbacks in a single microtask
    callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in batched callback:', error);
      }
    });
  });
}

/**
 * Add a callback to the batch queue if batching is active
 * Returns true if callback was batched, false if it should be executed immediately
 */
export function maybeBatchCallback(callback: () => void): boolean {
  if (isBatching) {
    batchedCallbacks.add(callback);
    return true; // Callback was batched
  }
  return false; // Execute immediately
}

/**
 * Check if we're currently in batch mode
 */
export function isBatchingActive(): boolean {
  return isBatching;
}

/**
 * Get current batch depth (for debugging)
 */
export function getBatchDepth(): number {
  return batchDepth;
}

/**
 * Clear all batched callbacks (for testing/cleanup)
 */
export function clearBatchedCallbacks(): void {
  batchedCallbacks.clear();
  flushScheduled = false;
}

/**
 * Execute a function with batching enabled
 * Useful for wrapping async operations that need batching
 */
export async function withBatch<T>(fn: () => Promise<T> | T): Promise<T> {
  startGlobalBatch();
  try {
    const result = await fn();
    return result;
  } finally {
    endGlobalBatch();
  }
}

/**
 * Force flush all batched callbacks immediately
 * Useful for testing or when immediate execution is needed
 */
export function flushBatchedCallbacks(): void {
  if (batchedCallbacks.size === 0) return;
  
  const callbacks = Array.from(batchedCallbacks);
  batchedCallbacks.clear();
  flushScheduled = false;
  
  callbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('Error in flushed callback:', error);
    }
  });
}