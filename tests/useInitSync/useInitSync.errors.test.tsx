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

  describe("One store, one useInitSync validation", () => {
    test("should throw error when multiple useInitSync are used on the same store", () => {
      const store = proxy({ data: null });

      const asyncFn1 = jest.fn().mockResolvedValue("data1");
      const asyncFn2 = jest.fn().mockResolvedValue("data2");

      function TestComponent() {
        useInitSync(store, asyncFn1);
        
        // This should throw an error - second useInitSync on same store
        expect(() => {
          useInitSync(store, asyncFn2);
        }).toThrow("Multiple useInitSync calls detected on the same store. Only one useInitSync per store is allowed.");

        return <div data-testid="success">Should not render</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallback={({ error }) => <div data-testid="error-boundary">{error.message}</div>}>
            <TestComponent />
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.getByTestId("error-boundary")).toHaveTextContent(
        "Multiple useInitSync calls detected on the same store. Only one useInitSync per store is allowed."
      );
    });

    test("should throw error when useInitSync is called multiple times in different components for same store", () => {
      const store = proxy({ data: null });

      const asyncFn1 = jest.fn().mockResolvedValue("data1");
      const asyncFn2 = jest.fn().mockResolvedValue("data2");

      function Component1() {
        useInitSync(store, asyncFn1);
        return <div data-testid="component1">Component 1</div>;
      }

      function Component2() {
        // This should throw an error
        useInitSync(store, asyncFn2);
        return <div data-testid="component2">Component 2</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallback={({ error }) => <div data-testid="error-boundary">{error.message}</div>}>
            <Component1 />
            <Component2 />
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.getByTestId("error-boundary")).toHaveTextContent(
        "Multiple useInitSync calls detected on the same store. Only one useInitSync per store is allowed."
      );
      expect(screen.queryByTestId("component1")).toBeNull();
      expect(screen.queryByTestId("component2")).toBeNull();
    });

    test("should allow multiple useInitSync calls on different stores", () => {
      const store1 = proxy({ data1: null });
      const store2 = proxy({ data2: null });

      function Component1() {
        useInitSync(store1, { data1: "initialized1" });
        const data = useStore(store1, (s) => s.data1);
        return <div data-testid="component1">{data}</div>;
      }

      function Component2() {
        useInitSync(store2, { data2: "initialized2" });
        const data = useStore(store2, (s) => s.data2);
        return <div data-testid="component2">{data}</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallback={({ error }) => <div data-testid="error-boundary">{error.message}</div>}>
            <Component1 />
            <Component2 />
          </ErrorBoundary>
        );
      }

      render(<App />);

      // Should render successfully - different stores are allowed
      expect(screen.getByTestId("component1")).toHaveTextContent("initialized1");
      expect(screen.getByTestId("component2")).toHaveTextContent("initialized2");
      expect(screen.queryByTestId("error-boundary")).toBeNull();
    });

    test("should detect conflicts even when called asynchronously", async () => {
      const store = proxy({ data: null });

      const asyncFn1 = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return "data1";
      });

      const asyncFn2 = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return "data2";
      });

      function Component1() {
        useInitSync(store, asyncFn1, { errorBoundary: false });
        return <div data-testid="component1">Component 1</div>;
      }

      function Component2() {
        const { error } = useInitSync(store, asyncFn2, { errorBoundary: false });
        
        if (error) {
          return <div data-testid="component2-error">{error.message}</div>;
        }
        
        return <div data-testid="component2">Component 2</div>;
      }

      function App() {
        return (
          <div>
            <Component1 />
            <Component2 />
          </div>
        );
      }

      render(<App />);

      // Component2 should show error due to duplicate useInitSync
      await waitFor(() => {
        expect(screen.getByTestId("component2-error")).toHaveTextContent(
          "Multiple useInitSync calls detected on the same store. Only one useInitSync per store is allowed."
        );
      });

      expect(screen.getByTestId("component1")).toBeInTheDocument();
    });

    test("should handle cleanup properly when component with useInitSync unmounts", async () => {
      const store = proxy({ data: null });
      const asyncFn = jest.fn().mockResolvedValue("data");

      function AsyncComponent() {
        useInitSync(store, asyncFn);
        return <div data-testid="async-component">Async Component</div>;
      }

      function App({ showAsync }: { showAsync: boolean }) {
        return (
          <div>
            {showAsync && <AsyncComponent />}
            <button onClick={() => {}} data-testid="test-button">Test</button>
          </div>
        );
      }

      const { rerender } = render(<App showAsync={true} />);

      expect(screen.getByTestId("async-component")).toBeInTheDocument();

      // Unmount the component with useInitSync
      rerender(<App showAsync={false} />);

      expect(screen.queryByTestId("async-component")).toBeNull();

      // After unmounting, a new component should be able to use useInitSync on the same store
      function NewAsyncComponent() {
        useInitSync(store, { data: "new data" });
        const data = useStore(store, (s) => s.data);
        return <div data-testid="new-async-component">{data}</div>;
      }

      function AppWithNew() {
        return (
          <ErrorBoundary fallback={({ error }) => <div data-testid="error-boundary">{error.message}</div>}>
            <NewAsyncComponent />
          </ErrorBoundary>
        );
      }

      render(<AppWithNew />);

      // Should work without error after cleanup
      expect(screen.getByTestId("new-async-component")).toHaveTextContent("new data");
      expect(screen.queryByTestId("error-boundary")).toBeNull();
    });
  });
});
