import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { proxy, useStore, useInitSync } from "../../src/main";
import { ErrorBoundary } from "react-error-boundary";
import { vi } from "vitest";

describe("useInitSync Single Initialization Validation", () => {
  describe("Same store validation", () => {
    test("should throw error when multiple useInitSync calls are made on same store", () => {
      const store = proxy({ data: null, loading: false });

      const asyncFn1 = vi.fn().mockResolvedValue("data1");
      const asyncFn2 = vi.fn().mockResolvedValue("data2");

      function TestComponent() {
        useInitSync(store, async (state) => {
          state.data = await asyncFn1();
        });

        useInitSync(store, async (state) => {
          state.data = await asyncFn2();
        });

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
      expect(screen.queryByTestId("success")).toBeNull();
    });

    test("should throw error when useInitSync is called in different components for same store", () => {
      const store = proxy({ data: null, loading: false });

      const asyncFn1 = vi.fn().mockResolvedValue("data1");
      const asyncFn2 = vi.fn().mockResolvedValue("data2");

      function Component1() {
        useInitSync(store, async (state) => {
          state.data = await asyncFn1();
        });
        return <div data-testid="component1">Component 1</div>;
      }

      function Component2() {
        useInitSync(store, async (state) => {
          state.data = await asyncFn2();
        });
        return <div data-testid="component2">Component 2</div>;
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

      expect(screen.getByTestId("error-boundary")).toHaveTextContent(
        "Multiple useInitSync calls detected on the same store"
      );
      expect(screen.queryByTestId("component1")).toBeNull();
      expect(screen.queryByTestId("component2")).toBeNull();
    });

    test("should throw error even with different initializer functions", () => {
      const store = proxy<{ user: { name: string } | null; settings: { theme: string } | null }>({
        user: null,
        settings: null,
      });

      function TestComponent() {
        useInitSync(store, async (state) => {
          state.user = { name: "John" };
        });

        useInitSync(store, (state) => {
          state.settings = { theme: "dark" };
        });

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
  });

  describe("Different stores validation", () => {
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
          <ErrorBoundary fallbackRender={({ error }) => <div data-testid="error-boundary">{error.message}</div>}>
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

    test("should allow async initialization on different stores", async () => {
      const userStore = proxy<{ user: { name: string } | null; loading: boolean }>({ user: null, loading: true });
      const settingsStore = proxy<{ settings: { theme: string } | null; loading: boolean }>({
        settings: null,
        loading: true,
      });

      function UserComponent() {
        useInitSync(userStore, async (state) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          state.user = { name: "John" };
          state.loading = false;
        });

        const { user, loading } = useStore(userStore, (s) => s);

        if (loading) return <div data-testid="user-loading">Loading user...</div>;
        return <div data-testid="user-data">{user?.name || "no user"}</div>;
      }

      function SettingsComponent() {
        useInitSync(settingsStore, async (state) => {
          await new Promise((resolve) => setTimeout(resolve, 15));
          state.settings = { theme: "dark" };
          state.loading = false;
        });

        const { settings, loading } = useStore(settingsStore, (s) => s);

        if (loading) return <div data-testid="settings-loading">Loading settings...</div>;
        return <div data-testid="settings-data">{settings?.theme || "no theme"}</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallbackRender={({ error }) => <div data-testid="error-boundary">{error.message}</div>}>
            <UserComponent />
            <SettingsComponent />
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.getByTestId("user-loading")).toBeInTheDocument();
      expect(screen.getByTestId("settings-loading")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("user-data")).toHaveTextContent("John");
        expect(screen.getByTestId("settings-data")).toHaveTextContent("dark");
      });

      expect(screen.queryByTestId("error-boundary")).toBeNull();
    });
  });

  describe("Component remounting validation", () => {
    test("should allow same store after component unmount and remount", () => {
      const store = proxy<{ data: string | null }>({ data: null });
      let shouldShowComponent = true;

      function TestComponent() {
        useInitSync(store, { data: "initialized" });
        const data = useStore(store, (s) => s.data);
        return <div data-testid="component">{data}</div>;
      }

      function App() {
        const [show, setShow] = React.useState(true);

        React.useEffect(() => {
          shouldShowComponent = show;
        }, [show]);

        return (
          <ErrorBoundary fallbackRender={({ error }) => <div data-testid="error-boundary">{error.message}</div>}>
            <button onClick={() => setShow(!show)} data-testid="toggle">
              Toggle Component
            </button>
            {show && <TestComponent />}
          </ErrorBoundary>
        );
      }

      render(<App />);

      expect(screen.getByTestId("component")).toHaveTextContent("initialized");

      fireEvent.click(screen.getByTestId("toggle"));
      expect(screen.queryByTestId("component")).toBeNull();

      fireEvent.click(screen.getByTestId("toggle"));
      expect(screen.getByTestId("component")).toHaveTextContent("initialized");
      expect(screen.queryByTestId("error-boundary")).toBeNull();
    });
  });

  describe("Error message validation", () => {
    test("should provide clear error message for same store usage", () => {
      const store = proxy<{ data: string | null }>({ data: null });

      function TestComponent() {
        useInitSync(store, { data: "first" });
        useInitSync(store, { data: "second" });
        return <div>Should not render</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallbackRender={({ error }) => <div data-testid="error-message">{error.message}</div>}>
            <TestComponent />
          </ErrorBoundary>
        );
      }

      render(<App />);

      const errorMessage = screen.getByTestId("error-message").textContent;
      expect(errorMessage).toMatch(/Multiple useInitSync calls detected on the same store/);
      expect(errorMessage).toMatch(/Use separate stores for different concerns/);
    });
  });

  describe("Recommended patterns validation", () => {
    test("should support coordinated initialization pattern", async () => {
      const appStore = proxy<{
        user: { name: string } | null;
        settings: { theme: string } | null;
        notifications: { id: number; message: string }[];
        loading: boolean;
        error: string | null;
      }>({
        user: null,
        settings: null,
        notifications: [],
        loading: true,
        error: null,
      });

      function App() {
        useInitSync(appStore, async (state) => {
          state.error = null;

          try {
            const [user, settings, notifications] = await Promise.all([
              new Promise((resolve) => setTimeout(() => resolve({ name: "John" }), 10)),
              new Promise((resolve) => setTimeout(() => resolve({ theme: "dark" }), 15)),
              new Promise((resolve) => setTimeout(() => resolve([{ id: 1, message: "Welcome" }]), 20)),
            ]);

            state.user = user as { name: string } | null;
            state.settings = settings as { theme: string } | null;
            state.notifications = notifications as { id: number; message: string }[];
          } catch (error: any) {
            state.error = error.message;
          } finally {
            state.loading = false;
          }
        });

        const { user, settings, notifications, loading, error } = useStore(appStore, (s) => s);

        if (loading) return <div data-testid="loading">Loading...</div>;
        if (error) return <div data-testid="error">Error: {error}</div>;

        return (
          <div>
            <div data-testid="user">{user?.name || "no user"}</div>
            <div data-testid="settings">{settings?.theme || "no theme"}</div>
            <div data-testid="notifications">{notifications.length} notifications</div>
          </div>
        );
      }

      render(<App />);

      expect(screen.getByTestId("loading")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("John");
        expect(screen.getByTestId("settings")).toHaveTextContent("dark");
        expect(screen.getByTestId("notifications")).toHaveTextContent("1 notifications");
      });
    });

    test("should support domain separation pattern", async () => {
      const userStore = proxy<{ user: { name: string; role: string } | null; userLoading: boolean }>({
        user: null,
        userLoading: true,
      });
      const settingsStore = proxy<{ settings: { language: string } | null }>({ settings: null });
      const uiStore = proxy({ theme: "light", sidebar: false });

      function UserSection() {
        useInitSync(userStore, async (state: any) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          state.user = { name: "John", role: "admin" };
          state.userLoading = false;
        });

        const { user, userLoading } = useStore(userStore, (s) => s);
        if (userLoading) return <div data-testid="user-loading">Loading user...</div>;
        return (
          <div data-testid="user-section">
            {user?.name} ({user?.role})
          </div>
        );
      }

      function SettingsSection() {
        useInitSync(settingsStore, (state: any) => {
          state.settings = {
            notifications: true,
            darkMode: false,
            language: "en",
          };
        });

        const { settings } = useStore(settingsStore, (s) => s);
        return <div data-testid="settings-section">{settings?.language || "loading"}</div>;
      }

      function UISection() {
        useInitSync(uiStore, (state: any) => {
          state.theme = "dark";
          state.sidebar = true;
        });

        const { theme, sidebar } = useStore(uiStore, (s) => s);
        return (
          <div data-testid="ui-section">
            {theme} theme, sidebar {sidebar ? "open" : "closed"}
          </div>
        );
      }

      function App() {
        return (
          <div>
            <UserSection />
            <SettingsSection />
            <UISection />
          </div>
        );
      }

      render(<App />);

      expect(screen.getByTestId("user-loading")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("settings-section")).toHaveTextContent("en");
        expect(screen.getByTestId("ui-section")).toHaveTextContent("dark theme, sidebar open");
      });

      await waitFor(() => {
        expect(screen.getByTestId("user-section")).toHaveTextContent("John (admin)");
      });
    });
  });
});
