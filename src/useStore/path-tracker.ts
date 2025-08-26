import { startTracking, stopTracking } from "../proxy";

export class PathTracker {
  static trackPaths<T extends object>(
    store: T,
    selector: (state: T) => any
  ): { paths: string[]; initialValue: any } {
    const tracker = startTracking();
    const initialValue = selector(store);
    stopTracking();

    let paths = Array.from(tracker.paths);

    if (paths.length === 0) {
      paths = Object.keys(store);
    }

    return { paths, initialValue };
  }

  static isIdentitySelector<T extends object>(
    paths: string[],
    store: T
  ): boolean {
    return (
      paths.length === Object.keys(store).length &&
      paths.every((p) => Object.keys(store).includes(p))
    );
  }
}
