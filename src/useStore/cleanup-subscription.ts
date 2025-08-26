export class CleanupSubscription {
  static cleanupOnUnmount(
    unsubscribersRef: React.MutableRefObject<Array<() => void>>
  ): () => void {
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
    };
  }
}