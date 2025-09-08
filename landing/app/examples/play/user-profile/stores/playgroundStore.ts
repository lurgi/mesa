import { proxy } from "mesa-react";

// Create reactive playground state
export const playgroundState = proxy({
  selectedUserId: 1,
  networkDelay: 1000,
  errorRate: 0,
});

// Simple render counter
export const renderCounts = {
  UserProfilePage: 0,
  PlaygroundHeader: 0,
  UserProfile: 0,
  PlaygroundControls: 0,
};

// Helper function to log renders
export const logRender = (componentName: string, reason: string = "state change") => {
  console.log(`🔄 ${componentName} rendered - ${reason}`);
  renderCounts[componentName as keyof typeof renderCounts]++;
};