import type { PathNotificationOptions } from "../types";
import {
  notifyPathListeners,
  notifyGlobalListeners,
  getPathListeners,
} from "./listeners";

const DEFAULT_OPTIONS: Required<PathNotificationOptions> = {
  notifyParents: true,
  notifyChildren: true,
  notifyArrayChanges: true,
};

export function notifyPath(
  path: string,
  options: PathNotificationOptions = {}
): void {
  const config = { ...DEFAULT_OPTIONS, ...options };

  notifyPathListeners(path);

  if (config.notifyArrayChanges) {
    notifyArrayItemChanges(path);
  }

  if (config.notifyParents) {
    notifyParentPaths(path);
  }

  if (config.notifyChildren) {
    notifyChildPaths(path);
  }

  notifyGlobalListeners();
}

function notifyArrayItemChanges(path: string): void {
  const arrayItemPattern = /^(.+)\.(\d+)(?:\.(.+))?$/;
  const match = path.match(arrayItemPattern);

  if (match) {
    const [, arrayPath] = match;
    notifyPathListeners(arrayPath);
  }
}

function notifyParentPaths(path: string): void {
  let parentPath = path;

  while (parentPath.includes(".")) {
    parentPath = parentPath.substring(0, parentPath.lastIndexOf("."));
    notifyPathListeners(parentPath);
  }
}

function notifyChildPaths(path: string): void {
  const pathListeners = getPathListeners();
  const childPrefix = path + ".";

  for (const [listenerPath, listenerSet] of pathListeners.entries()) {
    if (listenerPath.startsWith(childPrefix)) {
      listenerSet.forEach((callback) => callback());
    }
  }
}
