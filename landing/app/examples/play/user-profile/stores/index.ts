import { proxy } from "mesa-react";
import { UserStore, PlaygroundStore } from '../types/user';

export const userStore = proxy<UserStore>({
  user: null,
  lastFetchTime: null,
});

export const playgroundStore = proxy<PlaygroundStore>({
  selectedUserId: 1,
  networkDelay: 1500,
  errorRate: 0.2,
  retryCount: 0,
});

// Reset user store to initial state
export const resetUserStore = () => {
  userStore.user = null;
  userStore.lastFetchTime = null;
};

// Update playground settings
export const updatePlaygroundSettings = (settings: Partial<PlaygroundStore>) => {
  Object.assign(playgroundStore, settings);
};

// Increment retry count
export const incrementRetryCount = () => {
  playgroundStore.retryCount++;
};