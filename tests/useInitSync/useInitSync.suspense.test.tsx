import { render, screen, act, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { proxy, useStore, useInitSync } from "../../src/main";
import { ErrorBoundary } from "react-error-boundary";
import { vi } from "vitest";

describe("useInitSync Suspense Integration", () => {
  describe("Basic Suspense behavior", () => {
    test("should trigger Suspense fallback during loading", async () => {
      const store = proxy({ data: null });

      const asyncFn = () =>
        new Promise((resolve) => {
          setTimeout(() => resolve("async data"), 100);
        });

      function AsyncComponent() {
        const { data } = useInitSync(store, asyncFn);
        return <div data-testid="async-data">{String(data)}</div>;
      }

      function App() {
        return (
          <Suspense fallback={<div data-testid="loading-fallback">Loading...</div>}>
            <AsyncComponent />
          </Suspense>
        );
      }

      render(<App />);

      // Should show Suspense fallback initially
      expect(screen.getByTestId("loading-fallback")).toHaveTextContent("Loading...");

      // Wait for data to load and component to render
      await waitFor(() => {
        expect(screen.getByTestId("async-data")).toHaveTextContent("async data");
      });

      // Fallback should be gone
      expect(screen.queryByTestId("loading-fallback")).toBeNull();
    });

    test("should disable Suspense when suspense option is false", async () => {
      const store = proxy({ data: null });

      const asyncFn = () =>
        new Promise((resolve) => {
          setTimeout(() => resolve("async data"), 50);
        });

      function AsyncComponent() {
        const { data, loading } = useInitSync(store, asyncFn, { suspense: false });

        if (loading) {
          return <div data-testid="manual-loading">Manual loading...</div>;
        }

        return <div data-testid="async-data">{String(data)}</div>;
      }

      function App() {
        return (
          <Suspense fallback={<div data-testid="suspense-fallback">Suspense fallback</div>}>
            <AsyncComponent />
          </Suspense>
        );
      }

      render(<App />);

      // Should show manual loading, not Suspense fallback
      expect(screen.getByTestId("manual-loading")).toHaveTextContent("Manual loading...");
      expect(screen.queryByTestId("suspense-fallback")).toBeNull();

      // Wait for data
      await waitFor(() => {
        expect(screen.getByTestId("async-data")).toHaveTextContent("async data");
      });
    });
  });

  describe("Multiple async operations", () => {
    test("should handle multiple async operations in sequence", async () => {
      const store1 = proxy({ user: null });
      const store2 = proxy({ posts: null });

      const userAsyncFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { id: 1, name: "John" };
      };

      const postsAsyncFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return [{ id: 1, title: "Post 1" }];
      };

      function UserComponent() {
        const { data: user } = useInitSync(store1, userAsyncFn);
        return <div data-testid="user-data">{(user as any)?.name}</div>;
      }

      function PostsComponent() {
        const { data: posts } = useInitSync(store2, postsAsyncFn);
        return <div data-testid="posts-data">Posts: {(posts as any)?.length || 0}</div>;
      }

      function App() {
        return (
          <div>
            <Suspense fallback={<div data-testid="user-loading">Loading user...</div>}>
              <UserComponent />
            </Suspense>
            <Suspense fallback={<div data-testid="posts-loading">Loading posts...</div>}>
              <PostsComponent />
            </Suspense>
          </div>
        );
      }

      render(<App />);

      // Both should show loading initially
      expect(screen.getByTestId("user-loading")).toBeInTheDocument();
      expect(screen.getByTestId("posts-loading")).toBeInTheDocument();

      // User should load first (50ms)
      await waitFor(() => {
        expect(screen.getByTestId("user-data")).toHaveTextContent("John");
      });

      // Posts should still be loading
      expect(screen.getByTestId("posts-loading")).toBeInTheDocument();

      // Posts should load next (100ms)
      await waitFor(() => {
        expect(screen.getByTestId("posts-data")).toHaveTextContent("Posts: 1");
      });
    });
  });

  describe("Component lifecycle with Suspense", () => {
    test("should handle component unmount during async operation", async () => {
      const store = proxy({ data: null });
      let resolveFn: (value: string) => void;

      const asyncFn = vi.fn().mockImplementation(() => {
        return new Promise<string>((resolve) => {
          resolveFn = resolve;
        });
      });

      function TestComponent() {
        const { data } = useInitSync(store, asyncFn);
        return <div data-testid="data">{String(data) || "loading"}</div>;
      }

      function App({ showComponent }: { showComponent: boolean }) {
        return (
          <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
            {showComponent && <TestComponent />}
          </Suspense>
        );
      }

      const { rerender } = render(<App showComponent={true} />);

      expect(screen.getByTestId("suspense-fallback")).toHaveTextContent("Loading...");

      // Unmount component
      rerender(<App showComponent={false} />);

      // Resolve the promise after unmount
      act(() => {
        resolveFn!("resolved after unmount");
      });

      // Should not cause any errors or updates
      expect(screen.queryByTestId("data")).toBeNull();
      expect(screen.queryByTestId("suspense-fallback")).toBeNull();
    });
  });

  describe("Error handling with Suspense", () => {
    test("should throw to ErrorBoundary when errorBoundary option is true", async () => {
      const store = proxy({ data: null });
      const error = new Error("Async error");

      const asyncFn = vi.fn().mockRejectedValue(error);

      function TestComponent() {
        useInitSync(store, asyncFn, { errorBoundary: true });
        return <div data-testid="success">Success</div>;
      }

      function App() {
        return (
          <ErrorBoundary
            fallbackRender={({ error }: any) => <div data-testid="error-boundary">Error: {error.message}</div>}
          >
            <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
              <TestComponent />
            </Suspense>
          </ErrorBoundary>
        );
      }

      render(<App />);

      // Should show loading first
      expect(screen.getByTestId("suspense-fallback")).toHaveTextContent("Loading...");

      // Then error boundary should catch the error
      await waitFor(() => {
        expect(screen.getByTestId("error-boundary")).toHaveTextContent("Error: Async error");
      });

      expect(screen.queryByTestId("success")).toBeNull();
    });

    test("should not suspend when handling errors inline", async () => {
      const store = proxy({ data: null });
      const error = new Error("Inline error");

      const asyncFn = vi.fn().mockRejectedValue(error);

      function TestComponent() {
        const { error: asyncError, loading } = useInitSync(store, asyncFn, {
          errorBoundary: false,
          suspense: false,
        });

        if (loading) return <div data-testid="loading">Loading...</div>;
        if (asyncError) return <div data-testid="inline-error">Error: {asyncError.message}</div>;

        return <div data-testid="success">Success</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallback={<div data-testid="error-boundary">Should not appear</div>}>
            <Suspense fallback={<div data-testid="suspense-fallback">Should not appear</div>}>
              <TestComponent />
            </Suspense>
          </ErrorBoundary>
        );
      }

      render(<App />);

      // Should show loading first
      expect(screen.getByTestId("loading")).toHaveTextContent("Loading...");

      // Then show inline error
      await waitFor(() => {
        expect(screen.getByTestId("inline-error")).toHaveTextContent("Error: Inline error");
      });

      expect(screen.queryByTestId("error-boundary")).toBeNull();
      expect(screen.queryByTestId("suspense-fallback")).toBeNull();
    });
  });

  describe("Integration with useStore", () => {
    test("should make useStore components suspend when accessing loading data", async () => {
      type StoreType = {
        user: { id: number; name: string } | null;
        isReady: boolean;
      };

      const store = proxy<StoreType>({ user: null, isReady: true });

      const userAsyncFn = async (state: StoreType) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const userData = { id: 1, name: "John Doe" };
        // Use type assertion for test
        (state as any).user = userData;
        return userData;
      };

      function UserLoader() {
        useInitSync(store, userAsyncFn);
        return null;
      }

      function UserDisplay() {
        // This should suspend because user is being loaded
        const user = useStore(store, (s) => s.user);
        return <div data-testid="user-name">{user?.name || "no user"}</div>;
      }

      function ReadyStatus() {
        // This should NOT suspend because isReady is not being loaded
        const isReady = useStore(store, (s) => s.isReady);
        return <div data-testid="ready-status">{isReady ? "ready" : "not ready"}</div>;
      }

      function App() {
        return (
          <div>
            <UserLoader />
            <ReadyStatus />
            <Suspense fallback={<div data-testid="user-loading">Loading user...</div>}>
              <UserDisplay />
            </Suspense>
          </div>
        );
      }

      render(<App />);

      // ReadyStatus should render immediately (not affected by user loading)
      expect(screen.getByTestId("ready-status")).toHaveTextContent("ready");

      // UserDisplay should be suspended
      expect(screen.getByTestId("user-loading")).toHaveTextContent("Loading user...");

      // Wait for user to load
      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("John Doe");
      });

      // Loading fallback should be gone
      expect(screen.queryByTestId("user-loading")).toBeNull();
    });
  });
});
