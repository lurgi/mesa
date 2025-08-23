import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { Suspense, useState } from "react";
import { proxy, useStore, useInitSync } from "../../src/main";
import { ErrorBoundary } from "react-error-boundary";

describe("useInitSync Suspense Integration", () => {
  describe("Advanced Suspense scenarios", () => {
    test("should handle nested Suspense boundaries correctly", async () => {
      const store = proxy({
        user: null,
        posts: null,
        comments: null,
      });

      const userAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const user = { id: 1, name: "John" };
        state.user = user;
        return user;
      };

      const postsAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const posts = [{ id: 1, title: "Post 1" }];
        state.posts = posts;
        return posts;
      };

      function UserComponent() {
        const { data: user } = useInitSync(store, userAsyncFn);
        return <div data-testid="user">User: {user?.name}</div>;
      }

      function PostsComponent() {
        const { data: posts } = useInitSync(store, postsAsyncFn);
        return <div data-testid="posts">Posts: {posts?.length || 0}</div>;
      }

      function App() {
        return (
          <Suspense fallback={<div data-testid="outer-fallback">Loading user...</div>}>
            <UserComponent />
            <Suspense fallback={<div data-testid="inner-fallback">Loading posts...</div>}>
              <PostsComponent />
            </Suspense>
          </Suspense>
        );
      }

      render(<App />);

      // Initially outer fallback should show (user loading)
      expect(screen.getByTestId("outer-fallback")).toHaveTextContent("Loading user...");

      // Wait for user to load
      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("User: John");
      });

      // Now inner fallback should show (posts loading)
      expect(screen.getByTestId("inner-fallback")).toHaveTextContent("Loading posts...");

      // Wait for posts to load
      await waitFor(() => {
        expect(screen.getByTestId("posts")).toHaveTextContent("Posts: 1");
      });

      // No fallbacks should remain
      expect(screen.queryByTestId("outer-fallback")).toBeNull();
      expect(screen.queryByTestId("inner-fallback")).toBeNull();
    });

    test("should handle concurrent async operations with different Suspense boundaries", async () => {
      const store = proxy({
        fastData: null,
        slowData: null,
      });

      const fastAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const data = "fast data";
        state.fastData = data;
        return data;
      };

      const slowAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const data = "slow data";
        state.slowData = data;
        return data;
      };

      function FastComponent() {
        const { data } = useInitSync(store, fastAsyncFn);
        return <div data-testid="fast-data">{data}</div>;
      }

      function SlowComponent() {
        const { data } = useInitSync(store, slowAsyncFn);
        return <div data-testid="slow-data">{data}</div>;
      }

      function App() {
        return (
          <div>
            <Suspense fallback={<div data-testid="fast-fallback">Loading fast...</div>}>
              <FastComponent />
            </Suspense>
            <Suspense fallback={<div data-testid="slow-fallback">Loading slow...</div>}>
              <SlowComponent />
            </Suspense>
          </div>
        );
      }

      render(<App />);

      // Both should show fallbacks initially
      expect(screen.getByTestId("fast-fallback")).toBeInTheDocument();
      expect(screen.getByTestId("slow-fallback")).toBeInTheDocument();

      // Fast component should resolve first
      await waitFor(() => {
        expect(screen.getByTestId("fast-data")).toHaveTextContent("fast data");
      });

      // Slow component should still be loading
      expect(screen.getByTestId("slow-fallback")).toBeInTheDocument();

      // Eventually slow component should resolve
      await waitFor(
        () => {
          expect(screen.getByTestId("slow-data")).toHaveTextContent("slow data");
        },
        { timeout: 300 }
      );
    });

    test("should handle Suspense with dynamic component mounting", async () => {
      const store = proxy({ data: null });

      const asyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const data = "dynamic data";
        state.data = data;
        return data;
      };

      function AsyncComponent() {
        const { data } = useInitSync(store, asyncFn);
        return <div data-testid="async-data">{data}</div>;
      }

      function App() {
        const [showAsync, setShowAsync] = useState(false);

        return (
          <div>
            <button onClick={() => setShowAsync(true)} data-testid="show-async">
              Show Async
            </button>
            {showAsync && (
              <Suspense fallback={<div data-testid="dynamic-fallback">Loading dynamic...</div>}>
                <AsyncComponent />
              </Suspense>
            )}
          </div>
        );
      }

      render(<App />);

      // Initially no fallback or data
      expect(screen.queryByTestId("dynamic-fallback")).toBeNull();
      expect(screen.queryByTestId("async-data")).toBeNull();

      // Trigger dynamic component
      act(() => {
        fireEvent.click(screen.getByTestId("show-async"));
      });

      // Should show fallback
      expect(screen.getByTestId("dynamic-fallback")).toHaveTextContent("Loading dynamic...");

      // Wait for data
      await waitFor(() => {
        expect(screen.getByTestId("async-data")).toHaveTextContent("dynamic data");
      });
    });
  });

  describe("useStore automatic Suspense integration", () => {
    test("should suspend useStore components when accessing loading paths", async () => {
      const store = proxy({
        user: { id: 1, name: null, email: null },
        isLoading: false,
      });

      const userAsyncFn = async (state: typeof store) => {
        state.isLoading = true;
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Simulate updating nested user properties
        state.user.name = "John Doe";
        state.user.email = "john@example.com";
        state.isLoading = false;

        return state.user;
      };

      function UserLoader() {
        useInitSync(store, userAsyncFn);
        return null; // This component only triggers loading
      }

      function UserNameDisplay() {
        const userName = useStore(store, (s) => s.user.name);
        return <div data-testid="user-name">{userName}</div>;
      }

      function UserEmailDisplay() {
        const userEmail = useStore(store, (s) => s.user.email);
        return <div data-testid="user-email">{userEmail}</div>;
      }

      function LoadingIndicator() {
        const isLoading = useStore(store, (s) => s.isLoading);
        return <div data-testid="loading-indicator">{isLoading ? "Loading" : "Ready"}</div>;
      }

      function App() {
        return (
          <div>
            <UserLoader />
            <Suspense fallback={<div data-testid="name-fallback">Loading name...</div>}>
              <UserNameDisplay />
            </Suspense>
            <Suspense fallback={<div data-testid="email-fallback">Loading email...</div>}>
              <UserEmailDisplay />
            </Suspense>
            {/* This should not suspend as isLoading is not being loaded by useInitSync */}
            <LoadingIndicator />
          </div>
        );
      }

      render(<App />);

      // Name and email should suspend (user.name, user.email are being loaded)
      expect(screen.getByTestId("name-fallback")).toHaveTextContent("Loading name...");
      expect(screen.getByTestId("email-fallback")).toHaveTextContent("Loading email...");

      // Loading indicator should show immediately (isLoading path not suspended)
      expect(screen.getByTestId("loading-indicator")).toHaveTextContent("Loading");

      // Wait for async operation
      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("John Doe");
        expect(screen.getByTestId("user-email")).toHaveTextContent("john@example.com");
        expect(screen.getByTestId("loading-indicator")).toHaveTextContent("Ready");
      });
    });

    test("should only suspend useStore components accessing affected paths", async () => {
      const store = proxy({
        posts: null,
        user: { name: "John", age: 30 },
        settings: { theme: "dark" },
      });

      const postsAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        state.posts = [{ id: 1, title: "Post 1" }];
        return state.posts;
      };

      function PostsLoader() {
        useInitSync(store, postsAsyncFn);
        return null;
      }

      function PostsDisplay() {
        const posts = useStore(store, (s) => s.posts);
        return <div data-testid="posts">{posts?.length || 0} posts</div>;
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
          <div>
            <PostsLoader />
            <Suspense fallback={<div data-testid="posts-fallback">Loading posts...</div>}>
              <PostsDisplay />
            </Suspense>
            {/* These should render immediately */}
            <UserDisplay />
            <SettingsDisplay />
          </div>
        );
      }

      render(<App />);

      // Posts should suspend
      expect(screen.getByTestId("posts-fallback")).toHaveTextContent("Loading posts...");

      // User and settings should render immediately
      expect(screen.getByTestId("user-name")).toHaveTextContent("John");
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");

      // Wait for posts to load
      await waitFor(() => {
        expect(screen.getByTestId("posts")).toHaveTextContent("1 posts");
      });
    });

    test("should handle conditional useStore subscriptions during loading", async () => {
      const store = proxy({
        showDetails: false,
        userDetails: null,
      });

      const detailsAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        state.userDetails = { bio: "Software Engineer", location: "SF" };
        return state.userDetails;
      };

      function DetailsLoader() {
        useInitSync(store, detailsAsyncFn);
        return null;
      }

      function ConditionalDetails() {
        const showDetails = useStore(store, (s) => s.showDetails);

        // Only subscribe to userDetails if showDetails is true
        const userDetails = showDetails ? useStore(store, (s) => s.userDetails) : null;

        if (!showDetails) {
          return <div data-testid="details-hidden">Details hidden</div>;
        }

        return <div data-testid="user-details">{userDetails ? JSON.stringify(userDetails) : "No details"}</div>;
      }

      function App() {
        return (
          <div>
            <DetailsLoader />
            <button onClick={() => (store.showDetails = !store.showDetails)} data-testid="toggle-details">
              Toggle Details
            </button>
            <Suspense fallback={<div data-testid="details-fallback">Loading details...</div>}>
              <ConditionalDetails />
            </Suspense>
          </div>
        );
      }

      render(<App />);

      // Initially should not suspend (not subscribing to userDetails)
      expect(screen.getByTestId("details-hidden")).toHaveTextContent("Details hidden");
      expect(screen.queryByTestId("details-fallback")).toBeNull();

      // Toggle to show details - this should trigger suspension
      act(() => {
        fireEvent.click(screen.getByTestId("toggle-details"));
      });

      // Now should suspend because we're subscribing to userDetails
      expect(screen.getByTestId("details-fallback")).toHaveTextContent("Loading details...");

      // Wait for details to load
      await waitFor(() => {
        expect(screen.getByTestId("user-details")).toHaveTextContent(
          JSON.stringify({ bio: "Software Engineer", location: "SF" })
        );
      });
    });
  });

  describe("Suspense error boundaries", () => {
    test("should handle errors during Suspense with ErrorBoundary", async () => {
      const store = proxy({ data: null });
      const error = new Error("Suspense async error");

      const asyncFn = jest.fn().mockRejectedValue(error);

      function AsyncComponent() {
        useInitSync(store, asyncFn, { errorBoundary: true });
        return <div data-testid="success">Success</div>;
      }

      function ErrorFallback({ error }: { error: Error }) {
        return <div data-testid="error-boundary">Error: {error.message}</div>;
      }

      function App() {
        return (
          <ErrorBoundary fallback={ErrorFallback}>
            <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
              <AsyncComponent />
            </Suspense>
          </ErrorBoundary>
        );
      }

      render(<App />);

      // Initially should show Suspense fallback
      expect(screen.getByTestId("suspense-fallback")).toHaveTextContent("Loading...");

      // After error, should show ErrorBoundary
      await waitFor(() => {
        expect(screen.getByTestId("error-boundary")).toHaveTextContent("Error: Suspense async error");
      });

      expect(screen.queryByTestId("suspense-fallback")).toBeNull();
      expect(screen.queryByTestId("success")).toBeNull();
    });

    test("should handle mixed success/error scenarios in Suspense", async () => {
      const store = proxy({
        successData: null,
        errorData: null,
      });

      const successAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        state.successData = "success";
        return "success";
      };

      const errorAsyncFn = jest.fn().mockRejectedValue(new Error("Failed"));

      function SuccessComponent() {
        const { data } = useInitSync(store, successAsyncFn);
        return <div data-testid="success-data">{data}</div>;
      }

      function ErrorComponent() {
        useInitSync(store, errorAsyncFn, { errorBoundary: true });
        return <div data-testid="error-success">This should not render</div>;
      }

      function ErrorFallback({ error }: { error: Error }) {
        return <div data-testid="error-fallback">Caught: {error.message}</div>;
      }

      function App() {
        return (
          <div>
            <Suspense fallback={<div data-testid="success-loading">Loading success...</div>}>
              <SuccessComponent />
            </Suspense>
            <ErrorBoundary fallback={ErrorFallback}>
              <Suspense fallback={<div data-testid="error-loading">Loading error...</div>}>
                <ErrorComponent />
              </Suspense>
            </ErrorBoundary>
          </div>
        );
      }

      render(<App />);

      // Both should show loading initially
      expect(screen.getByTestId("success-loading")).toBeInTheDocument();
      expect(screen.getByTestId("error-loading")).toBeInTheDocument();

      // Success should resolve
      await waitFor(() => {
        expect(screen.getByTestId("success-data")).toHaveTextContent("success");
      });

      // Error should be caught by ErrorBoundary
      await waitFor(() => {
        expect(screen.getByTestId("error-fallback")).toHaveTextContent("Caught: Failed");
      });

      expect(screen.queryByTestId("error-success")).toBeNull();
    });
  });

  describe("Suspense with refetch", () => {
    test("should handle refetch operations with Suspense", async () => {
      const store = proxy({ data: null, refetchCount: 0 });

      const asyncFn = jest.fn().mockImplementation(async (state: typeof store) => {
        state.refetchCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        const result = `data-${state.refetchCount}`;
        state.data = result;
        return result;
      });

      function AsyncComponent() {
        const { data, refetch } = useInitSync(store, asyncFn);

        return (
          <div>
            <div data-testid="async-data">{data}</div>
            <button onClick={refetch} data-testid="refetch">
              Refetch
            </button>
          </div>
        );
      }

      function App() {
        return (
          <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
            <AsyncComponent />
          </Suspense>
        );
      }

      render(<App />);

      // Initial load
      expect(screen.getByTestId("suspense-fallback")).toHaveTextContent("Loading...");

      await waitFor(() => {
        expect(screen.getByTestId("async-data")).toHaveTextContent("data-1");
      });

      // Trigger refetch
      act(() => {
        fireEvent.click(screen.getByTestId("refetch"));
      });

      // Should show fallback again during refetch
      expect(screen.getByTestId("suspense-fallback")).toHaveTextContent("Loading...");

      // Should resolve with new data
      await waitFor(() => {
        expect(screen.getByTestId("async-data")).toHaveTextContent("data-2");
      });
    });
  });
});
