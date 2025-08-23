import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { proxy, useStore, useInitSync } from "../../src/main";
import { ErrorBoundary } from "react-error-boundary";

describe("useInitSync hook", () => {
  describe("Direct value initialization", () => {
    test("should initialize store with direct object values", () => {
      const store = proxy({ user: null, theme: "light" });

      function TestComponent() {
        useInitSync(store, {
          user: { name: "Direct User", id: 1 },
          theme: "dark",
        });

        const user = useStore(store, (s) => s.user);
        const theme = useStore(store, (s) => s.theme);

        return (
          <div>
            <div data-testid="user-name">{user?.name || "no user"}</div>
            <div data-testid="user-id">{user?.id || "no id"}</div>
            <div data-testid="theme">{theme}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Values should be applied immediately - no flicker
      expect(screen.getByTestId("user-name")).toHaveTextContent("Direct User");
      expect(screen.getByTestId("user-id")).toHaveTextContent("1");
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });

    test("should handle single primitive values", () => {
      const store = proxy({ status: null });

      function TestComponent() {
        useInitSync(store, "ready");

        const status = useStore(store, (s) => s.status);
        return <div data-testid="status">{String(status)}</div>;
      }

      render(<TestComponent />);

      expect(screen.getByTestId("status")).toHaveTextContent("ready");
    });

    test("should handle computed values without flicker", () => {
      const store = proxy({ timestamp: null, config: null });

      function TestComponent() {
        useInitSync(store, {
          timestamp: Date.now(),
          config: {
            apiUrl: "/api/v1",
            features: ["feature1", "feature2"],
          },
        });

        const timestamp = useStore(store, (s) => s.timestamp);
        const config = useStore(store, (s) => s.config);

        return (
          <div>
            <div data-testid="timestamp">{timestamp ? "set" : "not set"}</div>
            <div data-testid="api-url">{config?.apiUrl || "no url"}</div>
            <div data-testid="features">{config?.features.length || 0}</div>
          </div>
        );
      }

      render(<TestComponent />);

      expect(screen.getByTestId("timestamp")).toHaveTextContent("set");
      expect(screen.getByTestId("api-url")).toHaveTextContent("/api/v1");
      expect(screen.getByTestId("features")).toHaveTextContent("2");
    });

    test("should prevent flicker with localStorage values", () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn((key: string) => {
          if (key === "user") return JSON.stringify({ name: "Cached User" });
          if (key === "theme") return "dark";
          return null;
        }),
      };
      Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

      const store = proxy({ user: null, theme: "light" });

      function TestComponent() {
        const savedUser = localStorage.getItem("user");
        const savedTheme = localStorage.getItem("theme");

        useInitSync(store, {
          user: savedUser ? JSON.parse(savedUser) : null,
          theme: savedTheme || "light",
        });

        const user = useStore(store, (s) => s.user);
        const theme = useStore(store, (s) => s.theme);

        return (
          <div>
            <div data-testid="user-name">{user?.name || "no user"}</div>
            <div data-testid="theme">{theme}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Should immediately show cached values
      expect(screen.getByTestId("user-name")).toHaveTextContent("Cached User");
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });
  });

  describe("Synchronous function initialization", () => {
    test("should handle synchronous initialization functions", () => {
      const store = proxy({ user: null, settings: null });

      function TestComponent() {
        useInitSync(store, (state) => {
          // Synchronous initialization
          state.user = { name: "Sync User", id: 42 };
          state.settings = { theme: "auto", lang: "en" };
          return { initialized: true };
        });

        const user = useStore(store, (s) => s.user);
        const settings = useStore(store, (s) => s.settings);

        return (
          <div>
            <div data-testid="user-name">{user?.name || "no user"}</div>
            <div data-testid="theme">{settings?.theme || "no theme"}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Should apply synchronously without flicker
      expect(screen.getByTestId("user-name")).toHaveTextContent("Sync User");
      expect(screen.getByTestId("theme")).toHaveTextContent("auto");
    });

    test("should handle mixed sync/async patterns", async () => {
      const store = proxy({ config: null, data: null, ready: false });

      function TestComponent() {
        useInitSync(store, async (state) => {
          // Sync part: immediate configuration
          state.config = { api: "/api/v1", timeout: 5000 };
          state.ready = true;

          // Async part: fetch data later
          await new Promise((resolve) => setTimeout(resolve, 50));
          state.data = { items: [1, 2, 3] };

          return { complete: true };
        });

        const config = useStore(store, (s) => s.config);
        const data = useStore(store, (s) => s.data);
        const ready = useStore(store, (s) => s.ready);

        return (
          <div>
            <div data-testid="ready">{ready ? "yes" : "no"}</div>
            <div data-testid="config">{config ? "loaded" : "not loaded"}</div>
            <div data-testid="data">{data ? "loaded" : "loading"}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Sync parts should be immediately available
      expect(screen.getByTestId("ready")).toHaveTextContent("yes");
      expect(screen.getByTestId("config")).toHaveTextContent("loaded");
      expect(screen.getByTestId("data")).toHaveTextContent("loading");

      // Async parts should load later
      await waitFor(() => {
        expect(screen.getByTestId("data")).toHaveTextContent("loaded");
      });
    });

    test("should handle void functions with side effects", () => {
      const store = proxy({ initialized: false, timestamp: null });

      function TestComponent() {
        useInitSync(store, (state) => {
          // Void function that only does side effects
          state.initialized = true;
          state.timestamp = Date.now();
          // No return value
        });

        const initialized = useStore(store, (s) => s.initialized);
        const timestamp = useStore(store, (s) => s.timestamp);

        return (
          <div>
            <div data-testid="initialized">{initialized ? "yes" : "no"}</div>
            <div data-testid="timestamp">{timestamp ? "set" : "not set"}</div>
          </div>
        );
      }

      render(<TestComponent />);

      expect(screen.getByTestId("initialized")).toHaveTextContent("yes");
      expect(screen.getByTestId("timestamp")).toHaveTextContent("set");
    });
  });

  describe("Progressive enhancement patterns", () => {
    test("should support immediate → cached → live data flow", async () => {
      const store = proxy({ posts: null, status: "loading" });

      function TestComponent() {
        useInitSync(store, async (state) => {
          // 1. Immediate placeholder
          state.posts = [{ id: "placeholder", title: "Loading..." }];
          state.status = "placeholder";

          // 2. Cached data
          await new Promise((resolve) => setTimeout(resolve, 10));
          state.posts = [{ id: "cached", title: "Cached Post" }];
          state.status = "cached";

          // 3. Live data
          await new Promise((resolve) => setTimeout(resolve, 20));
          state.posts = [{ id: "live", title: "Live Post" }];
          state.status = "live";

          return state.posts;
        });

        const posts = useStore(store, (s) => s.posts);
        const status = useStore(store, (s) => s.status);

        return (
          <div>
            <div data-testid="status">{status}</div>
            <div data-testid="post-title">{posts?.[0]?.title || "none"}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Should start with placeholder immediately
      expect(screen.getByTestId("status")).toHaveTextContent("placeholder");
      expect(screen.getByTestId("post-title")).toHaveTextContent("Loading...");

      // Then show cached data
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("cached");
        expect(screen.getByTestId("post-title")).toHaveTextContent("Cached Post");
      });

      // Finally show live data
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("live");
        expect(screen.getByTestId("post-title")).toHaveTextContent("Live Post");
      });
    });
  });

  describe("Basic functionality", () => {
    test("should execute async function and return data", async () => {
      const store = proxy({ userId: 1, user: null });

      const mockUser = { id: 1, name: "John Doe" };
      const asyncFn = jest.fn().mockResolvedValue(mockUser);

      function TestComponent() {
        const { data, loading, error } = useInitSync(store, asyncFn);

        return (
          <div>
            <div data-testid="loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="error">{error?.message || "no error"}</div>
            <div data-testid="data">{data ? JSON.stringify(data) : "no data"}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Initially should be loading
      expect(screen.getByTestId("loading")).toHaveTextContent("loading");
      expect(screen.getByTestId("error")).toHaveTextContent("no error");
      expect(screen.getByTestId("data")).toHaveTextContent("no data");

      // Wait for async operation to complete
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
        expect(screen.getByTestId("data")).toHaveTextContent(JSON.stringify(mockUser));
      });

      expect(asyncFn).toHaveBeenCalledWith(store);
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    test("should provide refetch function", async () => {
      const store = proxy({ count: 0 });
      let callCount = 0;

      const asyncFn = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve(`result-${callCount}`);
      });

      function TestComponent() {
        const { data, loading, refetch } = useInitSync(store, asyncFn);

        return (
          <div>
            <div data-testid="data">{data || "no data"}</div>
            <div data-testid="loading">{loading ? "loading" : "ready"}</div>
            <button onClick={() => refetch()}>refetch</button>
          </div>
        );
      }

      render(<TestComponent />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId("data")).toHaveTextContent("result-1");
      });

      // Trigger refetch
      act(() => {
        fireEvent.click(screen.getByText("refetch"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("data")).toHaveTextContent("result-2");
      });

      expect(asyncFn).toHaveBeenCalledTimes(2);
    });

    test("should update store state within async function", async () => {
      const store = proxy({ userId: 1, user: null });

      const mockUser = { id: 1, name: "John Doe" };
      const asyncFn = async (state: typeof store) => {
        const userData = await Promise.resolve(mockUser);
        state.user = userData; // Update store
        return userData;
      };

      function AsyncComponent() {
        useInitSync(store, asyncFn);
        return null;
      }

      function StoreConsumer() {
        const user = useStore(store, (s) => s.user);
        return <div data-testid="store-user">{user ? JSON.stringify(user) : "no user"}</div>;
      }

      function App() {
        return (
          <div>
            <AsyncComponent />
            <StoreConsumer />
          </div>
        );
      }

      render(<App />);

      // Initially no user in store
      expect(screen.getByTestId("store-user")).toHaveTextContent("no user");

      // Wait for async operation to update store
      await waitFor(() => {
        expect(screen.getByTestId("store-user")).toHaveTextContent(JSON.stringify(mockUser));
      });
    });
  });

  describe("Suspense integration", () => {
    test("should trigger Suspense fallback during loading", async () => {
      const store = proxy({ data: null });

      const asyncFn = () =>
        new Promise((resolve) => {
          setTimeout(() => resolve("async data"), 100);
        });

      function AsyncComponent() {
        const { data } = useInitSync(store, asyncFn);
        return <div data-testid="async-data">{data}</div>;
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

        return <div data-testid="async-data">{data}</div>;
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

  describe("useStore integration", () => {
    test("should make useStore components suspend when related data is loading", async () => {
      const store = proxy({ userId: 1, user: null, posts: [] });

      // Simulate slow user fetch
      const userAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const userData = { id: 1, name: "John Doe" };
        state.user = userData;
        return userData;
      };

      function UserFetcher() {
        useInitSync(store, userAsyncFn);
        return null;
      }

      function UserDisplay() {
        const user = useStore(store, (s) => s.user);
        return <div data-testid="user-name">{user?.name || "no user"}</div>;
      }

      function App() {
        return (
          <Suspense fallback={<div data-testid="suspense-fallback">Loading user...</div>}>
            <UserFetcher />
            <UserDisplay />
          </Suspense>
        );
      }

      render(<App />);

      // UserDisplay should be suspended because user is loading
      expect(screen.getByTestId("suspense-fallback")).toHaveTextContent("Loading user...");

      // Wait for user to load
      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("John Doe");
      });
    });

    test("should not suspend useStore components for unrelated paths", async () => {
      const store = proxy({
        user: { name: "John", age: 30 },
        posts: null,
        settings: { theme: "dark" },
      });

      // Only loading posts
      const postsAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const posts = [{ id: 1, title: "Post 1" }];
        state.posts = posts;
        return posts;
      };

      function PostsFetcher() {
        useInitSync(store, postsAsyncFn);
        return null;
      }

      function UserDisplay() {
        const userName = useStore(store, (s) => s.user.name);
        return <div data-testid="user-name">{userName}</div>;
      }

      function SettingsDisplay() {
        const theme = useStore(store, (s) => s.settings.theme);
        return <div data-testid="theme">{theme}</div>;
      }

      function App() {
        return (
          <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
            <PostsFetcher />
            <UserDisplay />
            <SettingsDisplay />
          </Suspense>
        );
      }

      render(<App />);

      // User and settings should render immediately (not suspended)
      expect(screen.getByTestId("user-name")).toHaveTextContent("John");
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.queryByTestId("suspense-fallback")).toBeNull();
    });
  });

  describe("Error handling", () => {
    test("should handle async function errors", async () => {
      const store = proxy({ data: null });
      const error = new Error("Async operation failed");

      const asyncFn = jest.fn().mockRejectedValue(error);

      function TestComponent() {
        const { data, loading, error: asyncError } = useInitSync(store, asyncFn);

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
        expect(screen.getByTestId("error")).toHaveTextContent("Async operation failed");
        expect(screen.getByTestId("data")).toHaveTextContent("no data");
      });
    });

    test("should throw error to ErrorBoundary when errorBoundary option is true", async () => {
      const store = proxy({ data: null });
      const error = new Error("Critical error");

      const asyncFn = jest.fn().mockRejectedValue(error);

      function TestComponent() {
        useInitSync(store, asyncFn, { errorBoundary: true });
        return <div data-testid="success">Success</div>;
      }

      function ErrorFallback({ error }: { error: Error }) {
        return <div data-testid="error-boundary">Error: {error.message}</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallback={ErrorFallback}>
            <TestComponent />
          </ErrorBoundary>
        );
      }

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("error-boundary")).toHaveTextContent("Error: Critical error");
      });

      expect(screen.queryByTestId("success")).toBeNull();
    });

    test("should call onError callback", async () => {
      const store = proxy({ data: null });
      const error = new Error("Test error");
      const onError = jest.fn();

      const asyncFn = jest.fn().mockRejectedValue(error);

      function TestComponent() {
        useInitSync(store, asyncFn, { onError, errorBoundary: false });
        return <div data-testid="component">Component</div>;
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe("Dependencies and caching", () => {
    test("should re-execute async function when dependencies change", async () => {
      const store = proxy({ userId: 1, user: null });
      let callCount = 0;

      const asyncFn = jest.fn().mockImplementation(async (state: typeof store) => {
        callCount++;
        return { id: state.userId, name: `User ${state.userId}` };
      });

      function TestComponent() {
        const userId = useStore(store, (s) => s.userId);
        useInitSync(store, asyncFn, { deps: [userId] });

        return (
          <div>
            <div data-testid="call-count">{callCount}</div>
            <button onClick={() => (store.userId = 2)}>Change User</button>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("call-count")).toHaveTextContent("1");
      });

      // Change dependency
      act(() => {
        fireEvent.click(screen.getByText("Change User"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("call-count")).toHaveTextContent("2");
      });

      expect(asyncFn).toHaveBeenCalledTimes(2);
    });

    test("should prevent duplicate executions with same key", async () => {
      const store = proxy({ data: null });
      let callCount = 0;

      const asyncFn = jest.fn().mockImplementation(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return `result-${callCount}`;
      });

      function Component1() {
        const { data } = useInitSync(store, asyncFn, { key: "shared-key" });
        return <div data-testid="data1">{data || "loading"}</div>;
      }

      function Component2() {
        const { data } = useInitSync(store, asyncFn, { key: "shared-key" });
        return <div data-testid="data2">{data || "loading"}</div>;
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

      await waitFor(() => {
        expect(screen.getByTestId("data1")).toHaveTextContent("result-1");
        expect(screen.getByTestId("data2")).toHaveTextContent("result-1");
      });

      // Should only be called once despite two components using the same key
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    test("should call onSuccess callback", async () => {
      const store = proxy({ data: null });
      const onSuccess = jest.fn();
      const result = "success data";

      const asyncFn = jest.fn().mockResolvedValue(result);

      function TestComponent() {
        useInitSync(store, asyncFn, { onSuccess });
        return <div data-testid="component">Component</div>;
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(result);
      });
    });
  });

  describe("Edge cases", () => {
    test("should handle immediate resolution", async () => {
      const store = proxy({ data: null });
      const asyncFn = jest.fn().mockResolvedValue("immediate");

      function TestComponent() {
        const { data, loading } = useInitSync(store, asyncFn);

        return (
          <div>
            <div data-testid="loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="data">{data || "no data"}</div>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
        expect(screen.getByTestId("data")).toHaveTextContent("immediate");
      });
    });

    test("should handle component unmount during async operation", async () => {
      const store = proxy({ data: null });
      let resolveFn: (value: string) => void;

      const asyncFn = jest.fn().mockImplementation(() => {
        return new Promise<string>((resolve) => {
          resolveFn = resolve;
        });
      });

      function TestComponent() {
        const { data } = useInitSync(store, asyncFn);
        return <div data-testid="data">{data || "loading"}</div>;
      }

      function App({ showComponent }: { showComponent: boolean }) {
        return <div>{showComponent && <TestComponent />}</div>;
      }

      const { rerender } = render(<App showComponent={true} />);

      expect(screen.getByTestId("data")).toHaveTextContent("loading");

      // Unmount component
      rerender(<App showComponent={false} />);

      // Resolve the promise after unmount
      act(() => {
        resolveFn!("resolved after unmount");
      });

      // Should not cause any errors or updates
      expect(screen.queryByTestId("data")).toBeNull();
    });

    test("should handle null/undefined store values", async () => {
      const store = proxy({ value: null });

      const asyncFn = jest.fn().mockImplementation(async (state: any) => {
        return `value was: ${state.value}`;
      });

      function TestComponent() {
        const { data } = useInitSync(store, asyncFn);
        return <div data-testid="data">{data || "loading"}</div>;
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("data")).toHaveTextContent("value was: null");
      });
    });
  });
});
