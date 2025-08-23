import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { proxy, useStore, useInitSync } from "../../src/main";
import { ErrorBoundary } from "react-error-boundary";
import { vi } from "vitest";

describe("useInitSync hook", () => {
  describe("Direct value initialization", () => {
    test("should initialize store with direct object values", () => {
      type StoreType = {
        user: { name: string; id: number } | null;
        theme: string;
      };

      const store = proxy<StoreType>({ user: null, theme: "light" });

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
      type StoreType = { status: string };
      const store = proxy<StoreType>({ status: "initial" });

      function TestComponent() {
        // For primitive values, we return data instead of updating store
        const { data } = useInitSync(store, "ready");
        return <div data-testid="status">{data || store.status}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId("status")).toHaveTextContent("ready");
    });

    test("should prevent flicker with localStorage values", () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn((key: string) => {
          if (key === "user") return JSON.stringify({ name: "Cached User" });
          if (key === "theme") return "dark";
          return null;
        }),
      };
      Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

      type StoreType = {
        user: { name: string } | null;
        theme: string;
      };

      const store = proxy<StoreType>({ user: null, theme: "light" });

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

  describe("Function-based initialization", () => {
    test("should handle synchronous initialization functions", () => {
      type StoreType = {
        user: { name: string; id: number } | null;
        settings: { theme: string; lang: string } | null;
      };

      const store = proxy<StoreType>({ user: null, settings: null });

      function TestComponent() {
        useInitSync(store, (state) => {
          // Synchronous initialization with proper typing
          (state as any).user = { name: "Sync User", id: 42 };
          (state as any).settings = { theme: "auto", lang: "en" };
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

    test("should handle async functions with progressive enhancement", async () => {
      type StoreType = {
        status: string;
        data: { content: string } | null;
      };

      const store = proxy<StoreType>({ status: "initial", data: null });

      function TestComponent() {
        useInitSync(store, async (state) => {
          // Phase 1: Immediate placeholder
          (state as any).status = "placeholder";
          (state as any).data = { content: "Loading..." };

          // Phase 2: Async data
          await new Promise((resolve) => setTimeout(resolve, 50));
          (state as any).status = "loaded";
          (state as any).data = { content: "Final content" };

          return state.data;
        });

        const status = useStore(store, (s) => s.status);
        const data = useStore(store, (s) => s.data);

        return (
          <div>
            <div data-testid="status">Status: {status}</div>
            <div data-testid="content">{data?.content || "No content"}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Should immediately show placeholder - no flicker
      expect(screen.getByTestId("status")).toHaveTextContent("Status: placeholder");
      expect(screen.getByTestId("content")).toHaveTextContent("Loading...");

      // Wait for async completion
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("Status: loaded");
        expect(screen.getByTestId("content")).toHaveTextContent("Final content");
      });
    });
  });

  describe("Basic async functionality", () => {
    test("should execute async function and return data", async () => {
      type StoreType = { userId: number };
      const store = proxy<StoreType>({ userId: 1 });

      const mockUser = { id: 1, name: "John Doe" };
      const asyncFn = vi.fn().mockResolvedValue(mockUser);

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
      type StoreType = { count: number };
      const store = proxy<StoreType>({ count: 0 });
      let callCount = 0;

      const asyncFn = vi.fn().mockImplementation(() => {
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
  });

  describe("Error handling", () => {
    test("should handle async function errors", async () => {
      const store = proxy({ data: null });
      const error = new Error("Async operation failed");

      const asyncFn = vi.fn().mockRejectedValue(error);

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

    test("should call onError callback", async () => {
      const store = proxy({ data: null });
      const error = new Error("Test error");
      const onError = vi.fn();

      const asyncFn = vi.fn().mockRejectedValue(error);

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
      type StoreType = { userId: number };
      const store = proxy<StoreType>({ userId: 1 });
      let callCount = 0;

      const asyncFn = vi.fn().mockImplementation(async (state: StoreType) => {
        callCount++;
        return { id: state.userId, name: `User ${state.userId}` };
      });

      function TestComponent() {
        const userId = useStore(store, (s) => s.userId);
        useInitSync(store, asyncFn, { deps: [userId] });

        return (
          <div>
            <div data-testid="call-count">{callCount}</div>
            <button
              onClick={() => {
                (store as any).userId = 2;
              }}
            >
              Change User
            </button>
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
  });

  describe("One store, one useInitSync validation", () => {
    test("should throw error when multiple useInitSync are used on the same store", () => {
      const store = proxy({ data: null });

      const asyncFn1 = vi.fn().mockResolvedValue("data1");
      const asyncFn2 = vi.fn().mockResolvedValue("data2");

      function TestComponent() {
        useInitSync(store, asyncFn1);

        // This should throw an error - second useInitSync on same store
        useInitSync(store, asyncFn2);

        return <div data-testid="success">Should not render</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallbackRender={({ error }) => <div data-testid="error-boundary">{error.message}</div>}>
            <TestComponent />
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.getByTestId("error-boundary")).toHaveTextContent(
        "Multiple useInitSync calls detected on the same store"
      );
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
          <ErrorBoundary fallbackRender={({ error }) => <div data-testid="error-boundary">{error.message}</div>}>
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

    test("should allow custom keys to bypass one-store limitation", () => {
      const store = proxy({ data: null });

      const asyncFn1 = vi.fn().mockResolvedValue("data1");
      const asyncFn2 = vi.fn().mockResolvedValue("data2");

      function Component1() {
        const { data } = useInitSync(store, asyncFn1, { key: "operation-1" });
        return <div data-testid="component1">{data || "loading1"}</div>;
      }

      function Component2() {
        const { data } = useInitSync(store, asyncFn2, { key: "operation-2" });
        return <div data-testid="component2">{data || "loading2"}</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallbackRender={({ error }) => <div data-testid="error-boundary">{error.message}</div>}>
            <Component1 />
            <Component2 />
          </ErrorBoundary>
        );
      }

      render(<App />);

      // Should work with custom keys - no error
      expect(screen.queryByTestId("error-boundary")).toBeNull();
      expect(screen.getByTestId("component1")).toBeInTheDocument();
      expect(screen.getByTestId("component2")).toBeInTheDocument();
    });
  });
});
