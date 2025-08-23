import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { proxy, useStore, useInitSync } from "../../src/main";
import { ErrorBoundary } from "react-error-boundary";


describe("useInitSync Error Handling", () => {
  describe("Basic error scenarios", () => {
    test("should handle synchronous errors in async function", async () => {
      const store = proxy({ data: null });
      const error = new Error("Synchronous error in async function");

      const asyncFn = jest.fn().mockImplementation(() => {
        throw error; // Synchronous error
      });

      function TestComponent() {
        const {
          data,
          loading,
          error: asyncError,
        } = useInitSync(store, asyncFn, {
          errorBoundary: false,
        });

        return (
          <div>
            <div data-testid="loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="error">{asyncError?.message || "no error"}</div>
            <div data-testid="data">{data || "no data"}</div>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
        expect(screen.getByTestId("error")).toHaveTextContent("Synchronous error in async function");
        expect(screen.getByTestId("data")).toHaveTextContent("no data");
      });
    });

    test("should handle Promise rejection", async () => {
      const store = proxy({ data: null });
      const error = new Error("Promise rejection error");

      const asyncFn = jest.fn().mockRejectedValue(error);

      function TestComponent() {
        const {
          data,
          loading,
          error: asyncError,
        } = useInitSync(store, asyncFn, {
          errorBoundary: false,
        });

        return (
          <div>
            <div data-testid="loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="error">{asyncError?.message || "no error"}</div>
            <div data-testid="data">{data || "no data"}</div>
          </div>
        );
      }

      render(<TestComponent />);

      expect(screen.getByTestId("loading")).toHaveTextContent("loading");

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
        expect(screen.getByTestId("error")).toHaveTextContent("Promise rejection error");
        expect(screen.getByTestId("data")).toHaveTextContent("no data");
      });
    });

    test("should handle network-like errors", async () => {
      const store = proxy({ data: null });

      class NetworkError extends Error {
        constructor(message: string, public status: number) {
          super(message);
          this.name = "NetworkError";
        }
      }

      const networkError = new NetworkError("Failed to fetch", 404);
      const asyncFn = jest.fn().mockRejectedValue(networkError);

      function TestComponent() {
        const { data, loading, error } = useInitSync(store, asyncFn, {
          errorBoundary: false,
        });

        return (
          <div>
            <div data-testid="loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="error-name">{error?.name || "no error"}</div>
            <div data-testid="error-message">{error?.message || "no message"}</div>
            <div data-testid="error-status">{(error as any)?.status || "no status"}</div>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("error-name")).toHaveTextContent("NetworkError");
        expect(screen.getByTestId("error-message")).toHaveTextContent("Failed to fetch");
        expect(screen.getByTestId("error-status")).toHaveTextContent("404");
      });
    });
  });

  describe("ErrorBoundary integration", () => {
    test("should throw error to ErrorBoundary when errorBoundary option is true", async () => {
      const store = proxy({ data: null });
      const error = new Error("Error for boundary");

      const asyncFn = jest.fn().mockRejectedValue(error);

      function TestComponent() {
        useInitSync(store, asyncFn, { errorBoundary: true });
        return <div data-testid="success">Success render</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallback={({ error }) => <div data-testid="error-boundary">Caught: {error.message}</div>}>
            <Suspense fallback={<div data-testid="loading">Loading...</div>}>
              <TestComponent />
            </Suspense>
          </ErrorBoundary>
        );
      }

      render(<App />);

      // Initially should show loading
      expect(screen.getByTestId("loading")).toHaveTextContent("Loading...");

      // After error, should show ErrorBoundary
      await waitFor(() => {
        expect(screen.getByTestId("error-boundary")).toHaveTextContent("Caught: Error for boundary");
      });

      expect(screen.queryByTestId("success")).toBeNull();
      expect(screen.queryByTestId("loading")).toBeNull();
    });

    test("should not throw to ErrorBoundary when errorBoundary option is false", async () => {
      const store = proxy({ data: null });
      const error = new Error("Error not for boundary");

      const asyncFn = jest.fn().mockRejectedValue(error);

      function TestComponent() {
        const { error: asyncError } = useInitSync(store, asyncFn, { errorBoundary: false });

        if (asyncError) {
          return <div data-testid="inline-error">Inline error: {asyncError.message}</div>;
        }

        return <div data-testid="success">Success</div>;
      }

      function App() {
        return (
          <ErrorBoundary
            fallback={({ error }) => <div data-testid="error-boundary">Should not appear: {error.message}</div>}
          >
            <Suspense fallback={<div data-testid="loading">Loading...</div>}>
              <TestComponent />
            </Suspense>
          </ErrorBoundary>
        );
      }

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("inline-error")).toHaveTextContent("Inline error: Error not for boundary");
      });

      expect(screen.queryByTestId("error-boundary")).toBeNull();
    });

    test("should handle mixed error handling strategies", async () => {
      const store = proxy({ data1: null, data2: null });

      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");

      const asyncFn1 = jest.fn().mockRejectedValue(error1);
      const asyncFn2 = jest.fn().mockRejectedValue(error2);

      function Component1() {
        useInitSync(store, asyncFn1, { errorBoundary: true });
        return <div data-testid="component1">Component 1 success</div>;
      }

      function Component2() {
        const { error } = useInitSync(store, asyncFn2, { errorBoundary: false });

        if (error) {
          return <div data-testid="component2-error">Component 2 error: {error.message}</div>;
        }

        return <div data-testid="component2">Component 2 success</div>;
      }

      function App() {
        return (
          <div>
            <ErrorBoundary
              fallback={({ error }) => <div data-testid="error-boundary-1">Boundary 1: {error.message}</div>}
            >
              <Suspense fallback={<div data-testid="loading1">Loading 1...</div>}>
                <Component1 />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary
              fallback={({ error }) => <div data-testid="error-boundary-2">Boundary 2: {error.message}</div>}
            >
              <Suspense fallback={<div data-testid="loading2">Loading 2...</div>}>
                <Component2 />
              </Suspense>
            </ErrorBoundary>
          </div>
        );
      }

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("error-boundary-1")).toHaveTextContent("Boundary 1: Error 1");
        expect(screen.getByTestId("component2-error")).toHaveTextContent("Component 2 error: Error 2");
      });

      expect(screen.queryByTestId("error-boundary-2")).toBeNull();
    });
  });

  describe("Error callbacks and recovery", () => {
    test("should call onError callback", async () => {
      const store = proxy({ data: null });
      const error = new Error("Callback error");
      const onError = jest.fn();
      const onSuccess = jest.fn();

      const asyncFn = jest.fn().mockRejectedValue(error);

      function TestComponent() {
        const { error: asyncError } = useInitSync(store, asyncFn, {
          onError,
          onSuccess,
          errorBoundary: false,
        });

        return (
          <div>
            <div data-testid="error">{asyncError?.message || "no error"}</div>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Callback error");
      });

      expect(onError).toHaveBeenCalledWith(error);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    test("should allow error recovery with refetch", async () => {
      const store = proxy({ data: null });
      const error = new Error("Temporary error");
      let callCount = 0;

      const asyncFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(error);
        }
        return Promise.resolve("success data");
      });

      function TestComponent() {
        const {
          data,
          error: asyncError,
          refetch,
        } = useInitSync(store, asyncFn, {
          errorBoundary: false,
        });

        return (
          <div>
            <div data-testid="data">{data || "no data"}</div>
            <div data-testid="error">{asyncError?.message || "no error"}</div>
            <button onClick={() => refetch()} data-testid="retry">
              Retry
            </button>
          </div>
        );
      }

      render(<TestComponent />);

      // First call should fail
      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Temporary error");
        expect(screen.getByTestId("data")).toHaveTextContent("no data");
      });

      // Retry should succeed
      act(() => {
        fireEvent.click(screen.getByTestId("retry"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("data")).toHaveTextContent("success data");
        expect(screen.getByTestId("error")).toHaveTextContent("no error");
      });

      expect(asyncFn).toHaveBeenCalledTimes(2);
    });

    test("should handle errors during refetch", async () => {
      const store = proxy({ data: null });
      const initialError = new Error("Initial error");
      const refetchError = new Error("Refetch error");
      let callCount = 0;

      const asyncFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(initialError);
        }
        return Promise.reject(refetchError);
      });

      function TestComponent() {
        const {
          data,
          error: asyncError,
          refetch,
        } = useInitSync(store, asyncFn, {
          errorBoundary: false,
        });

        return (
          <div>
            <div data-testid="data">{data || "no data"}</div>
            <div data-testid="error">{asyncError?.message || "no error"}</div>
            <button onClick={() => refetch()} data-testid="retry">
              Retry
            </button>
          </div>
        );
      }

      render(<TestComponent />);

      // Initial error
      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Initial error");
      });

      // Retry - should show new error
      act(() => {
        fireEvent.click(screen.getByTestId("retry"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Refetch error");
      });
    });
  });

  describe("Error propagation with useStore", () => {
    test("should not affect useStore components when async operation fails", async () => {
      const store = proxy({
        existingData: "stable data",
        asyncData: null,
      });

      const error = new Error("Async operation failed");
      const asyncFn = jest.fn().mockRejectedValue(error);

      function AsyncLoader() {
        useInitSync(store, asyncFn, { errorBoundary: false });
        return null;
      }

      function StableComponent() {
        const existingData = useStore(store, (s) => s.existingData);
        return <div data-testid="stable-data">{existingData}</div>;
      }

      function AsyncComponent() {
        const asyncData = useStore(store, (s) => s.asyncData);
        return <div data-testid="async-data">{asyncData || "no async data"}</div>;
      }

      function App() {
        return (
          <div>
            <AsyncLoader />
            <StableComponent />
            <AsyncComponent />
          </div>
        );
      }

      render(<App />);

      // Stable component should render immediately
      expect(screen.getByTestId("stable-data")).toHaveTextContent("stable data");
      expect(screen.getByTestId("async-data")).toHaveTextContent("no async data");

      // Wait to ensure async operation completes and doesn't affect other components
      await waitFor(() => {
        expect(asyncFn).toHaveBeenCalled();
      });

      // Components should still render correctly
      expect(screen.getByTestId("stable-data")).toHaveTextContent("stable data");
      expect(screen.getByTestId("async-data")).toHaveTextContent("no async data");
    });

    test("should handle partial state updates before error", async () => {
      const store = proxy({
        step1: null,
        step2: null,
        step3: null,
      });

      const asyncFn = async (state: typeof store) => {
        // Step 1 succeeds
        state.step1 = "completed";
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Step 2 succeeds
        state.step2 = "completed";
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Step 3 fails
        throw new Error("Step 3 failed");
      };

      function AsyncLoader() {
        useInitSync(store, asyncFn, { errorBoundary: false });
        return null;
      }

      function StepsDisplay() {
        const step1 = useStore(store, (s) => s.step1);
        const step2 = useStore(store, (s) => s.step2);
        const step3 = useStore(store, (s) => s.step3);

        return (
          <div>
            <div data-testid="step1">{step1 || "pending"}</div>
            <div data-testid="step2">{step2 || "pending"}</div>
            <div data-testid="step3">{step3 || "pending"}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <AsyncLoader />
            <StepsDisplay />
          </div>
        );
      }

      render(<App />);

      // Initially all pending
      expect(screen.getByTestId("step1")).toHaveTextContent("pending");
      expect(screen.getByTestId("step2")).toHaveTextContent("pending");
      expect(screen.getByTestId("step3")).toHaveTextContent("pending");

      // Wait for partial completion (steps 1 and 2 should complete despite step 3 failing)
      await waitFor(() => {
        expect(screen.getByTestId("step1")).toHaveTextContent("completed");
        expect(screen.getByTestId("step2")).toHaveTextContent("completed");
      });

      // Step 3 should still be pending (error occurred)
      expect(screen.getByTestId("step3")).toHaveTextContent("pending");
    });
  });

  describe("Concurrent error scenarios", () => {
    test("should handle multiple concurrent async operations with different error outcomes", async () => {
      const store = proxy({
        operation1: null,
        operation2: null,
        operation3: null,
      });

      const successFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        state.operation1 = "success";
        return "success";
      };

      const errorFn1 = jest.fn().mockRejectedValue(new Error("Error 1"));
      const errorFn2 = jest.fn().mockRejectedValue(new Error("Error 2"));

      function AsyncLoaders() {
        const result1 = useInitSync(store, successFn, { errorBoundary: false });
        const result2 = useInitSync(store, errorFn1, { errorBoundary: false });
        const result3 = useInitSync(store, errorFn2, { errorBoundary: false });

        return (
          <div>
            <div data-testid="result1-error">{result1.error?.message || "no error"}</div>
            <div data-testid="result2-error">{result2.error?.message || "no error"}</div>
            <div data-testid="result3-error">{result3.error?.message || "no error"}</div>
          </div>
        );
      }

      function StoreDisplay() {
        const op1 = useStore(store, (s) => s.operation1);
        return <div data-testid="operation1">{op1 || "pending"}</div>;
      }

      function App() {
        return (
          <div>
            <AsyncLoaders />
            <StoreDisplay />
          </div>
        );
      }

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("result1-error")).toHaveTextContent("no error");
        expect(screen.getByTestId("result2-error")).toHaveTextContent("Error 1");
        expect(screen.getByTestId("result3-error")).toHaveTextContent("Error 2");
        expect(screen.getByTestId("operation1")).toHaveTextContent("success");
      });
    });
  });
});
