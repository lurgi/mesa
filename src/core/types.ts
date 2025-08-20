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

export type PlainObject = Record<string, any>;

export interface WithSyncResult<T extends PlainObject> {
  state: T;
  useSync: (data: DeepPartial<T> | undefined | null) => { isLoading: boolean };
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
