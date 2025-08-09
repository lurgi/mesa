import { render, screen, fireEvent, act } from "@testing-library/react";
import { proxy, useStore } from "../src/main";
import { useMemo } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  category: string;
}

describe("Array Fine-Grained Reactivity", () => {
  describe("Basic array operations", () => {
    test("should re-render when array items are added", () => {
      const state = proxy({ items: ["apple", "banana"] });
      
      let renders = 0;
      function ItemsList() {
        renders++;
        const items = useStore(state, (s) => s.items);
        return (
          <div>
            <div data-testid="items-count">{items.length}</div>
            <div data-testid="renders">{renders}</div>
            <button onClick={() => state.items.push("cherry")}>add item</button>
          </div>
        );
      }

      render(<ItemsList />);
      expect(screen.getByTestId("items-count")).toHaveTextContent("2");
      expect(renders).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("add item"));
      });

      expect(screen.getByTestId("items-count")).toHaveTextContent("3");
      expect(renders).toBeGreaterThan(1);
    });

    test("should re-render when array items are removed", () => {
      const state = proxy({ items: ["apple", "banana", "cherry"] });
      
      let renders = 0;
      function ItemsList() {
        renders++;
        const items = useStore(state, (s) => s.items);
        return (
          <div>
            <div data-testid="items-count">{items.length}</div>
            <div data-testid="renders">{renders}</div>
            <button onClick={() => state.items.pop()}>remove last</button>
          </div>
        );
      }

      render(<ItemsList />);
      expect(screen.getByTestId("items-count")).toHaveTextContent("3");
      expect(renders).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("remove last"));
      });

      expect(screen.getByTestId("items-count")).toHaveTextContent("2");
      expect(renders).toBeGreaterThan(1);
    });

    test("should re-render when array items are modified by index", () => {
      const state = proxy({ items: ["apple", "banana", "cherry"] });
      
      let renders = 0;
      function ItemsList() {
        renders++;
        const items = useStore(state, (s) => s.items);
        return (
          <div>
            <div data-testid="first-item">{items[0]}</div>
            <div data-testid="renders">{renders}</div>
            <button onClick={() => { state.items[0] = "orange"; }}>change first</button>
          </div>
        );
      }

      render(<ItemsList />);
      expect(screen.getByTestId("first-item")).toHaveTextContent("apple");
      expect(renders).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("change first"));
      });

      expect(screen.getByTestId("first-item")).toHaveTextContent("orange");
      expect(renders).toBeGreaterThan(1);
    });
  });

  describe("Array methods reactivity", () => {
    test("should handle push, pop, shift, unshift", () => {
      const state = proxy({ items: [2, 3] });
      
      let renders = 0;
      function ItemsList() {
        renders++;
        const items = useStore(state, (s) => s.items);
        return (
          <div>
            <div data-testid="items">{items.join(",")}</div>
            <div data-testid="renders">{renders}</div>
            <button onClick={() => state.items.push(4)}>push</button>
            <button onClick={() => state.items.pop()}>pop</button>
            <button onClick={() => state.items.unshift(1)}>unshift</button>
            <button onClick={() => state.items.shift()}>shift</button>
          </div>
        );
      }

      render(<ItemsList />);
      expect(screen.getByTestId("items")).toHaveTextContent("2,3");
      let initialRenders = renders;

      act(() => {
        fireEvent.click(screen.getByText("push"));
      });
      expect(screen.getByTestId("items")).toHaveTextContent("2,3,4");
      expect(renders).toBeGreaterThan(initialRenders);

      act(() => {
        fireEvent.click(screen.getByText("unshift"));
      });
      expect(screen.getByTestId("items")).toHaveTextContent("1,2,3,4");
      expect(renders).toBeGreaterThan(initialRenders + 1);

      act(() => {
        fireEvent.click(screen.getByText("shift"));
      });
      expect(screen.getByTestId("items")).toHaveTextContent("2,3,4");
      expect(renders).toBeGreaterThan(initialRenders + 2);

      act(() => {
        fireEvent.click(screen.getByText("pop"));
      });
      expect(screen.getByTestId("items")).toHaveTextContent("2,3");
      expect(renders).toBeGreaterThan(initialRenders + 3);
    });

    test("should handle splice operations", () => {
      const state = proxy({ items: [1, 2, 3, 4, 5] });
      
      let renders = 0;
      function ItemsList() {
        renders++;
        const items = useStore(state, (s) => s.items);
        return (
          <div>
            <div data-testid="items">{items.join(",")}</div>
            <div data-testid="renders">{renders}</div>
            <button onClick={() => state.items.splice(1, 2, 10, 11)}>splice</button>
          </div>
        );
      }

      render(<ItemsList />);
      expect(screen.getByTestId("items")).toHaveTextContent("1,2,3,4,5");
      const initialRenders = renders;

      act(() => {
        fireEvent.click(screen.getByText("splice"));
      });
      expect(screen.getByTestId("items")).toHaveTextContent("1,10,11,4,5");
      expect(renders).toBeGreaterThan(initialRenders);
    });

    test("should handle sort and reverse", () => {
      const state = proxy({ items: [3, 1, 4, 1, 5] });
      
      let renders = 0;
      function ItemsList() {
        renders++;
        const items = useStore(state, (s) => s.items);
        return (
          <div>
            <div data-testid="items">{items.join(",")}</div>
            <div data-testid="renders">{renders}</div>
            <button onClick={() => state.items.sort()}>sort</button>
            <button onClick={() => state.items.reverse()}>reverse</button>
          </div>
        );
      }

      render(<ItemsList />);
      expect(screen.getByTestId("items")).toHaveTextContent("3,1,4,1,5");
      const initialRenders = renders;

      act(() => {
        fireEvent.click(screen.getByText("sort"));
      });
      expect(screen.getByTestId("items")).toHaveTextContent("1,1,3,4,5");
      expect(renders).toBeGreaterThan(initialRenders);

      act(() => {
        fireEvent.click(screen.getByText("reverse"));
      });
      expect(screen.getByTestId("items")).toHaveTextContent("5,4,3,1,1");
      expect(renders).toBeGreaterThan(initialRenders + 1);
    });
  });

  describe("Array index-based subscriptions", () => {
    test("should only re-render components subscribed to specific indexes", () => {
      const state = proxy({ items: ["a", "b", "c"] });
      
      let firstItemRenders = 0;
      let secondItemRenders = 0;
      let lengthRenders = 0;

      function FirstItemComponent() {
        firstItemRenders++;
        const firstItem = useStore(state, (s) => s.items[0]);
        return <div data-testid="first-item">{firstItem}</div>;
      }

      function SecondItemComponent() {
        secondItemRenders++;
        const secondItem = useStore(state, (s) => s.items[1]);
        return <div data-testid="second-item">{secondItem}</div>;
      }

      function LengthComponent() {
        lengthRenders++;
        const length = useStore(state, (s) => s.items.length);
        return <div data-testid="length">{length}</div>;
      }

      function App() {
        return (
          <div>
            <FirstItemComponent />
            <SecondItemComponent />
            <LengthComponent />
            <button onClick={() => { state.items[0] = "x"; }}>change first</button>
            <button onClick={() => { state.items[1] = "y"; }}>change second</button>
            <button onClick={() => state.items.push("d")}>add item</button>
          </div>
        );
      }

      render(<App />);
      const initialFirstRenders = firstItemRenders;
      const initialSecondRenders = secondItemRenders;
      const initialLengthRenders = lengthRenders;

      act(() => {
        fireEvent.click(screen.getByText("change first"));
      });
      expect(firstItemRenders).toBe(initialFirstRenders + 1);
      expect(secondItemRenders).toBe(initialSecondRenders);
      expect(lengthRenders).toBe(initialLengthRenders);

      act(() => {
        fireEvent.click(screen.getByText("change second"));
      });
      expect(firstItemRenders).toBe(initialFirstRenders + 1);
      expect(secondItemRenders).toBe(initialSecondRenders + 1);
      expect(lengthRenders).toBe(initialLengthRenders);

      act(() => {
        fireEvent.click(screen.getByText("add item"));
      });
      expect(firstItemRenders).toBe(initialFirstRenders + 1);
      expect(secondItemRenders).toBe(initialSecondRenders + 1);
      expect(lengthRenders).toBe(initialLengthRenders + 1);
    });
  });

  describe("Array of objects reactivity", () => {
    test("should re-render when object properties within array change", () => {
      const state = proxy({
        todos: [
          { id: 1, text: "Task 1", completed: false, priority: "high", category: "Work" },
          { id: 2, text: "Task 2", completed: true, priority: "medium", category: "Personal" },
          { id: 3, text: "Task 3", completed: false, priority: "low", category: "Work" },
        ] as Todo[]
      });

      let todoListRenders = 0;
      function TodoList() {
        todoListRenders++;
        const todos = useStore(state, (s) => s.todos);
        return (
          <div>
            <div data-testid="todo-list-renders">{todoListRenders}</div>
            {todos.map(todo => (
              <div key={todo.id} data-testid={`todo-${todo.id}`}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => {
                    // Direct mutation of array item property
                    const index = state.todos.findIndex(t => t.id === todo.id);
                    if (index !== -1) {
                      state.todos[index].completed = !state.todos[index].completed;
                    }
                  }}
                  data-testid={`checkbox-${todo.id}`}
                />
                <span>{todo.text}</span>
              </div>
            ))}
          </div>
        );
      }

      render(<TodoList />);
      expect(todoListRenders).toBe(1);

      const checkbox1 = screen.getByTestId("checkbox-1");
      expect(checkbox1).not.toBeChecked();

      act(() => {
        fireEvent.click(checkbox1);
      });

      expect(todoListRenders).toBeGreaterThan(1); // Should re-render
      expect(checkbox1).toBeChecked();
    });

    test("should handle adding and removing objects from array", () => {
      const state = proxy({
        todos: [
          { id: 1, text: "Task 1", completed: false, priority: "high", category: "Work" }
        ] as Todo[]
      });

      let renders = 0;
      function TodoList() {
        renders++;
        const todos = useStore(state, (s) => s.todos);
        return (
          <div>
            <div data-testid="todo-count">{todos.length}</div>
            <div data-testid="renders">{renders}</div>
            <button onClick={() => {
              state.todos.push({
                id: Date.now(),
                text: "New Task",
                completed: false,
                priority: "medium",
                category: "Test"
              });
            }}>add todo</button>
            <button onClick={() => {
              state.todos.splice(0, 1);
            }}>remove first</button>
          </div>
        );
      }

      render(<TodoList />);
      expect(screen.getByTestId("todo-count")).toHaveTextContent("1");
      const initialRenders = renders;

      act(() => {
        fireEvent.click(screen.getByText("add todo"));
      });
      expect(screen.getByTestId("todo-count")).toHaveTextContent("2");
      expect(renders).toBeGreaterThan(initialRenders);

      act(() => {
        fireEvent.click(screen.getByText("remove first"));
      });
      expect(screen.getByTestId("todo-count")).toHaveTextContent("1");
      expect(renders).toBeGreaterThan(initialRenders + 1);
    });

    test("should handle filtered arrays based on object properties", () => {
      const state = proxy({
        todos: [
          { id: 1, text: "Task 1", completed: false, priority: "high", category: "Work" },
          { id: 2, text: "Task 2", completed: true, priority: "medium", category: "Personal" },
          { id: 3, text: "Task 3", completed: false, priority: "low", category: "Work" },
        ] as Todo[],
        filter: "all" as "all" | "active" | "completed"
      });

      let renders = 0;
      function FilteredTodoList() {
        renders++;
        const todos = useStore(state, (s) => s.todos);
        const filter = useStore(state, (s) => s.filter);
        
        const filteredTodos = useMemo(() => {
          return todos.filter(todo => {
            if (filter === "active") return !todo.completed;
            if (filter === "completed") return todo.completed;
            return true;
          });
        }, [todos, filter]);

        return (
          <div>
            <div data-testid="filtered-count">{filteredTodos.length}</div>
            <div data-testid="renders">{renders}</div>
            <button onClick={() => { state.filter = "active"; }}>show active</button>
            <button onClick={() => { state.filter = "completed"; }}>show completed</button>
            <button onClick={() => { state.filter = "all"; }}>show all</button>
            <button onClick={() => {
              const firstTodo = state.todos.find(t => !t.completed);
              if (firstTodo) {
                const index = state.todos.findIndex(t => t.id === firstTodo.id);
                if (index !== -1) {
                  state.todos[index].completed = true;
                }
              }
            }}>complete first active</button>
          </div>
        );
      }

      render(<FilteredTodoList />);
      expect(screen.getByTestId("filtered-count")).toHaveTextContent("3");
      const initialRenders = renders;

      act(() => {
        fireEvent.click(screen.getByText("show active"));
      });
      expect(screen.getByTestId("filtered-count")).toHaveTextContent("2");
      expect(renders).toBeGreaterThan(initialRenders);

      act(() => {
        fireEvent.click(screen.getByText("complete first active"));
      });
      expect(screen.getByTestId("filtered-count")).toHaveTextContent("1");
      expect(renders).toBeGreaterThan(initialRenders + 1);
    });
  });

  describe("Performance scenarios", () => {
    test("should handle large arrays efficiently", () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: i,
        active: i % 2 === 0
      }));

      const state = proxy({ items: largeArray });
      
      let renders = 0;
      function LargeList() {
        renders++;
        const items = useStore(state, (s) => s.items);
        const activeCount = useMemo(() => 
          items.filter(item => item.active).length, 
          [items]
        );
        
        return (
          <div>
            <div data-testid="total-count">{items.length}</div>
            <div data-testid="active-count">{activeCount}</div>
            <div data-testid="renders">{renders}</div>
            <button onClick={() => {
              state.items[0].active = !state.items[0].active;
            }}>toggle first</button>
          </div>
        );
      }

      render(<LargeList />);
      expect(screen.getByTestId("total-count")).toHaveTextContent("1000");
      expect(screen.getByTestId("active-count")).toHaveTextContent("500");
      const initialRenders = renders;

      act(() => {
        fireEvent.click(screen.getByText("toggle first"));
      });
      expect(screen.getByTestId("active-count")).toHaveTextContent("499");
      expect(renders).toBeGreaterThan(initialRenders);
    });
  });

  describe("Coarse-grained array approach", () => {
    test("should re-render all array subscribers on any array change", () => {
      const state = proxy({
        todos: [
          { id: 1, text: "Task 1", completed: false, priority: "high", category: "Work" },
          { id: 2, text: "Task 2", completed: true, priority: "medium", category: "Personal" },
        ] as Todo[]
      });

      let todoListRenders = 0;
      let todoCountRenders = 0;

      function TodoList() {
        todoListRenders++;
        useStore(state, (s) => s.todos);
        return (
          <div data-testid="todo-list-renders">{todoListRenders}</div>
        );
      }

      function TodoCount() {
        todoCountRenders++;
        useStore(state, (s) => s.todos);
        return <div data-testid="todo-count-renders">{todoCountRenders}</div>;
      }

      function App() {
        return (
          <div>
            <TodoList />
            <TodoCount />
            <button onClick={() => {
              // Change a property of first todo
              state.todos[0].completed = !state.todos[0].completed;
            }}>toggle first</button>
          </div>
        );
      }

      render(<App />);
      expect(todoListRenders).toBe(1);
      expect(todoCountRenders).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("toggle first"));
      });

      // Both should re-render because they both subscribe to the todos array
      expect(todoListRenders).toBeGreaterThan(1);
      expect(todoCountRenders).toBeGreaterThan(1);
    });
  });
});