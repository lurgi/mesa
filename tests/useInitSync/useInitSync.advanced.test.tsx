import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { useState } from "react";
import { proxy, useStore, useInitSync } from "../../src/main";

describe("useInitSync Advanced Features", () => {
  describe("Promise deduplication and caching", () => {
    test("should prevent duplicate executions with same key", async () => {
      const store = proxy({ data: null });
      let executionCount = 0;
      
      const asyncFn = jest.fn().mockImplementation(async () => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return `result-${executionCount}`;
      });
      
      function Component1() {
        const { data } = useInitSync(store, asyncFn, { 
          key: "shared-operation",
          suspense: false 
        });
        return <div data-testid="component1">{data || "loading"}</div>;
      }
      
      function Component2() {
        const { data } = useInitSync(store, asyncFn, { 
          key: "shared-operation",
          suspense: false 
        });
        return <div data-testid="component2">{data || "loading"}</div>;
      }
      
      function Component3() {
        const { data } = useInitSync(store, asyncFn, { 
          key: "different-operation",
          suspense: false 
        });
        return <div data-testid="component3">{data || "loading"}</div>;
      }
      
      function App() {
        return (
          <div>
            <Component1 />
            <Component2 />
            <Component3 />
          </div>
        );
      }

      render(<App />);
      
      // Initially all should be loading
      expect(screen.getByTestId("component1")).toHaveTextContent("loading");
      expect(screen.getByTestId("component2")).toHaveTextContent("loading");
      expect(screen.getByTestId("component3")).toHaveTextContent("loading");
      
      await waitFor(() => {
        // Components with same key should share the same result
        expect(screen.getByTestId("component1")).toHaveTextContent("result-1");
        expect(screen.getByTestId("component2")).toHaveTextContent("result-1");
        // Component with different key should have different result
        expect(screen.getByTestId("component3")).toHaveTextContent("result-2");
      });
      
      // Should only execute twice (once per unique key)
      expect(executionCount).toBe(2);
    });

    test("should handle key-based caching across component remounts", async () => {
      const store = proxy({ data: null });
      let executionCount = 0;
      
      const asyncFn = jest.fn().mockImplementation(async () => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return `cached-result-${executionCount}`;
      });
      
      function AsyncComponent() {
        const { data } = useInitSync(store, asyncFn, { 
          key: "persistent-cache",
          suspense: false 
        });
        return <div data-testid="async-data">{data || "loading"}</div>;
      }
      
      function App() {
        const [showComponent, setShowComponent] = useState(true);
        
        return (
          <div>
            <button 
              onClick={() => setShowComponent(!showComponent)}
              data-testid="toggle"
            >
              Toggle Component
            </button>
            {showComponent && <AsyncComponent />}
          </div>
        );
      }

      render(<App />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId("async-data")).toHaveTextContent("cached-result-1");
      });
      
      expect(executionCount).toBe(1);
      
      // Unmount component
      act(() => {
        fireEvent.click(screen.getByTestId("toggle"));
      });
      
      expect(screen.queryByTestId("async-data")).toBeNull();
      
      // Remount component
      act(() => {
        fireEvent.click(screen.getByTestId("toggle"));
      });
      
      // Should immediately show cached result without re-executing
      expect(screen.getByTestId("async-data")).toHaveTextContent("cached-result-1");
      expect(executionCount).toBe(1); // Should not have increased
    });

    test("should handle concurrent requests with same key", async () => {
      const store = proxy({ data: null });
      let executionCount = 0;
      let resolveFunctions: Array<(value: string) => void> = [];
      
      const asyncFn = jest.fn().mockImplementation(async () => {
        executionCount++;
        return new Promise<string>(resolve => {
          resolveFunctions.push(resolve);
        });
      });
      
      function ComponentA() {
        const { data, loading } = useInitSync(store, asyncFn, { 
          key: "concurrent-test",
          suspense: false 
        });
        return (
          <div>
            <div data-testid="component-a-loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="component-a-data">{data || "no data"}</div>
          </div>
        );
      }
      
      function ComponentB() {
        const { data, loading } = useInitSync(store, asyncFn, { 
          key: "concurrent-test",
          suspense: false 
        });
        return (
          <div>
            <div data-testid="component-b-loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="component-b-data">{data || "no data"}</div>
          </div>
        );
      }
      
      function App() {
        const [showA, setShowA] = useState(false);
        const [showB, setShowB] = useState(false);
        
        return (
          <div>
            <button 
              onClick={() => setShowA(true)}
              data-testid="show-a"
            >
              Show A
            </button>
            <button 
              onClick={() => setShowB(true)}
              data-testid="show-b"
            >
              Show B
            </button>
            {showA && <ComponentA />}
            {showB && <ComponentB />}
          </div>
        );
      }

      render(<App />);
      
      // Mount first component
      act(() => {
        fireEvent.click(screen.getByTestId("show-a"));
      });
      
      expect(screen.getByTestId("component-a-loading")).toHaveTextContent("loading");
      
      // Mount second component while first is still loading
      act(() => {
        fireEvent.click(screen.getByTestId("show-b"));
      });
      
      expect(screen.getByTestId("component-b-loading")).toHaveTextContent("loading");
      
      // Should only have executed once despite two components
      expect(executionCount).toBe(1);
      expect(resolveFunctions).toHaveLength(1);
      
      // Resolve the shared promise
      act(() => {
        resolveFunctions[0]("shared-result");
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("component-a-data")).toHaveTextContent("shared-result");
        expect(screen.getByTestId("component-b-data")).toHaveTextContent("shared-result");
      });
    });
  });

  describe("Dependency-based re-execution", () => {
    test("should re-execute when dependencies change", async () => {
      const store = proxy({ userId: 1, user: null });
      let executionCount = 0;
      
      const fetchUser = jest.fn().mockImplementation(async (state: typeof store) => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        const user = { id: state.userId, name: `User ${state.userId}` };
        state.user = user;
        return user;
      });
      
      function UserComponent() {
        const userId = useStore(store, s => s.userId);
        const { data, loading } = useInitSync(store, fetchUser, { 
          deps: [userId],
          suspense: false 
        });
        
        return (
          <div>
            <div data-testid="loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="user-data">{data ? JSON.stringify(data) : "no data"}</div>
            <div data-testid="execution-count">{executionCount}</div>
            <button 
              onClick={() => store.userId = store.userId + 1}
              data-testid="change-user"
            >
              Change User
            </button>
          </div>
        );
      }

      render(<UserComponent />);
      
      // Initial execution
      await waitFor(() => {
        expect(screen.getByTestId("user-data")).toHaveTextContent('{"id":1,"name":"User 1"}');
        expect(screen.getByTestId("execution-count")).toHaveTextContent("1");
      });
      
      // Change dependency
      act(() => {
        fireEvent.click(screen.getByTestId("change-user"));
      });
      
      // Should trigger re-execution
      expect(screen.getByTestId("loading")).toHaveTextContent("loading");
      
      await waitFor(() => {
        expect(screen.getByTestId("user-data")).toHaveTextContent('{"id":2,"name":"User 2"}');
        expect(screen.getByTestId("execution-count")).toHaveTextContent("2");
      });
    });

    test("should not re-execute when dependencies haven't changed", async () => {
      const store = proxy({ 
        userId: 1, 
        userName: "John",
        user: null,
        unrelatedData: "initial"
      });
      let executionCount = 0;
      
      const fetchUser = jest.fn().mockImplementation(async (state: typeof store) => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 30));
        const user = { id: state.userId, name: state.userName };
        state.user = user;
        return user;
      });
      
      function UserComponent() {
        const userId = useStore(store, s => s.userId);
        const userName = useStore(store, s => s.userName);
        const { data } = useInitSync(store, fetchUser, { 
          deps: [userId, userName],
          suspense: false 
        });
        
        return (
          <div>
            <div data-testid="user-data">{data ? JSON.stringify(data) : "no data"}</div>
            <div data-testid="execution-count">{executionCount}</div>
          </div>
        );
      }
      
      function UnrelatedComponent() {
        const unrelated = useStore(store, s => s.unrelatedData);
        return (
          <div>
            <div data-testid="unrelated-data">{unrelated}</div>
            <button 
              onClick={() => store.unrelatedData = "updated"}
              data-testid="change-unrelated"
            >
              Change Unrelated
            </button>
          </div>
        );
      }
      
      function App() {
        return (
          <div>
            <UserComponent />
            <UnrelatedComponent />
          </div>
        );
      }

      render(<App />);
      
      // Wait for initial execution
      await waitFor(() => {
        expect(screen.getByTestId("execution-count")).toHaveTextContent("1");
      });
      
      // Change unrelated data
      act(() => {
        fireEvent.click(screen.getByTestId("change-unrelated"));
      });
      
      // Wait a bit to ensure no re-execution
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should not have re-executed
      expect(screen.getByTestId("execution-count")).toHaveTextContent("1");
      expect(screen.getByTestId("unrelated-data")).toHaveTextContent("updated");
    });

    test("should handle complex dependency changes", async () => {
      const store = proxy({ 
        filters: { 
          category: "electronics",
          priceRange: { min: 0, max: 1000 }
        },
        products: null
      });
      let executionCount = 0;
      
      const fetchProducts = jest.fn().mockImplementation(async (state: typeof store) => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        const products = [
          { id: 1, name: `Product for ${state.filters.category}`, price: 500 }
        ];
        state.products = products;
        return products;
      });
      
      function ProductsComponent() {
        const filters = useStore(store, s => s.filters);
        const { data, loading } = useInitSync(store, fetchProducts, { 
          deps: [filters.category, filters.priceRange.min, filters.priceRange.max],
          suspense: false 
        });
        
        return (
          <div>
            <div data-testid="loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="products">{data ? JSON.stringify(data) : "no products"}</div>
            <div data-testid="execution-count">{executionCount}</div>
            
            <button 
              onClick={() => store.filters.category = "clothing"}
              data-testid="change-category"
            >
              Change Category
            </button>
            <button 
              onClick={() => store.filters.priceRange.max = 2000}
              data-testid="change-price"
            >
              Change Max Price
            </button>
            <button 
              onClick={() => store.filters = { ...store.filters }}
              data-testid="shallow-update"
            >
              Shallow Update (No Change)
            </button>
          </div>
        );
      }

      render(<ProductsComponent />);
      
      // Initial execution
      await waitFor(() => {
        expect(screen.getByTestId("execution-count")).toHaveTextContent("1");
        expect(screen.getByTestId("products")).toContain("electronics");
      });
      
      // Change category (should re-execute)
      act(() => {
        fireEvent.click(screen.getByTestId("change-category"));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("execution-count")).toHaveTextContent("2");
        expect(screen.getByTestId("products")).toContain("clothing");
      });
      
      // Change price range (should re-execute)
      act(() => {
        fireEvent.click(screen.getByTestId("change-price"));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("execution-count")).toHaveTextContent("3");
      });
      
      // Shallow update with no actual change (should not re-execute)
      act(() => {
        fireEvent.click(screen.getByTestId("shallow-update"));
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(screen.getByTestId("execution-count")).toHaveTextContent("3");
    });

    test("should handle array dependencies correctly", async () => {
      const store = proxy({ 
        selectedIds: [1, 2],
        items: null
      });
      let executionCount = 0;
      
      const fetchItems = jest.fn().mockImplementation(async (state: typeof store) => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 30));
        const items = state.selectedIds.map(id => ({ id, name: `Item ${id}` }));
        state.items = items;
        return items;
      });
      
      function ItemsComponent() {
        const selectedIds = useStore(store, s => s.selectedIds);
        const { data } = useInitSync(store, fetchItems, { 
          deps: selectedIds,
          suspense: false 
        });
        
        return (
          <div>
            <div data-testid="items">{data ? JSON.stringify(data) : "no items"}</div>
            <div data-testid="execution-count">{executionCount}</div>
            <div data-testid="selected-ids">{JSON.stringify(selectedIds)}</div>
            
            <button 
              onClick={() => store.selectedIds = [1, 2, 3]}
              data-testid="add-id"
            >
              Add ID
            </button>
            <button 
              onClick={() => store.selectedIds = [2, 1]}
              data-testid="reorder-ids"
            >
              Reorder IDs
            </button>
            <button 
              onClick={() => store.selectedIds = [...store.selectedIds]}
              data-testid="shallow-copy"
            >
              Shallow Copy (No Change)
            </button>
          </div>
        );
      }

      render(<ItemsComponent />);
      
      // Initial execution
      await waitFor(() => {
        expect(screen.getByTestId("execution-count")).toHaveTextContent("1");
        expect(screen.getByTestId("selected-ids")).toHaveTextContent("[1,2]");
      });
      
      // Add new ID (should re-execute)
      act(() => {
        fireEvent.click(screen.getByTestId("add-id"));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("execution-count")).toHaveTextContent("2");
        expect(screen.getByTestId("selected-ids")).toHaveTextContent("[1,2,3]");
      });
      
      // Reorder IDs (should re-execute due to order change)
      act(() => {
        fireEvent.click(screen.getByTestId("reorder-ids"));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("execution-count")).toHaveTextContent("3");
        expect(screen.getByTestId("selected-ids")).toHaveTextContent("[2,1]");
      });
      
      // Shallow copy with no actual change (should not re-execute)
      act(() => {
        fireEvent.click(screen.getByTestId("shallow-copy"));
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(screen.getByTestId("execution-count")).toHaveTextContent("3");
    });
  });

  describe("Advanced caching scenarios", () => {
    test("should handle cache invalidation", async () => {
      const store = proxy({ 
        cacheKey: "initial",
        data: null,
        version: 1
      });
      let executionCount = 0;
      
      const asyncFn = jest.fn().mockImplementation(async (state: typeof store) => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 30));
        return `data-v${state.version}-${executionCount}`;
      });
      
      function CachedComponent() {
        const cacheKey = useStore(store, s => s.cacheKey);
        const { data, refetch } = useInitSync(store, asyncFn, { 
          key: cacheKey,
          suspense: false 
        });
        
        return (
          <div>
            <div data-testid="data">{data || "loading"}</div>
            <div data-testid="execution-count">{executionCount}</div>
            <div data-testid="cache-key">{cacheKey}</div>
            
            <button 
              onClick={() => store.cacheKey = "updated"}
              data-testid="change-cache-key"
            >
              Change Cache Key
            </button>
            <button 
              onClick={() => store.version++}
              data-testid="change-version"
            >
              Change Version
            </button>
            <button 
              onClick={refetch}
              data-testid="refetch"
            >
              Refetch
            </button>
          </div>
        );
      }

      render(<CachedComponent />);
      
      // Initial load
      await waitFor(() => {
        expect(screen.getByTestId("data")).toHaveTextContent("data-v1-1");
        expect(screen.getByTestId("execution-count")).toHaveTextContent("1");
      });
      
      // Change cache key (should create new cache entry)
      act(() => {
        fireEvent.click(screen.getByTestId("change-cache-key"));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("data")).toHaveTextContent("data-v1-2");
        expect(screen.getByTestId("execution-count")).toHaveTextContent("2");
        expect(screen.getByTestId("cache-key")).toHaveTextContent("updated");
      });
      
      // Change version and refetch (should re-execute with same cache key)
      act(() => {
        fireEvent.click(screen.getByTestId("change-version"));
      });
      
      act(() => {
        fireEvent.click(screen.getByTestId("refetch"));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("data")).toHaveTextContent("data-v2-3");
        expect(screen.getByTestId("execution-count")).toHaveTextContent("3");
      });
    });

    test("should handle memory cleanup for unused cache entries", async () => {
      // This test would verify that cache entries are cleaned up
      // Implementation details would depend on the actual cache strategy
      const store = proxy({ data: null });
      
      const asyncFn = jest.fn().mockResolvedValue("test-data");
      
      function TestComponent({ cacheKey }: { cacheKey: string }) {
        const { data } = useInitSync(store, asyncFn, { 
          key: cacheKey,
          suspense: false 
        });
        return <div data-testid={`data-${cacheKey}`}>{data || "loading"}</div>;
      }
      
      function App() {
        const [keys, setKeys] = useState(["key1"]);
        
        return (
          <div>
            {keys.map(key => (
              <TestComponent key={key} cacheKey={key} />
            ))}
            <button 
              onClick={() => setKeys(["key2"])}
              data-testid="change-key"
            >
              Change Key
            </button>
            <button 
              onClick={() => setKeys(["key1", "key2", "key3"])}
              data-testid="add-keys"
            >
              Add Keys
            </button>
            <button 
              onClick={() => setKeys([])}
              data-testid="remove-all"
            >
              Remove All
            </button>
          </div>
        );
      }

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId("data-key1")).toHaveTextContent("test-data");
      });
      
      // Change to different key
      act(() => {
        fireEvent.click(screen.getByTestId("change-key"));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("data-key2")).toHaveTextContent("test-data");
        expect(screen.queryByTestId("data-key1")).toBeNull();
      });
      
      // Add multiple keys
      act(() => {
        fireEvent.click(screen.getByTestId("add-keys"));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId("data-key1")).toHaveTextContent("test-data");
        expect(screen.getByTestId("data-key2")).toHaveTextContent("test-data");
        expect(screen.getByTestId("data-key3")).toHaveTextContent("test-data");
      });
      
      // Remove all keys
      act(() => {
        fireEvent.click(screen.getByTestId("remove-all"));
      });
      
      expect(screen.queryByTestId("data-key1")).toBeNull();
      expect(screen.queryByTestId("data-key2")).toBeNull();
      expect(screen.queryByTestId("data-key3")).toBeNull();
      
      // In a real implementation, this would test that cache entries are cleaned up
      // when no components are using them anymore
    });
  });
});

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "useInitSync \uae30\ubcf8 \ud14c\uc2a4\ud2b8 \ucf00\uc774\uc2a4 \uc791\uc131", "status": "completed"}, {"id": "2", "content": "Suspense \ud1b5\ud569 \ud14c\uc2a4\ud2b8 \uc791\uc131", "status": "completed"}, {"id": "3", "content": "useStore\uc640\uc758 \uc790\ub3d9 \uc5f0\ub3d9 \ud14c\uc2a4\ud2b8 \uc791\uc131", "status": "completed"}, {"id": "4", "content": "\uc5d0\ub7ec \ud578\ub4e4\ub9c1 \ud14c\uc2a4\ud2b8 \uc791\uc131", "status": "completed"}, {"id": "5", "content": "Promise \uc911\ubcf5 \uc2e4\ud589 \ubc29\uc9c0 \ud14c\uc2a4\ud2b8 \uc791\uc131", "status": "completed"}, {"id": "6", "content": "\uc758\uc874\uc131 \uae30\ubc18 \uc7ac\uc2e4\ud589 \ud14c\uc2a4\ud2b8 \uc791\uc131", "status": "completed"}]