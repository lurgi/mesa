"use client";

import React, { useEffect } from "react";
import { useInitSync, useStore } from "mesa-react";
import { User } from "lucide-react";
import { userStore } from "../stores";
import { fetchUserProfile } from "../services/mockApi";
import { playgroundState, renderCounts, logRender } from "../stores/playgroundStore";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileStats } from "./ProfileStats";
import { ProfileBio } from "./ProfileBio";
import { ProfileActions } from "./ProfileActions";

export function UserProfile() {
  // Subscribe to playground state changes - fine-grained subscriptions
  const selectedUserId = useStore(playgroundState, (s) => s.selectedUserId);
  const networkDelay = useStore(playgroundState, (s) => s.networkDelay);
  const errorRate = useStore(playgroundState, (s) => s.errorRate);

  useInitSync(
    userStore,
    async (state) => {
      const user = await fetchUserProfile(selectedUserId, {
        delay: networkDelay,
        errorRate: errorRate,
      });

      state.user = user;
      state.lastFetchTime = Date.now();
    },
    {
      deps: [selectedUserId, networkDelay, errorRate],
      onSuccess: () => {
        console.log("✅ User profile loaded successfully");
      },
      onError: (err) => {
        console.error("❌ Failed to load user profile:", err);
      },
    }
  );

  // Fine-grained subscription - only re-renders when user data changes
  const user = useStore(userStore, (s) => s.user);

  useEffect(() => {
    logRender("UserProfile", "component rendered");
  });

  // With Suspense/ErrorBoundary, we only handle success case
  if (!user) {
    return (
      <div className="p-8 rounded-xl border bg-card">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-muted-foreground">No User Data</h2>
          </div>
          <div className="text-sm text-muted-foreground">No user data available</div>
        </div>
      </div>
    );
  }

  // Success state - render user profile
  return (
    <div className="p-8 rounded-xl border bg-card">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">User Profile</h2>
        </div>
        <div className="text-xs text-muted-foreground">
          Loaded with Mesa&apos;s useInitSync • Render count: {renderCounts.UserProfile}
        </div>
      </div>

      <div className="space-y-6">
        <ProfileHeader user={user} />
        <ProfileStats stats={user.stats} />
        <ProfileBio bio={user.bio} />
        <ProfileActions userId={user.id} />
      </div>
    </div>
  );
}
