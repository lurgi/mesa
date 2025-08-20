import {
  render,
  screen,
  fireEvent,
  act,
  renderHook,
  within,
  cleanup,
} from "@testing-library/react";
import { proxy, useStore } from "../src/main";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: Todo[];
  isLoading: boolean;
}

describe("Real-world async Todo List with proxy.withSync", () => {
  afterEach(() => {
    cleanup();
  });

  const createMockTodos = (): Todo[] => [
    { id: 1, text: "Fetched Todo 1", completed: false },
    { id: 2, text: "Fetched Todo 2", completed: true },
  ];

  const createTodoApp = (state: TodoState) => {
    function TodoApp() {
      const s = useStore(state);

      return (
        <div>
          <h1>Todo List</h1>
          {s.isLoading ? (
            <div>Loading...</div>
          ) : (
            <ul>
              {s.todos.map((todo, index) => (
                <li key={todo.id}>
                  <span>{todo.text}</span>
                  <button
                    onClick={() => {
                      s.todos[index].completed = !s.todos[index].completed;
                    }}
                  >
                    {todo.completed ? "Undo" : "Complete"}
                  </button>
                  <button
                    onClick={() => {
                      s.todos.splice(index, 1);
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() =>
              s.todos.push({
                id: Date.now(),
                text: "New Client-side Todo",
                completed: false,
              })
            }
          >
            Add Todo
          </button>
        </div>
      );
    }
    return TodoApp;
  };
  test("should handle async loading and subsequent local mutations", async () => {
    const { state, useSync } = proxy.withSync<TodoState>({
      todos: [],
      isLoading: true,
    });

    const initialTodos = createMockTodos();
    const fetchTodos = () =>
      Promise.resolve({ todos: initialTodos, isLoading: false });

    const TodoApp = createTodoApp(state);

    const { rerender } = renderHook(({ data }) => useSync(data), {
      initialProps: { data: undefined as Partial<TodoState> | undefined },
    });

    render(<TodoApp />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    const fetchedData = await fetchTodos();

    act(() => {
      rerender({ data: fetchedData });
    });

    await screen.findByText("Fetched Todo 1");

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getByText("Fetched Todo 2")).toBeInTheDocument();
    expect(state.todos.length).toBe(2);

    // Test client-side mutation (add)
    fireEvent.click(screen.getByText("Add Todo"));
    expect(await screen.findByText("New Client-side Todo")).toBeInTheDocument();
    expect(state.todos.length).toBe(3);

    // Test client-side mutation (update)
    const todo1 = screen.getByText("Fetched Todo 1").closest("li");
    if (!todo1) throw new Error("Could not find todo item");
    const completeButton = within(todo1).getByText("Complete");
    fireEvent.click(completeButton);
    expect(await within(todo1).findByText("Undo")).toBeInTheDocument();
    expect(state.todos[0].completed).toBe(true);

    // Test client-side mutation (delete)
    const deleteButton = within(todo1).getByText("Delete");
    fireEvent.click(deleteButton);
    expect(screen.queryByText("Fetched Todo 1")).not.toBeInTheDocument();
    expect(state.todos.length).toBe(2);
  });

  test("should handle invalid data gracefully", async () => {
    const { state, useSync } = proxy.withSync<TodoState>({
      todos: [],
      isLoading: true,
    });

    const TodoApp = createTodoApp(state);
    const { rerender } = renderHook(({ data }) => useSync(data), {
      initialProps: { data: undefined as Partial<TodoState> | undefined },
    });

    render(<TodoApp />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Test with undefined data (should be ignored)
    act(() => {
      rerender({ data: undefined });
    });

    expect(state.todos).toEqual([]);
    expect(state.isLoading).toBe(true);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Test with invalid string data (should be ignored)
    expect(() => {
      act(() => {
        rerender({ data: "invalid data" as any });
      });
    }).not.toThrow();

    expect(state.todos).toEqual([]);
    expect(state.isLoading).toBe(true);
  });

  test("should handle rapid successive updates", async () => {
    const { state, useSync } = proxy.withSync<TodoState>({
      todos: [],
      isLoading: false,
    });

    const { rerender } = renderHook(({ data }) => useSync(data), {
      initialProps: { data: undefined as Partial<TodoState> | undefined },
    });

    // Simulate rapid updates
    const updates = Array(10)
      .fill(0)
      .map((_, i) => ({
        todos: [{ id: i, text: `Todo ${i}`, completed: false }],
      }));

    updates.forEach((update) => {
      act(() => {
        rerender({ data: update });
      });
    });

    // Should end up with the last update
    expect(state.todos.length).toBe(1);
    expect(state.todos[0].text).toBe("Todo 9");
  });
});
