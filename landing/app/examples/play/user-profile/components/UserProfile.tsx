"use client";

import { useStore } from "mesa-react";
import { userStore } from '../stores';
import { useUserProfile } from '../hooks/useUserProfile';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorDisplay } from './ErrorDisplay';
import { ProfileHeader } from './ProfileHeader';
import { ProfileStats } from './ProfileStats';
import { ProfileBio } from './ProfileBio';
import { ProfileActions } from './ProfileActions';

export function UserProfile() {
  const { loading, error, refetch } = useUserProfile();
  
  // Fine-grained subscription - only re-renders when user data changes
  const user = useStore(userStore, s => s.user);

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  // No user data
  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No user data available</div>
        </div>
      </div>
    );
  }

  // Success state - render user profile
  return (
    <div className="p-6">
      <ProfileHeader user={user} />
      <ProfileStats stats={user.stats} />
      <ProfileBio bio={user.bio} />
      <ProfileActions userId={user.id} />
    </div>
  );
}