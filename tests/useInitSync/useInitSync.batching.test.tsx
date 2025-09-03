import { render, screen, waitFor } from "@testing-library/react";
import { proxy, useStore, useInitSync } from "../../src/main";
import { vi } from "vitest";

describe("useInitSync Batching Tests", () => {
  describe("Multiple state changes batching", () => {
    test("should batch multiple synchronous state changes into single render", () => {
      let renderCount = 0;

      const store = proxy({
        a: 0,
        b: 0,
        c: 0,
        d: 0,
      });

      function TestComponent() {
        renderCount++;

        useInitSync(store, (state) => {
          state.a = 1;
          state.b = 2;
          state.c = 3;
          state.d = 4;
        });

        const data = useStore(store, (s) => s);
        return <div data-testid="result">{JSON.stringify(data)}</div>;
      }

      render(<TestComponent />);

      expect(screen.getByTestId("result")).toHaveTextContent(
        '{"a":1,"b":2,"c":3,"d":4}'
      );

      // TDD Red: This should fail initially - target 3 renders or less
      expect(renderCount).toBeLessThan(3);
    });

    test("should batch asynchronous state changes with await", async () => {
      let renderCount = 0;

      const store = proxy({
        status: "initial",
        data: null as any,
        loading: true,
        error: null,
      });

      function TestComponent() {
        renderCount++;

        useInitSync(store, async (state) => {
          // Pre-await changes
          state.loading = true;
          state.status = "fetching";
          state.data = { placeholder: "Loading..." };

          await new Promise((resolve) => setTimeout(resolve, 50));

          // Post-await changes - these should also be batched
          state.data = { content: "Real data", items: [1, 2, 3] };
          state.status = "loaded";
          state.loading = false;
        });

        const data = useStore(store, (s) => s);
        return (
          <div>
            <div data-testid="status">{data.status}</div>
            <div data-testid="loading">{data.loading ? "loading" : "ready"}</div>
            <div data-testid="content">
              {JSON.stringify(data.data)}
            </div>
          </div>
        );
      }

      render(<TestComponent />);

      // Only verify final state
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("loaded");
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
        expect(screen.getByTestId("content")).toHaveTextContent(
          '{"content":"Real data","items":[1,2,3]}'
        );
      });

      // TDD Red: This should fail initially - target < 5 renders
      expect(renderCount).toBeLessThan(5);
    });
  });

  describe("Render count verification", () => {
    test("should minimize renders in complex async scenarios", async () => {
      let renderCount = 0;

      const store = proxy({
        user: null as any,
        settings: null as any,
        notifications: [] as any[],
        loading: true,
        initialized: false,
      });

      function TestComponent() {
        renderCount++;

        useInitSync(store, async (state) => {
          // Stage 1: Initial setup
          state.loading = true;
          state.user = { name: "Loading...", id: 0 };
          state.settings = { theme: "loading" };

          // Stage 2: Simulate API calls
          const [userData, settingsData, notificationData] = await Promise.all([
            new Promise((resolve) =>
              setTimeout(() => resolve({ name: "John", id: 123 }), 30)
            ),
            new Promise((resolve) =>
              setTimeout(() => resolve({ theme: "dark", lang: "en" }), 40)
            ),
            new Promise((resolve) =>
              setTimeout(() => resolve([{ id: 1, msg: "Welcome" }]), 50)
            ),
          ]);

          // Stage 3: Final updates
          state.user = userData;
          state.settings = settingsData;
          state.notifications = notificationData;
          state.loading = false;
          state.initialized = true;
        });

        const data = useStore(store, (s) => s);
        return (
          <div>
            <div data-testid="user">{JSON.stringify(data.user)}</div>
            <div data-testid="settings">{JSON.stringify(data.settings)}</div>
            <div data-testid="notifications">
              {data.notifications.length} notifications
            </div>
            <div data-testid="status">
              {data.loading ? "loading" : "ready"}
            </div>
            <div data-testid="initialized">{data.initialized.toString()}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Wait for all async operations to complete
      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent(
          '{"name":"John","id":123}'
        );
        expect(screen.getByTestId("settings")).toHaveTextContent(
          '{"theme":"dark","lang":"en"}'
        );
        expect(screen.getByTestId("notifications")).toHaveTextContent(
          "1 notifications"
        );
        expect(screen.getByTestId("status")).toHaveTextContent("ready");
        expect(screen.getByTestId("initialized")).toHaveTextContent("true");
      });

      // TDD Red: This should fail initially - target < 4 renders
      expect(renderCount).toBeLessThan(4);
    });

    test("should batch state changes across await boundaries", async () => {
      let renderCount = 0;

      const store = proxy({
        phase: "init",
        step1: null as any,
        step2: null as any,
        step3: null as any,
        final: false,
      });

      function TestComponent() {
        renderCount++;

        useInitSync(store, async (state) => {
          // Pre-await batch
          state.phase = "starting";
          state.step1 = { status: "pending" };

          await new Promise((resolve) => setTimeout(resolve, 20));

          // Mid-await batch
          state.phase = "middle";
          state.step1 = { status: "completed", data: "step1-data" };
          state.step2 = { status: "pending" };

          await new Promise((resolve) => setTimeout(resolve, 20));

          // Post-await batch
          state.phase = "finishing";
          state.step2 = { status: "completed", data: "step2-data" };
          state.step3 = { status: "completed", data: "step3-data" };
          state.final = true;
        });

        const data = useStore(store, (s) => s);
        return (
          <div>
            <div data-testid="phase">{data.phase}</div>
            <div data-testid="final">{data.final.toString()}</div>
            <div data-testid="steps">
              {data.step3?.status || "waiting"}
            </div>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("phase")).toHaveTextContent("finishing");
        expect(screen.getByTestId("final")).toHaveTextContent("true");
        expect(screen.getByTestId("steps")).toHaveTextContent("completed");
      });

      // TDD Red: This should fail initially - target < 4 renders for multiple await boundaries
      expect(renderCount).toBeLessThan(4);
    });
  });

  describe("Performance edge cases", () => {
    test("should handle rapid state changes efficiently", async () => {
      let renderCount = 0;

      const store = proxy({
        counter: 0,
        items: [] as number[],
        status: "idle",
      });

      function TestComponent() {
        renderCount++;

        useInitSync(store, async (state) => {
          // Rapid synchronous changes
          for (let i = 0; i < 10; i++) {
            state.counter = i;
            state.items = [...state.items, i];
          }

          state.status = "processing";

          await new Promise((resolve) => setTimeout(resolve, 10));

          // More rapid changes after await
          for (let i = 10; i < 20; i++) {
            state.counter = i;
            state.items = [...state.items, i];
          }

          state.status = "completed";
        });

        const data = useStore(store, (s) => s);
        return (
          <div>
            <div data-testid="counter">{data.counter}</div>
            <div data-testid="items-count">{data.items.length}</div>
            <div data-testid="status">{data.status}</div>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("counter")).toHaveTextContent("19");
        expect(screen.getByTestId("items-count")).toHaveTextContent("20");
        expect(screen.getByTestId("status")).toHaveTextContent("completed");
      });

      // TDD Red: Even with rapid changes, should batch efficiently - target < 4 renders
      expect(renderCount).toBeLessThan(4);
    });

    test("should batch nested object and array updates", async () => {
      let renderCount = 0;

      const store = proxy({
        user: { profile: { name: "", email: "" }, preferences: { theme: "" } },
        items: [] as any[],
        meta: { lastUpdated: "", version: 0 },
      });

      function TestComponent() {
        renderCount++;

        useInitSync(store, async (state) => {
          // Nested object updates
          state.user.profile.name = "John";
          state.user.profile.email = "john@example.com";
          state.user.preferences.theme = "dark";

          // Array updates
          state.items.push({ id: 1, name: "Item 1" });
          state.items.push({ id: 2, name: "Item 2" });

          // Meta updates
          state.meta.lastUpdated = "2024-01-01";
          state.meta.version = 1;

          await new Promise((resolve) => setTimeout(resolve, 10));

          // More updates after await
          state.user.profile.name = "John Doe";
          state.items.push({ id: 3, name: "Item 3" });
          state.meta.version = 2;
        });

        const data = useStore(store, (s) => s);
        return (
          <div>
            <div data-testid="user-name">{data.user.profile.name}</div>
            <div data-testid="items-count">{data.items.length}</div>
            <div data-testid="version">{data.meta.version}</div>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("John Doe");
        expect(screen.getByTestId("items-count")).toHaveTextContent("3");
        expect(screen.getByTestId("version")).toHaveTextContent("2");
      });

      // TDD Red: Nested updates should also batch efficiently - target < 4 renders
      expect(renderCount).toBeLessThan(4);
    });
  });
});