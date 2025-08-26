export class CleanupSubscription {
  static cleanupOnUnmount(
    unsubscribersRef: React.RefObject<Array<() => void>>
  ): () => void {
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
    };
  }
}
