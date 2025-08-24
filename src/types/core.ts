export interface Tracker {
  paths: Set<string>;
}

export type Callback = () => void;

export type Unsubscriber = () => void;

export interface PathNotificationOptions {
  notifyParents?: boolean;
  notifyChildren?: boolean;
  notifyArrayChanges?: boolean;
}

export interface ProxyConfig {
  enableArrayTracking?: boolean;
  enableNotifications?: boolean;
}
