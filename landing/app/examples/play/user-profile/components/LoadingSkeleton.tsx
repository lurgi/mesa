export function LoadingSkeleton() {
  return (
    <div className="p-6">
      {/* Loading indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-2 text-blue-600">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium">Loading user profile...</span>
        </div>
      </div>

      <div className="animate-pulse">
        {/* Profile header skeleton */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
          <div className="space-y-3">
            <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-36"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-40"></div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="h-6 bg-gradient-to-r from-blue-200 to-blue-300 rounded w-12 mx-auto mb-2"></div>
            <div className="h-3 bg-gradient-to-r from-blue-200 to-blue-300 rounded w-16 mx-auto"></div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="h-6 bg-gradient-to-r from-green-200 to-green-300 rounded w-12 mx-auto mb-2"></div>
            <div className="h-3 bg-gradient-to-r from-green-200 to-green-300 rounded w-16 mx-auto"></div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="h-6 bg-gradient-to-r from-purple-200 to-purple-300 rounded w-12 mx-auto mb-2"></div>
            <div className="h-3 bg-gradient-to-r from-purple-200 to-purple-300 rounded w-16 mx-auto"></div>
          </div>
        </div>

        {/* Bio skeleton */}
        <div className="mb-6">
          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20 mb-3"></div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-3">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-4/5"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/5"></div>
            </div>
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="flex space-x-3">
          <div className="flex-1 h-12 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg"></div>
          <div className="flex-1 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
          <div className="h-12 w-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}