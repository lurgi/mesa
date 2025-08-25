import { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { proxy, useStore, useInitSync } from "../../src/main";

describe("useStore Suspense Integration", () => {
  test("should show suspense fallback while async data is loading", async () => {
    type StoreType = {
      data: string | null;
      loading: boolean;
    };

    const store = proxy<StoreType>({ data: null, loading: false });

    function DataComponent() {
      const data = useStore(store, (s) => s.data);
      const loading = useStore(store, (s) => s.loading);

      return (
        <div>
          <div data-testid="data">{data || "no data"}</div>
          <div data-testid="loading-status">
            {loading ? "loading" : "ready"}
          </div>
        </div>
      );
    }

    function InitComponent() {
      useInitSync(
        store,
        async (state) => {
          await new Promise((resolve) => setTimeout(resolve, 100));

          state.data = "loaded data";
        },
        { suspense: true }
      );

      return null;
    }

    function App() {
      return (
        <div>
          <InitComponent />
          <Suspense
            fallback={<div data-testid="suspense-fallback">Loading...</div>}
          >
            <DataComponent />
          </Suspense>
        </div>
      );
    }

    render(<App />);

    expect(screen.getByTestId("suspense-fallback")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("data")).toHaveTextContent("loaded data");
      expect(screen.getByTestId("loading-status")).toHaveTextContent("ready");
    });

    expect(screen.queryByTestId("suspense-fallback")).not.toBeInTheDocument();
  });

  test("should handle multiple stores with independent suspense", async () => {
    const userStore = proxy<{ user: any }>({ user: null });
    const postsStore = proxy<{ posts: any[] }>({ posts: [] });

    function UserSection() {
      useInitSync(
        userStore,
        async (state) => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          state.user = { name: "John" };
        },
        { suspense: true }
      );

      const user = useStore(userStore, (s) => s.user);
      console.log("UserSection", user);
      return <div data-testid="user-data">{user?.name || "no user"}</div>;
    }

    function PostsSection() {
      useInitSync(
        postsStore,
        async (state) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          state.posts = [{ id: 1, title: "Post 1" }];
        },
        { suspense: true }
      );

      const posts = useStore(postsStore, (s) => s.posts);
      return <div data-testid="posts-count">{posts.length}</div>;
    }

    function App() {
      return (
        <div>
          <Suspense
            fallback={<div data-testid="user-suspense">Loading user...</div>}
          >
            <UserSection />
          </Suspense>
          <Suspense
            fallback={<div data-testid="posts-suspense">Loading posts...</div>}
          >
            <PostsSection />
          </Suspense>
        </div>
      );
    }

    render(<App />);

    expect(screen.getByTestId("user-suspense")).toBeInTheDocument();
    expect(screen.getByTestId("posts-suspense")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("user-data")).toHaveTextContent("John");
    });

    expect(screen.queryByTestId("user-suspense")).not.toBeInTheDocument();
    expect(screen.getByTestId("posts-suspense")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("posts-count")).toHaveTextContent("1");
    });

    expect(screen.queryByTestId("posts-suspense")).not.toBeInTheDocument();
  });

  test("should not suspend for synchronous data access", () => {
    const store = proxy<{ data: string; loading: boolean }>({
      data: "",
      loading: false,
    });

    function DataComponent() {
      const data = useStore(store, (s) => s.data);
      const loading = useStore(store, (s) => s.loading);
      return (
        <div>
          <div data-testid="data">{data}</div>
          <div data-testid="loading">{loading ? "loading" : "ready"}</div>
        </div>
      );
    }

    function InitComponent() {
      useInitSync(store, { data: "sync data", loading: false });
      return null;
    }

    function App() {
      return (
        <div>
          <InitComponent />
          <Suspense
            fallback={<div data-testid="suspense-fallback">Loading...</div>}
          >
            <DataComponent />
          </Suspense>
        </div>
      );
    }

    render(<App />);

    expect(screen.getByTestId("data")).toHaveTextContent("sync data");
    expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    expect(screen.queryByTestId("suspense-fallback")).not.toBeInTheDocument();
  });
});
