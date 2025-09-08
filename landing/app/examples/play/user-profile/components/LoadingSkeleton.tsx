import { RefreshCw } from "lucide-react";

export function LoadingSkeleton() {
  return (
    <div className="p-6">
      {/* Loading indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Loading user profile...</span>
        </div>
      </div>

      <div className="animate-pulse">
        {/* Profile header skeleton */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-20 w-20 rounded-full bg-muted"></div>
          <div className="space-y-3">
            <div className="h-5 w-36 rounded bg-muted"></div>
            <div className="h-4 w-48 rounded bg-muted"></div>
            <div className="h-3 w-40 rounded bg-muted"></div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="mx-auto mb-2 h-6 w-12 rounded bg-muted"></div>
            <div className="mx-auto h-3 w-16 rounded bg-muted"></div>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="mx-auto mb-2 h-6 w-12 rounded bg-muted"></div>
            <div className="mx-auto h-3 w-16 rounded bg-muted"></div>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="mx-auto mb-2 h-6 w-12 rounded bg-muted"></div>
            <div className="mx-auto h-3 w-16 rounded bg-muted"></div>
          </div>
        </div>

        {/* Bio skeleton */}
        <div className="mb-6">
          <div className="mb-3 h-5 w-20 rounded bg-muted"></div>
          <div className="rounded-lg border bg-card p-4">
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-muted"></div>
              <div className="h-4 w-4/5 rounded bg-muted"></div>
              <div className="h-4 w-3/5 rounded bg-muted"></div>
            </div>
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="flex gap-3">
          <div className="h-10 flex-1 rounded-md bg-muted"></div>
          <div className="h-10 flex-1 rounded-md bg-muted"></div>
          <div className="h-10 w-10 rounded-md bg-muted"></div>
        </div>
      </div>
    </div>
  );
}