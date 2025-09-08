import { useStore } from "mesa-react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Lightbulb } from "lucide-react";
import { playgroundStore } from '../stores';

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const retryCount = useStore(playgroundStore, s => s.retryCount);

  return (
    <div className="p-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Profile Load Failed
            </h3>
            <div className="rounded bg-red-100 border border-red-200 p-3 mb-4">
              <code className="text-sm text-red-700 font-mono break-all">{error}</code>
            </div>
            
            {retryCount > 0 && (
              <div className="mb-4">
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                  Attempt #{retryCount + 1}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={onRetry}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              
              <div className="text-xs text-red-600">
                💡 Try adjusting error rate in controls
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error troubleshooting tips */}
      <div className="mt-6 rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Troubleshooting Tips</h4>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>• This is a simulated network error for demonstration purposes</li>
          <li>• Errors occur randomly based on the configured error rate</li>
          <li>• In real applications, implement proper error boundaries and user feedback</li>
          <li>• Consider implementing exponential backoff for retries</li>
        </ul>
      </div>
    </div>
  );
}