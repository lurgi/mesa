import { User } from '../types/user';

export const mockUsers: User[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=100&h=100&fit=crop&crop=face",
    bio: "Senior Software Engineer passionate about React and modern web technologies. Love building scalable applications that make a difference.",
    location: "San Francisco, CA",
    joinDate: "2021-03-15",
    stats: {
      followers: 1284,
      following: 432,
      posts: 156,
    },
    preferences: {
      theme: "dark",
      notifications: true,
      publicProfile: true,
    }
  },
  {
    id: 2,
    name: "Alex Chen",
    email: "alex.chen@example.com", 
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    bio: "Full-stack developer with expertise in TypeScript, Node.js, and React. Currently working on fintech solutions.",
    location: "New York, NY",
    joinDate: "2020-11-22",
    stats: {
      followers: 892,
      following: 267,
      posts: 89,
    },
    preferences: {
      theme: "light",
      notifications: true,
      publicProfile: true,
    }
  },
  {
    id: 3,
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    bio: "UI/UX Designer and Frontend Developer. Passionate about creating beautiful and accessible user experiences.",
    location: "Austin, TX", 
    joinDate: "2022-01-08",
    stats: {
      followers: 2156,
      following: 512,
      posts: 234,
    },
    preferences: {
      theme: "dark",
      notifications: false,
      publicProfile: true,
    }
  },
  {
    id: 4,
    name: "David Kim",
    email: "david.kim@example.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    bio: "DevOps Engineer and Cloud Architect. Specializing in Kubernetes, AWS, and infrastructure automation.",
    location: "Seattle, WA",
    joinDate: "2019-07-12",
    stats: {
      followers: 756,
      following: 189,
      posts: 67,
    },
    preferences: {
      theme: "light", 
      notifications: true,
      publicProfile: false,
    }
  }
];

export interface FetchOptions {
  delay: number;
  errorRate: number;
}

export const fetchUserProfile = async (
  userId: number, 
  options: FetchOptions
): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, options.delay));
  
  // Simulate network errors
  if (Math.random() < options.errorRate) {
    throw new Error("Network error: Failed to load user profile. Please check your connection and try again.");
  }
  
  const user = mockUsers.find(u => u.id === userId);
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }
  
  return user;
};