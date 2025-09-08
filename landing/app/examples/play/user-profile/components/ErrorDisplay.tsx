import { useStore } from "mesa-react";
import { playgroundStore } from '../stores';

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const retryCount = useStore(playgroundStore, s => s.retryCount);

  return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Oops! Something went wrong
            </h3>
            <div className="text-sm text-red-700 mb-4 bg-red-100 rounded-lg p-3 border border-red-200">
              <p className="font-mono">{error}</p>
            </div>
            
            {retryCount > 0 && (
              <div className="mb-4 text-sm text-red-600">
                <span className="inline-flex items-center px-2 py-1 bg-red-100 rounded-full">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 10.793a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  Attempt #{retryCount + 1}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
              
              <div className="text-xs text-red-500">
                💡 Try adjusting the error rate in playground settings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error troubleshooting tips */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Troubleshooting Tips:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• This is a simulated network error for demonstration purposes</li>
          <li>• Errors occur randomly based on the configured error rate</li>
          <li>• In real applications, implement proper error boundaries and user feedback</li>
          <li>• Consider implementing exponential backoff for retries</li>
        </ul>
      </div>
    </div>
  );
}