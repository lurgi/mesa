"use client";

export default function UserProfilePlayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              User Profile Playground
            </h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Experience Mesa's <code className="bg-gray-100 px-2 py-1 rounded text-sm">useInitSync</code> with 
              async data fetching, loading states, and error handling patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Playground Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Playground Controls
              </h2>
              <div className="text-sm text-gray-500">
                Controls coming in Phase 4...
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">
                  User profile will be implemented in Phase 2...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              This playground demonstrates Mesa's fine-grained reactivity and async state management.
            </p>
            <p className="mt-1">
              Check the browser console for initialization logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
