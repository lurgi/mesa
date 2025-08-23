import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { proxy, useStore, useInitSync } from "../../src/main";

describe("useInitSync Integration with useStore", () => {
  describe("Fine-grained path-based suspension", () => {
    test("should only suspend useStore components accessing paths affected by useInitSync", async () => {
      const store = proxy({
        ui: {
          theme: "dark",
          sidebar: { collapsed: false },
        },
        data: {
          user: null,
          posts: [],
        },
        metadata: {
          lastUpdated: null,
        },
      });

      const userAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const user = { id: 1, name: "John Doe", email: "john@example.com" };
        state.data.user = user;
        state.metadata.lastUpdated = Date.now();
        return user;
      };

      function UserLoader() {
        useInitSync(store, userAsyncFn);
        return null;
      }

      // These should suspend (accessing paths modified by useInitSync)
      function UserName() {
        const user = useStore(store, (s) => s.data.user);
        return <div data-testid="user-name">{user?.name || "No name"}</div>;
      }

      function LastUpdated() {
        const lastUpdated = useStore(store, (s) => s.metadata.lastUpdated);
        return <div data-testid="last-updated">{lastUpdated || "Never"}</div>;
      }

      // These should NOT suspend (accessing unrelated paths)
      function Theme() {
        const theme = useStore(store, (s) => s.ui.theme);
        return <div data-testid="theme">{theme}</div>;
      }

      function SidebarState() {
        const collapsed = useStore(store, (s) => s.ui.sidebar.collapsed);
        return <div data-testid="sidebar">{collapsed ? "collapsed" : "expanded"}</div>;
      }

      function Posts() {
        const posts = useStore(store, (s) => s.data.posts);
        return <div data-testid="posts">{posts.length} posts</div>;
      }

      function App() {
        return (
          <div>
            <UserLoader />

            {/* These should suspend */}
            <Suspense fallback={<div data-testid="user-loading">Loading user...</div>}>
              <UserName />
            </Suspense>
            <Suspense fallback={<div data-testid="metadata-loading">Loading metadata...</div>}>
              <LastUpdated />
            </Suspense>

            {/* These should render immediately */}
            <Theme />
            <SidebarState />
            <Posts />
          </div>
        );
      }

      render(<App />);

      // Components accessing affected paths should suspend
      expect(screen.getByTestId("user-loading")).toHaveTextContent("Loading user...");
      expect(screen.getByTestId("metadata-loading")).toHaveTextContent("Loading metadata...");

      // Components accessing unaffected paths should render immediately
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("sidebar")).toHaveTextContent("expanded");
      expect(screen.getByTestId("posts")).toHaveTextContent("0 posts");

      // Wait for async operation
      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("John Doe");
        expect(screen.getByTestId("last-updated")).not.toHaveTextContent("Never");
      });
    });

    test("should handle deep nested path subscriptions correctly", async () => {
      const store = proxy({
        app: {
          user: {
            profile: {
              personal: {
                name: null,
                age: null,
              },
              professional: {
                title: null,
                company: null,
              },
            },
            settings: {
              notifications: { email: true },
              privacy: { public: false },
            },
          },
          ui: {
            modal: { isOpen: false },
          },
        },
      });

      const profileAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        state.app.user.profile.personal.name = "John Doe";
        state.app.user.profile.personal.age = 30;
        state.app.user.profile.professional.title = "Engineer";
        state.app.user.profile.professional.company = "TechCorp";
        return state.app.user.profile;
      };

      function ProfileLoader() {
        useInitSync(store, profileAsyncFn);
        return null;
      }

      // Should suspend (accessing modified deep paths)
      function PersonalInfo() {
        const name = useStore(store, (s) => s.app.user.profile.personal.name);
        const age = useStore(store, (s) => s.app.user.profile.personal.age);
        return (
          <div data-testid="personal-info">
            {name} ({age})
          </div>
        );
      }

      function ProfessionalInfo() {
        const title = useStore(store, (s) => s.app.user.profile.professional.title);
        const company = useStore(store, (s) => s.app.user.profile.professional.company);
        return (
          <div data-testid="professional-info">
            {title} at {company}
          </div>
        );
      }

      // Should NOT suspend (accessing unmodified paths)
      function NotificationSettings() {
        const emailEnabled = useStore(store, (s) => s.app.user.settings.notifications.email);
        return <div data-testid="notifications">Email: {emailEnabled ? "enabled" : "disabled"}</div>;
      }

      function UIState() {
        const modalOpen = useStore(store, (s) => s.app.ui.modal.isOpen);
        return <div data-testid="modal-state">Modal: {modalOpen ? "open" : "closed"}</div>;
      }

      function App() {
        return (
          <div>
            <ProfileLoader />

            <Suspense fallback={<div data-testid="personal-loading">Loading personal...</div>}>
              <PersonalInfo />
            </Suspense>
            <Suspense fallback={<div data-testid="professional-loading">Loading professional...</div>}>
              <ProfessionalInfo />
            </Suspense>

            <NotificationSettings />
            <UIState />
          </div>
        );
      }

      render(<App />);

      // Deep nested modified paths should suspend
      expect(screen.getByTestId("personal-loading")).toHaveTextContent("Loading personal...");
      expect(screen.getByTestId("professional-loading")).toHaveTextContent("Loading professional...");

      // Unmodified nested paths should not suspend
      expect(screen.getByTestId("notifications")).toHaveTextContent("Email: enabled");
      expect(screen.getByTestId("modal-state")).toHaveTextContent("Modal: closed");

      // Wait for resolution
      await waitFor(() => {
        expect(screen.getByTestId("personal-info")).toHaveTextContent("John Doe (30)");
        expect(screen.getByTestId("professional-info")).toHaveTextContent("Engineer at TechCorp");
      });
    });

    test("should handle array modifications and index-based subscriptions", async () => {
      const store = proxy({
        items: [
          { id: 1, name: "Item 1", status: "active" },
          { id: 2, name: "Item 2", status: "inactive" },
        ],
        summary: {
          total: 2,
          active: 1,
        },
      });

      const updateItemsAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Update existing items and add new one
        state.items[0].status = "updated";
        state.items.push({ id: 3, name: "Item 3", status: "new" });

        // Update summary
        state.summary.total = 3;
        state.summary.active = 2;

        return state.items;
      };

      function ItemsLoader() {
        useInitSync(store, updateItemsAsyncFn);
        return null;
      }

      // Should suspend (accessing modified array and its elements)
      function ItemsList() {
        const items = useStore(store, (s) => s.items);
        return (
          <div data-testid="items-list">
            {items.map((item) => (
              <div key={item.id}>
                {item.name}: {item.status}
              </div>
            ))}
          </div>
        );
      }

      function FirstItemStatus() {
        const firstItem = useStore(store, (s) => s.items[0]);
        return <div data-testid="first-item-status">{firstItem?.status}</div>;
      }

      function ItemsCount() {
        const count = useStore(store, (s) => s.items.length);
        return <div data-testid="items-count">{count}</div>;
      }

      function Summary() {
        const summary = useStore(store, (s) => s.summary);
        return (
          <div data-testid="summary">
            Total: {summary.total}, Active: {summary.active}
          </div>
        );
      }

      // Should NOT suspend (accessing unrelated data)
      function StaticInfo() {
        // Let's add some static data that won't be modified
        const staticValue = useStore(store, (s) => s.items[1]?.id);
        return <div data-testid="static-info">Second item ID: {staticValue}</div>;
      }

      function App() {
        return (
          <div>
            <ItemsLoader />

            <Suspense fallback={<div data-testid="items-loading">Loading items...</div>}>
              <ItemsList />
            </Suspense>
            <Suspense fallback={<div data-testid="first-item-loading">Loading first item...</div>}>
              <FirstItemStatus />
            </Suspense>
            <Suspense fallback={<div data-testid="count-loading">Loading count...</div>}>
              <ItemsCount />
            </Suspense>
            <Suspense fallback={<div data-testid="summary-loading">Loading summary...</div>}>
              <Summary />
            </Suspense>

            <StaticInfo />
          </div>
        );
      }

      render(<App />);

      // All components accessing the modified array should suspend
      expect(screen.getByTestId("items-loading")).toHaveTextContent("Loading items...");
      expect(screen.getByTestId("first-item-loading")).toHaveTextContent("Loading first item...");
      expect(screen.getByTestId("count-loading")).toHaveTextContent("Loading count...");
      expect(screen.getByTestId("summary-loading")).toHaveTextContent("Loading summary...");

      // Static info should render (though this might also suspend in practice)
      expect(screen.getByTestId("static-info")).toHaveTextContent("Second item ID: 2");

      // Wait for updates
      await waitFor(() => {
        expect(screen.getByTestId("first-item-status")).toHaveTextContent("updated");
        expect(screen.getByTestId("items-count")).toHaveTextContent("3");
        expect(screen.getByTestId("summary")).toHaveTextContent("Total: 3, Active: 2");
      });
    });
  });


  describe("Dynamic path subscriptions", () => {
    test("should handle changing subscriptions during loading", async () => {
      const store = proxy({
        mode: "user" as "user" | "admin",
        userData: null,
        adminData: null,
      });

      const userAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        state.userData = { name: "John", role: "user" };
        return state.userData;
      };

      const adminAsyncFn = async (state: typeof store) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        state.adminData = { name: "Admin", permissions: ["all"] };
        return state.adminData;
      };

      function DataLoaders() {
        useInitSync(store, userAsyncFn);
        useInitSync(store, adminAsyncFn);
        return null;
      }

      function DynamicContent() {
        const mode = useStore(store, (s) => s.mode);

        // Conditionally subscribe to different paths
        const userData = mode === "user" ? useStore(store, (s) => s.userData) : null;

        const adminData = mode === "admin" ? useStore(store, (s) => s.adminData) : null;

        return (
          <div>
            <div data-testid="mode">Mode: {mode}</div>
            <div data-testid="content">
              {mode === "user" && userData && `User: ${userData.name}`}
              {mode === "admin" && adminData && `Admin: ${adminData.name}`}
            </div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <DataLoaders />
            <button onClick={() => (store.mode = store.mode === "user" ? "admin" : "user")} data-testid="toggle-mode">
              Toggle Mode
            </button>

            <Suspense fallback={<div data-testid="content-loading">Loading content...</div>}>
              <DynamicContent />
            </Suspense>
          </div>
        );
      }

      render(<App />);

      // Initially in user mode and loading
      expect(screen.getByTestId("content-loading")).toBeInTheDocument();

      // Wait for user data to load
      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("Mode: user");
        expect(screen.getByTestId("content")).toHaveTextContent("User: John");
      });

      // Switch to admin mode - should suspend again
      act(() => {
        fireEvent.click(screen.getByTestId("toggle-mode"));
      });

      expect(screen.getByTestId("content-loading")).toBeInTheDocument();

      // Wait for admin data to load
      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("Mode: admin");
        expect(screen.getByTestId("content")).toHaveTextContent("Admin: Admin");
      });

      // Switch back to user mode - should not suspend (data already loaded)
      act(() => {
        fireEvent.click(screen.getByTestId("toggle-mode"));
      });

      // Should render immediately without suspending
      expect(screen.getByTestId("mode")).toHaveTextContent("Mode: user");
      expect(screen.getByTestId("content")).toHaveTextContent("User: John");
      expect(screen.queryByTestId("content-loading")).toBeNull();
    });
  });

  describe("Flicker prevention with useStore", () => {
    test("should prevent flicker in useStore components with direct value initialization", () => {
      const store = proxy({
        user: null,
        posts: [],
        ui: { ready: false },
      });

      function DataInitializer() {
        // Initialize with meaningful default values immediately
        useInitSync(store, {
          user: { name: "Guest", id: 0 },
          posts: [{ id: "placeholder", title: "Loading posts..." }],
          ui: { ready: true },
        });
        return null;
      }

      function UserProfile() {
        const user = useStore(store, (s) => s.user);
        return <div data-testid="user-profile">Welcome, {user?.name}!</div>;
      }

      function PostsList() {
        const posts = useStore(store, (s) => s.posts);
        return (
          <div data-testid="posts-list">
            {posts.map((post) => (
              <div key={post.id}>{post.title}</div>
            ))}
          </div>
        );
      }

      function LoadingIndicator() {
        const ready = useStore(store, (s) => s.ui.ready);
        return <div data-testid="loading">{ready ? "Ready" : "Loading..."}</div>;
      }

      function App() {
        return (
          <div>
            <DataInitializer />
            <UserProfile />
            <PostsList />
            <LoadingIndicator />
          </div>
        );
      }

      render(<App />);

      // All components should render immediately with meaningful content - no flicker
      expect(screen.getByTestId("user-profile")).toHaveTextContent("Welcome, Guest!");
      expect(screen.getByTestId("posts-list")).toHaveTextContent("Loading posts...");
      expect(screen.getByTestId("loading")).toHaveTextContent("Ready");
    });

    test("should handle progressive data enhancement without flicker", async () => {
      const store = proxy({
        status: "initial",
        data: null,
      });

      function DataLoader() {
        useInitSync(store, async (state) => {
          // Phase 1: Immediate placeholder
          state.status = "placeholder";
          state.data = { type: "placeholder", content: "Loading..." };

          // Phase 2: Cached data (simulate)
          await new Promise((resolve) => setTimeout(resolve, 10));
          state.status = "cached";
          state.data = { type: "cached", content: "Cached content" };

          // Phase 3: Fresh data
          await new Promise((resolve) => setTimeout(resolve, 10));
          state.status = "fresh";
          state.data = { type: "fresh", content: "Fresh content" };

          return state.data;
        });
        return null;
      }

      function StatusDisplay() {
        const status = useStore(store, (s) => s.status);
        return <div data-testid="status">Status: {status}</div>;
      }

      function ContentDisplay() {
        const data = useStore(store, (s) => s.data);
        return <div data-testid="content">{data?.content || "No content"}</div>;
      }

      function App() {
        return (
          <div>
            <DataLoader />
            <StatusDisplay />
            <ContentDisplay />
          </div>
        );
      }

      render(<App />);

      // Should immediately show placeholder - no initial flicker
      expect(screen.getByTestId("status")).toHaveTextContent("Status: placeholder");
      expect(screen.getByTestId("content")).toHaveTextContent("Loading...");

      // Progress through enhancement phases
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("Status: cached");
        expect(screen.getByTestId("content")).toHaveTextContent("Cached content");
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("Status: fresh");
        expect(screen.getByTestId("content")).toHaveTextContent("Fresh content");
      });
    });

    test("should prevent useStore components from suspending when immediate values are provided", () => {
      const store = proxy({
        user: null,
        theme: "light",
      });

      function Initializer() {
        // Provide immediate values to prevent suspension
        useInitSync(store, (state) => {
          state.user = { name: "Immediate User" };
          state.theme = "dark";
          // No async operations
        });
        return null;
      }

      function UserDisplay() {
        const user = useStore(store, (s) => s.user);
        return <div data-testid="user-display">{user?.name || "No user"}</div>;
      }

      function ThemeDisplay() {
        const theme = useStore(store, (s) => s.theme);
        return <div data-testid="theme-display">Theme: {theme}</div>;
      }

      function App() {
        return (
          <div>
            <Initializer />
            {/* These should not suspend because immediate values are provided */}
            <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
              <UserDisplay />
              <ThemeDisplay />
            </Suspense>
          </div>
        );
      }

      render(<App />);

      // Should render immediately without showing suspense fallback
      expect(screen.getByTestId("user-display")).toHaveTextContent("Immediate User");
      expect(screen.getByTestId("theme-display")).toHaveTextContent("Theme: dark");
      expect(screen.queryByTestId("suspense-fallback")).toBeNull();
    });
  });
});
