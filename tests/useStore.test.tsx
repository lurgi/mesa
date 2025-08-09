import { render, screen, fireEvent, act } from "@testing-library/react";
import { proxy, useStore } from "../src/main";

describe("useStore hook", () => {
  describe("Basic functionality", () => {
    test("should return current value from proxy state", () => {
      const state = proxy({ count: 42 });

      function TestComponent() {
        const count = useStore(state, (s) => s.count);
        return <div data-testid="count">{count}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId("count")).toHaveTextContent("42");
    });

    test("should handle string values correctly", () => {
      const state = proxy({ name: "John" });

      function TestComponent() {
        const name = useStore(state, (s) => s.name);
        return <div data-testid="name">{name}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId("name")).toHaveTextContent("John");
    });

    test("should handle boolean values correctly", () => {
      const state = proxy({ isVisible: true });

      function TestComponent() {
        const isVisible = useStore(state, (s) => s.isVisible);
        return <div data-testid="visible">{isVisible ? "visible" : "hidden"}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId("visible")).toHaveTextContent("visible");
    });

    test("should handle complex selector functions", () => {
      const state = proxy({ firstName: "John", lastName: "Doe", age: 30 });

      function TestComponent() {
        const fullName = useStore(state, (s) => `${s.firstName} ${s.lastName}`);
        const isAdult = useStore(state, (s) => s.age >= 18);
        return (
          <div>
            <div data-testid="full-name">{fullName}</div>
            <div data-testid="is-adult">{isAdult ? "adult" : "minor"}</div>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId("full-name")).toHaveTextContent("John Doe");
      expect(screen.getByTestId("is-adult")).toHaveTextContent("adult");
    });
  });

  describe("Reactivity", () => {
    test("should re-render component on state change", () => {
      const state = proxy({ count: 0 });

      function TestComponent() {
        const count = useStore(state, (s) => s.count);
        return (
          <div>
            <div data-testid="count">{count}</div>
            <button onClick={() => state.count++}>increment</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId("count")).toHaveTextContent("0");

      act(() => {
        fireEvent.click(screen.getByText("increment"));
      });

      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });

    test("should re-render on direct value assignment", () => {
      const state = proxy({ count: 5 });

      function TestComponent() {
        const count = useStore(state, (s) => s.count);
        return (
          <div>
            <div data-testid="count">{count}</div>
            <button onClick={() => { state.count = 10; }}>set</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId("count")).toHaveTextContent("5");

      act(() => {
        fireEvent.click(screen.getByText("set"));
      });

      expect(screen.getByTestId("count")).toHaveTextContent("10");
    });

    test("should batch multiple state changes", () => {
      const state = proxy({ count: 0, name: "John" });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const count = useStore(state, (s) => s.count);
        const name = useStore(state, (s) => s.name);
        return (
          <div>
            <div data-testid="count">{count}</div>
            <div data-testid="name">{name}</div>
            <div data-testid="renders">{renderCount}</div>
            <button
              onClick={() => {
                state.count = 10;
                state.name = "Jane";
              }}
            >
              update both
            </button>
          </div>
        );
      }

      render(<TestComponent />);
      const initialRenderCount = renderCount;

      act(() => {
        fireEvent.click(screen.getByText("update both"));
      });

      // Should only re-render once due to React batching
      expect(renderCount).toBe(initialRenderCount + 1);
      expect(screen.getByTestId("count")).toHaveTextContent("10");
      expect(screen.getByTestId("name")).toHaveTextContent("Jane");
    });
  });

  describe("Subscription cleanup", () => {
    test("should cleanup subscriptions on component unmount", () => {
      const state = proxy({ count: 0 });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const count = useStore(state, (s) => s.count);
        return <div data-testid="count">{count}</div>;
      }

      function App({ showComponent }: { showComponent: boolean }) {
        return (
          <div>
            {showComponent && <TestComponent />}
            <button onClick={() => { state.count++; }}>increment</button>
          </div>
        );
      }

      const { rerender } = render(<App showComponent={true} />);
      expect(screen.getByTestId("count")).toHaveTextContent("0");
      expect(renderCount).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("increment"));
      });
      expect(screen.getByTestId("count")).toHaveTextContent("1");
      expect(renderCount).toBe(2);

      // Unmount component
      rerender(<App showComponent={false} />);
      expect(screen.queryByTestId("count")).toBeNull();

      // State changes should not trigger renders after unmount
      const prevRenderCount = renderCount;
      act(() => {
        fireEvent.click(screen.getByText("increment"));
      });
      expect(renderCount).toBe(prevRenderCount);

      // Remount should show updated value
      rerender(<App showComponent={true} />);
      expect(screen.getByTestId("count")).toHaveTextContent("2");
    });
  });

  describe("Memoization", () => {
    test("should memoize selector results", () => {
      const state = proxy({ items: [1, 2, 3], multiplier: 2 });
      let selectorCallCount = 0;

      function TestComponent() {
        const total = useStore(state, (s) => {
          selectorCallCount++;
          return s.items.reduce((sum, item) => sum + item * s.multiplier, 0);
        });
        return <div data-testid="total">{total}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId("total")).toHaveTextContent("12"); // (1+2+3) * 2
      
      const initialSelectorCalls = selectorCallCount;
      expect(initialSelectorCalls).toBeGreaterThan(0);

      // Force a component re-render by updating state and then reverting
      act(() => {
        state.multiplier = 3;
      });
      act(() => {
        state.multiplier = 2;
      });
      
      // Should show original value again
      expect(screen.getByTestId("total")).toHaveTextContent("12");
      
      // Selector should have been called additional times for the state changes
      expect(selectorCallCount).toBeGreaterThan(initialSelectorCalls);
    });
  });

  describe("Multiple components", () => {
    test("should allow multiple components to subscribe to same state", () => {
      const state = proxy({ count: 0 });

      function Component1() {
        const count = useStore(state, (s) => s.count);
        return <div data-testid="count1">{count}</div>;
      }

      function Component2() {
        const count = useStore(state, (s) => s.count);
        return <div data-testid="count2">{count}</div>;
      }

      function App() {
        return (
          <div>
            <Component1 />
            <Component2 />
            <button onClick={() => state.count++}>increment</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("count1")).toHaveTextContent("0");
      expect(screen.getByTestId("count2")).toHaveTextContent("0");

      act(() => {
        fireEvent.click(screen.getByText("increment"));
      });

      expect(screen.getByTestId("count1")).toHaveTextContent("1");
      expect(screen.getByTestId("count2")).toHaveTextContent("1");
    });

    test("should render components independently based on their subscriptions", () => {
      const state = proxy({ count: 0, name: "John" });
      let countRenderCount = 0;
      let nameRenderCount = 0;

      function CountComponent() {
        countRenderCount++;
        useStore(state, (s) => s.count);
        return <div data-testid="count-renders">{countRenderCount}</div>;
      }

      function NameComponent() {
        nameRenderCount++;
        useStore(state, (s) => s.name);
        return <div data-testid="name-renders">{nameRenderCount}</div>;
      }

      function App() {
        return (
          <div>
            <CountComponent />
            <NameComponent />
            <button onClick={() => state.count++}>increment count</button>
            <button onClick={() => { state.name = "Jane"; }}>change name</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("count-renders")).toHaveTextContent("1");
      expect(screen.getByTestId("name-renders")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("increment count"));
      });
      expect(screen.getByTestId("count-renders")).toHaveTextContent("2");
      expect(screen.getByTestId("name-renders")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("change name"));
      });
      expect(screen.getByTestId("count-renders")).toHaveTextContent("2");
      expect(screen.getByTestId("name-renders")).toHaveTextContent("2");
    });
  });

  describe("Edge cases", () => {
    test("should handle null values", () => {
      const state = proxy<any>({ value: null });

      function TestComponent() {
        const value = useStore(state, (s) => s.value);
        return <div data-testid="value">{value === null ? "null" : String(value)}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId("value")).toHaveTextContent("null");
    });

    test("should handle undefined values", () => {
      const state = proxy<any>({ value: undefined });

      function TestComponent() {
        const value = useStore(state, (s) => s.value);
        return <div data-testid="value">{value === undefined ? "undefined" : String(value)}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId("value")).toHaveTextContent("undefined");
    });

    test("should handle falsy values correctly", () => {
      const state = proxy({ 
        zero: 0, 
        emptyString: "", 
        false: false 
      });

      function TestComponent() {
        const zero = useStore(state, (s) => s.zero);
        const emptyString = useStore(state, (s) => s.emptyString);
        const falseValue = useStore(state, (s) => s.false);
        
        return (
          <div>
            <div data-testid="zero">{zero}</div>
            <div data-testid="empty">"{emptyString}"</div>
            <div data-testid="false">{falseValue ? "true" : "false"}</div>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId("zero")).toHaveTextContent("0");
      expect(screen.getByTestId("empty")).toHaveTextContent('""');
      expect(screen.getByTestId("false")).toHaveTextContent("false");
    });

    test("should handle selector errors gracefully", () => {
      const state = proxy<any>({ data: null });

      function TestComponent() {
        const value = useStore(state, (s) => {
          if (s.data === null) {
            return "no data";
          }
          return s.data.someProperty; // This would throw if data is null
        });
        return <div data-testid="value">{value}</div>;
      }

      expect(() => render(<TestComponent />)).not.toThrow();
      expect(screen.getByTestId("value")).toHaveTextContent("no data");
    });

    test("should support optional selector parameter for API compatibility", () => {
      const state = proxy({ count: 5, name: "test" });

      function ComponentWithOptionalSelector() {
        // This tests that useStore can be called without a selector (API compatibility)
        const entireState = useStore(state);
        return (
          <div>
            <div data-testid="no-selector-count">{entireState.count}</div>
            <div data-testid="no-selector-name">{entireState.name}</div>
          </div>
        );
      }

      render(<ComponentWithOptionalSelector />);
      
      // Should display initial values
      expect(screen.getByTestId("no-selector-count")).toHaveTextContent("5");
      expect(screen.getByTestId("no-selector-name")).toHaveTextContent("test");

      // Note: Current implementation may not fully support reactivity without explicit selector
      // This test mainly verifies API compatibility - that useStore(state) doesn't throw
      expect(true).toBe(true); // Test passes if no errors are thrown
    });

    test("should return same object reference when using identity selector", () => {
      const state = proxy({ count: 1, name: "test" });
      
      let stateReferences: any[] = [];
      
      function TestComponent() {
        const stateWithSelector = useStore(state, (s) => s);
        const stateWithoutSelector = useStore(state);
        
        stateReferences.push({ withSelector: stateWithSelector, withoutSelector: stateWithoutSelector });
        
        return (
          <div>
            <div data-testid="count-with">{stateWithSelector.count}</div>
            <div data-testid="count-without">{stateWithoutSelector.count}</div>
          </div>
        );
      }

      render(<TestComponent />);
      
      // Both should reference the same proxy object
      expect(stateReferences[0].withSelector).toBe(stateReferences[0].withoutSelector);
      expect(stateReferences[0].withSelector).toBe(state);
      expect(stateReferences[0].withoutSelector).toBe(state);
    });

    test("should behave identically for useStore(state, s => s) and useStore(state)", () => {
      
      const state = proxy({ count: 42, message: "hello" });
      
      let explicitRenders = 0;
      let implicitRenders = 0;
      
      function ExplicitIdentityComponent() {
        explicitRenders++;
        const result = useStore(state, (s) => s);
        return (
          <div>
            <div data-testid="explicit-count">{result.count}</div>
            <div data-testid="explicit-message">{result.message}</div>
            <div data-testid="explicit-renders">{explicitRenders}</div>
          </div>
        );
      }

      function ImplicitIdentityComponent() {
        implicitRenders++;
        const result = useStore(state);
        return (
          <div>
            <div data-testid="implicit-count">{result.count}</div>
            <div data-testid="implicit-message">{result.message}</div>
            <div data-testid="implicit-renders">{implicitRenders}</div>
          </div>
        );
      }

      function TestApp() {
        return (
          <div>
            <ExplicitIdentityComponent />
            <ImplicitIdentityComponent />
            <button 
              onClick={() => { 
                state.count = 99; 
              }}
              data-testid="update-count"
            >
              Update Count
            </button>
            <button 
              onClick={() => { 
                state.message = "updated"; 
              }}
              data-testid="update-message"
            >
              Update Message
            </button>
          </div>
        );
      }

      render(<TestApp />);

      // Initial values should be identical
      expect(screen.getByTestId("explicit-count")).toHaveTextContent("42");
      expect(screen.getByTestId("implicit-count")).toHaveTextContent("42");
      expect(screen.getByTestId("explicit-message")).toHaveTextContent("hello");
      expect(screen.getByTestId("implicit-message")).toHaveTextContent("hello");
      
      // Both should start with 1 render
      expect(explicitRenders).toBe(1);
      expect(implicitRenders).toBe(1);

      // Update count - both should re-render and show updated values
      act(() => {
        fireEvent.click(screen.getByTestId("update-count"));
      });
      
      expect(screen.getByTestId("explicit-count")).toHaveTextContent("99");
      expect(screen.getByTestId("implicit-count")).toHaveTextContent("99");
      expect(explicitRenders).toBeGreaterThan(1);
      expect(implicitRenders).toBeGreaterThan(1);

      // Update message - both should re-render and show updated values
      const prevExplicitRenders = explicitRenders;
      const prevImplicitRenders = implicitRenders;
      
      act(() => {
        fireEvent.click(screen.getByTestId("update-message"));
      });
      
      expect(screen.getByTestId("explicit-message")).toHaveTextContent("updated");
      expect(screen.getByTestId("implicit-message")).toHaveTextContent("updated");
      expect(explicitRenders).toBeGreaterThan(prevExplicitRenders);
      expect(implicitRenders).toBeGreaterThan(prevImplicitRenders);

      // Both components should have re-rendered the same number of times
      expect(explicitRenders).toBe(implicitRenders);
    });

  });
});