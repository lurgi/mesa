"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useStore } from "mesa-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, BarChart3, Eye, Lightbulb, RefreshCw, AlertCircle } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";

import { UserProfile } from "./components/UserProfile";
import { playgroundState, renderCounts, logRender } from "./stores/playgroundStore";

// Error fallback component for ErrorBoundary
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  console.error(error);
  return (
    <div className="p-8 rounded-xl border bg-card">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold text-red-600">Error Loading Profile</h2>
        </div>
        <div className="text-sm text-muted-foreground mb-4">{error.message}</div>
        <Button onClick={resetErrorBoundary} size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

// Loading fallback component for Suspense
function LoadingFallback() {
  return (
    <div className="p-8 rounded-xl border bg-card">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <h2 className="text-lg font-semibold text-primary">Loading Profile</h2>
        </div>
        <div className="text-sm text-muted-foreground">Fetching user data with Mesa&apos;s useInitSync...</div>
        <div className="mt-4 space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4 mx-auto" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2 mx-auto" />
        </div>
      </div>
    </div>
  );
}

// Simple header
function PlaygroundHeader() {
  const [totalRenders, setTotalRenders] = useState(0);

  useEffect(() => {
    logRender("PlaygroundHeader", "mounted");
    const interval = setInterval(() => {
      const total = Object.values(renderCounts).reduce((sum, count) => sum + count, 0);
      setTotalRenders(total);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mesa User Profile Playground</h1>
          <p className="text-muted-foreground max-w-2xl">
            Interactive demonstration of useInitSync with async data fetching. Watch how Mesa handles loading states,
            error handling, and fine-grained reactivity automatically.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{totalRenders} total renders</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Playground controls component
function PlaygroundControls() {
  const selectedUserId = useStore(playgroundState, (s) => s.selectedUserId);
  const networkDelay = useStore(playgroundState, (s) => s.networkDelay);
  const errorRate = useStore(playgroundState, (s) => s.errorRate);

  useEffect(() => {
    logRender("PlaygroundControls", "controls state changed");
  });

  const userOptions = [
    { id: 1, name: "Sarah Johnson" },
    { id: 2, name: "Alex Chen" },
    { id: 3, name: "Maria Garcia" },
    { id: 4, name: "David Kim" },
  ];

  return (
    <div className="p-6 rounded-xl bg-card border">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Controls</h3>
        </div>
        <div className="text-xs text-muted-foreground">Modify settings to test different scenarios</div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select User</label>
          <select
            value={selectedUserId}
            onChange={(e) => (playgroundState.selectedUserId = Number(e.target.value))}
            className="w-full p-2 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {userOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Network Delay: {networkDelay}ms</label>
          <input
            type="range"
            min="0"
            max="3000"
            step="100"
            value={networkDelay}
            onChange={(e) => (playgroundState.networkDelay = Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Error Rate: {Math.round(errorRate * 100)}%</label>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.05"
            value={errorRate}
            onChange={(e) => (playgroundState.errorRate = Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

// Simple render tracker display
function RenderInfo() {
  const [counts, setCounts] = useState(renderCounts);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounts({ ...renderCounts });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 rounded-xl bg-card border">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Component Render Counts</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          Each component only re-renders when its specific data changes
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {Object.entries(counts).map(([component, count]) => (
          <div key={component} className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{count}</div>
            <div className="text-xs font-medium text-muted-foreground">
              {component.replace(/([A-Z])/g, " $1").trim()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Educational info panel
function InfoPanel() {
  return (
    <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
          <Lightbulb className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Understanding useInitSync</h3>

          <div className="space-y-4 text-sm text-blue-700 dark:text-blue-300">
            <div>
              <h4 className="font-medium mb-2">🎯 What You&apos;re Seeing:</h4>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Mesa&apos;s useInitSync automatically handles loading and error states</li>
                <li>• No manual state.loading or state.error management needed</li>
                <li>• Fine-grained subscriptions prevent unnecessary re-renders</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">⚡ Try This:</h4>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Switch users → Only affected components re-render</li>
                <li>• Increase error rate → See error handling in action</li>
                <li>• Adjust network delay → Watch loading states</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔍 In Traditional React:</h4>
              <p className="text-xs">
                You&apos;d manually manage loading/error states, write complex useEffect patterns, and deal with race
                conditions. Mesa eliminates this complexity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main app component
function UserProfileApp() {
  useEffect(() => {
    logRender("UserProfilePage", "mounted");
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PlaygroundHeader />

      {/* Main user profile display */}
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
        )}
      >
        <Suspense fallback={<LoadingFallback />}>
          <UserProfile />
        </Suspense>
      </ErrorBoundary>

      {/* Controls and info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlaygroundControls />
        <RenderInfo />
      </div>

      {/* Educational content */}
      <InfoPanel />
    </div>
  );
}

// Main Page Component
export default function UserProfilePlayPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/docs/examples/user-profile"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to User Profile Documentation
          </Link>
        </div>

        <UserProfileApp />
      </div>
    </div>
  );
}
