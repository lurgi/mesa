import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { proxy, useStore, useInitSync } from "../../src/main";
import { ErrorBoundary } from "react-error-boundary";
import { vi } from "vitest";

describe("useInitSync Error Handling", () => {
  describe("Basic error scenarios", () => {
    test("should handle Promise rejection", async () => {
      const store = proxy({ data: null, loading: false });
      const error = new Error("Promise rejection error");

      const asyncFn = vi.fn().mockRejectedValue(error);

      function TestComponent() {
        const { error: asyncError } = useInitSync(store, asyncFn, {
          errorBoundary: false,
        });
        const data = useStore(store, (s) => s.data);
        const loading = useStore(store, (s) => s.loading);

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

    test("should handle function that throws synchronously", async () => {
      const store = proxy({ data: null, loading: false });
      const error = new Error("Synchronous function error");

      const syncFn = vi.fn().mockImplementation(() => {
        throw error;
      });

      function TestComponent() {
        const { error: asyncError } = useInitSync(store, syncFn, {
          errorBoundary: false,
        });
        const data = useStore(store, (s) => s.data);
        const loading = useStore(store, (s) => s.loading);

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
        expect(screen.getByTestId("error")).toHaveTextContent("Synchronous function error");
        expect(screen.getByTestId("data")).toHaveTextContent("no data");
      });
    });
  });

  describe("ErrorBoundary integration", () => {
    test("should not throw to ErrorBoundary by default (errorBoundary defaults to false)", async () => {
      const store = proxy({ data: null, loading: false });
      const error = new Error("Default behavior error");

      const asyncFn = vi.fn().mockRejectedValue(error);

      function TestComponent() {
        const { error: asyncError } = useInitSync(store, asyncFn);
        const loading = useStore(store, (s) => s.loading);

        if (loading) return <div data-testid="loading">Loading...</div>;
        if (asyncError) return <div data-testid="inline-error">Inline error: {asyncError.message}</div>;
        return <div data-testid="success">Success</div>;
      }

      function App() {
        return (
          <ErrorBoundary
            fallbackRender={({ error }: any) => (
              <div data-testid="error-boundary">Should not appear: {error.message}</div>
            )}
          >
            <TestComponent />
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.getByTestId("loading")).toHaveTextContent("Loading...");

      await waitFor(() => {
        expect(screen.getByTestId("inline-error")).toHaveTextContent("Inline error: Default behavior error");
      });

      expect(screen.queryByTestId("error-boundary")).toBeNull();
    });

    test("should throw error to ErrorBoundary when errorBoundary option is true", async () => {
      const store = proxy({ data: null, loading: false });
      const error = new Error("Error for boundary");

      const asyncFn = vi.fn().mockRejectedValue(error);

      function TestComponent() {
        useInitSync(store, asyncFn, { errorBoundary: true, suspense: true });
        useStore(store, (s) => s.data);
        return <div data-testid="success">Success render</div>;
      }

      function App() {
        return (
          <ErrorBoundary
            fallbackRender={({ error }: any) => <div data-testid="error-boundary">Caught: {error.message}</div>}
          >
            <Suspense fallback={<div data-testid="loading">Loading...</div>}>
              <TestComponent />
            </Suspense>
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.getByTestId("loading")).toHaveTextContent("Loading...");

      await waitFor(() => {
        expect(screen.getByTestId("error-boundary")).toHaveTextContent("Caught: Error for boundary");
      });

      expect(screen.queryByTestId("success")).toBeNull();
      expect(screen.queryByTestId("loading")).toBeNull();
    });

    test("should not throw to ErrorBoundary when errorBoundary option is false", async () => {
      const store = proxy({ data: null, loading: false });
      const error = new Error("Error not for boundary");

      const asyncFn = vi.fn().mockRejectedValue(error);

      function TestComponent() {
        const { error: asyncError } = useInitSync(store, asyncFn, {
          errorBoundary: false,
          suspense: false,
        });
        const loading = useStore(store, (s) => s.loading);

        if (loading) return <div data-testid="loading">Loading...</div>;
        if (asyncError) return <div data-testid="inline-error">Inline error: {asyncError.message}</div>;
        return <div data-testid="success">Success</div>;
      }

      function App() {
        return (
          <ErrorBoundary
            fallbackRender={({ error }: any) => (
              <div data-testid="error-boundary">Should not appear: {error.message}</div>
            )}
          >
            <TestComponent />
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.getByTestId("loading")).toHaveTextContent("Loading...");

      await waitFor(() => {
        expect(screen.getByTestId("inline-error")).toHaveTextContent("Inline error: Error not for boundary");
      });

      expect(screen.queryByTestId("error-boundary")).toBeNull();
    });

    test("should throw error even without ErrorBoundary when errorBoundary is true", async () => {
      const store = proxy({ data: null, loading: false });
      const error = new Error("Uncaught error");

      const asyncFn = vi.fn().mockRejectedValue(error);

      function TestComponent() {
        useInitSync(store, asyncFn, { errorBoundary: true, suspense: true });
        return <div data-testid="success">Should not render</div>;
      }

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <TestComponent />
        </Suspense>
      );

      expect(screen.getByTestId("loading")).toHaveTextContent("Loading...");

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Error callbacks", () => {
    test("should call onError callback", async () => {
      const store = proxy({ data: null, loading: false });
      const error = new Error("Callback error");
      const onError = vi.fn();
      const onSuccess = vi.fn();

      const asyncFn = vi.fn().mockRejectedValue(error);

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
      const store = proxy({ data: null, loading: false });
      const error = new Error("Temporary error");
      let callCount = 0;

      const asyncFn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(error);
        }
        return Promise.resolve("success data");
      });

      function TestComponent() {
        const { error: asyncError, refetch } = useInitSync(store, asyncFn, {
          errorBoundary: false,
        });
        const data = useStore(store, (s) => s.data);

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

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Temporary error");
        expect(screen.getByTestId("data")).toHaveTextContent("no data");
      });

      act(() => {
        fireEvent.click(screen.getByTestId("retry"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("data")).toHaveTextContent("success data");
        expect(screen.getByTestId("error")).toHaveTextContent("no error");
      });

      expect(asyncFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("One store, one useInitSync validation", () => {
    test("should throw error when multiple useInitSync are used on the same store", () => {
      const store = proxy({ data: null, loading: false });

      const asyncFn1 = vi.fn().mockResolvedValue("data1");
      const asyncFn2 = vi.fn().mockResolvedValue("data2");

      function TestComponent() {
        useInitSync(store, asyncFn1);

        useInitSync(store, asyncFn2);

        return <div data-testid="success">Should not render</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallbackRender={({ error }: any) => <div data-testid="error-boundary">{error.message}</div>}>
            <TestComponent />
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.getByTestId("error-boundary")).toHaveTextContent(
        "Multiple useInitSync calls detected on the same store"
      );
    });

    test("should throw error when useInitSync is called in different components for same store", () => {
      const store = proxy({ data: null, loading: false });

      const asyncFn1 = vi.fn().mockResolvedValue("data1");
      const asyncFn2 = vi.fn().mockResolvedValue("data2");

      function Component1() {
        useInitSync(store, asyncFn1);
        return <div data-testid="component1">Component 1</div>;
      }

      function Component2() {
        useInitSync(store, asyncFn2);
        return <div data-testid="component2">Component 2</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallbackRender={({ error }: any) => <div data-testid="error-boundary">{error.message}</div>}>
            <Component1 />
            <Component2 />
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.getByTestId("error-boundary")).toHaveTextContent(
        "Multiple useInitSync calls detected on the same store"
      );
      expect(screen.queryByTestId("component1")).toBeNull();
      expect(screen.queryByTestId("component2")).toBeNull();
    });

    test("should allow multiple useInitSync calls on different stores", () => {
      const store1 = proxy<{ data1: string | null }>({ data1: null });
      const store2 = proxy<{ data2: string | null }>({ data2: null });

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
          <ErrorBoundary fallbackRender={({ error }: any) => <div data-testid="error-boundary">{error.message}</div>}>
            <Component1 />
            <Component2 />
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.getByTestId("component1")).toHaveTextContent("initialized1");
      expect(screen.getByTestId("component2")).toHaveTextContent("initialized2");
      expect(screen.queryByTestId("error-boundary")).toBeNull();
    });

    test("should allow custom keys to bypass one-store limitation", () => {
      const store = proxy({ data: null, loading: false });

      const asyncFn1 = vi.fn().mockResolvedValue("data1");
      const asyncFn2 = vi.fn().mockResolvedValue("data2");

      function Component1() {
        useInitSync(store, asyncFn1, { key: "operation-1" });
        const data = useStore(store, (s) => s.data);
        return <div data-testid="component1">{data || "loading1"}</div>;
      }

      function Component2() {
        useInitSync(store, asyncFn2, { key: "operation-2" });
        const data = useStore(store, (s) => s.data);
        return <div data-testid="component2">{data || "loading2"}</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallbackRender={({ error }: any) => <div data-testid="error-boundary">{error.message}</div>}>
            <Component1 />
            <Component2 />
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.queryByTestId("error-boundary")).toBeNull();
      expect(screen.getByTestId("component1")).toBeInTheDocument();
      expect(screen.getByTestId("component2")).toBeInTheDocument();
    });
  });
});
