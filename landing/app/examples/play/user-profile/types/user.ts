export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  joinDate: string;
  stats: {
    followers: number;
    following: number;
    posts: number;
  };
  preferences: {
    theme: string;
    notifications: boolean;
    publicProfile: boolean;
  };
}

export interface UserStore {
  user: User | null;
  lastFetchTime: number | null;
}

export interface PlaygroundStore {
  selectedUserId: number;
  networkDelay: number;
  errorRate: number;
  retryCount: number;
}