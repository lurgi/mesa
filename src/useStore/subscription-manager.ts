import { subscribeToPath } from "../proxy";

export class SubscriptionManager {
  static createPathSubscription(
    path: string,
    callback: () => void
  ): () => void {
    return subscribeToPath(path, callback);
  }

  static createMultipleSubscriptions(
    paths: string[],
    callback: () => void,
    unsubscribersRef: React.RefObject<Array<() => void>>
  ): void {
    paths.forEach((path) => {
      const unsubscriber = this.createPathSubscription(path, callback);
      unsubscribersRef.current.push(unsubscriber);
    });
  }

  static cleanup(
    unsubscribersRef: React.RefObject<Array<() => void>>,
    subscribedPathsRef: React.RefObject<Set<string>>
  ): void {
    unsubscribersRef.current.forEach((unsub) => unsub());
    unsubscribersRef.current = [];
    subscribedPathsRef.current.clear();
  }
}
