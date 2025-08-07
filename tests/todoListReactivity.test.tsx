import { render, screen, fireEvent, act } from "@testing-library/react";
import { proxy, useStore } from "../src/main";
import { useMemo } from "react";

// Mock todo interface
interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  category: string;
}

interface TodoState {
  todos: Todo[];
  filter: "all" | "active" | "completed";
  priorityFilter: "all" | "high" | "medium" | "low";
  categoryFilter: string;
  searchQuery: string;
}

describe("Todo List Fine-Grained Reactivity", () => {
  let todoState: TodoState;
  let renderCounts = {
    todoList: 0,
    todoItem: 0,
    filterControls: 0,
  };

  beforeEach(() => {
    renderCounts = {
      todoList: 0,
      todoItem: 0,
      filterControls: 0,
    };

    todoState = proxy<TodoState>({
      todos: [
        { id: 1, text: "Task 1", completed: false, priority: "high", category: "Work" },
        { id: 2, text: "Task 2", completed: true, priority: "medium", category: "Personal" },
        { id: 3, text: "Task 3", completed: false, priority: "low", category: "Work" },
      ],
      filter: "all",
      priorityFilter: "all",
      categoryFilter: "all",
      searchQuery: "",
    });
  });

  function TodoItem({ todo }: { todo: Todo }) {
    renderCounts.todoItem++;

    // Subscribe to the specific todo item to handle direct property changes
    const currentTodo = useStore(todoState, (s) => s.todos.find(t => t.id === todo.id) || todo);

    const toggleComplete = () => {
      todoState.todos = todoState.todos.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t));
    };

    return (
      <div data-testid={`todo-${todo.id}`}>
        <input type="checkbox" checked={currentTodo.completed} onChange={toggleComplete} data-testid={`checkbox-${todo.id}`} />
        <span>{currentTodo.text}</span>
      </div>
    );
  }

  function ProblematicTodoList() {
    renderCounts.todoList++;

    const { todos, filter } = useStore(todoState, (s) => ({
      todos: s.todos,
      filter: s.filter,
    }));

    const filteredTodos = useMemo(() => {
      return todos.filter((todo) => {
        if (filter === "active") return !todo.completed;
        if (filter === "completed") return todo.completed;
        return true;
      });
    }, [todos, filter]);

    return (
      <div data-testid="todo-list">
        {filteredTodos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    );
  }

  function CorrectTodoList() {
    renderCounts.todoList++;

    const todos = useStore(todoState, (s) => s.todos);
    const filter = useStore(todoState, (s) => s.filter);

    const filteredTodos = useMemo(() => {
      return todos.filter((todo) => {
        if (filter === "active") return !todo.completed;
        if (filter === "completed") return todo.completed;
        return true;
      });
    }, [todos, filter]);

    return (
      <div data-testid="todo-list">
        {filteredTodos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    );
  }

  // Test Component: Filter Controls
  function FilterControls() {
    renderCounts.filterControls++;
    const filter = useStore(todoState, (s) => s.filter);

    return (
      <div data-testid="filter-controls">
        <button onClick={() => (todoState.filter = "all")} data-testid="filter-all">
          All ({filter === "all" ? "active" : "inactive"})
        </button>
        <button onClick={() => (todoState.filter = "active")} data-testid="filter-active">
          Active ({filter === "active" ? "active" : "inactive"})
        </button>
        <button onClick={() => (todoState.filter = "completed")} data-testid="filter-completed">
          Completed ({filter === "completed" ? "active" : "inactive"})
        </button>
      </div>
    );
  }

  test("should detect infinite re-renders with object selector", async () => {
    const consoleMock = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<ProblematicTodoList />);
    }).toThrow(); // Should throw due to infinite re-renders

    consoleMock.mockRestore();
  });

  test("should handle todo completion changes correctly with proper selectors", async () => {
    render(
      <div>
        <CorrectTodoList />
        <FilterControls />
      </div>
    );

    const initialTodoListRenders = renderCounts.todoList;
    const initialFilterRenders = renderCounts.filterControls;

    const checkbox1 = screen.getByTestId("checkbox-1");

    act(() => {
      fireEvent.click(checkbox1);
    });

    expect(renderCounts.todoList).toBeGreaterThan(initialTodoListRenders);
    expect(renderCounts.filterControls).toBe(initialFilterRenders);
    expect(checkbox1).toBeChecked();
  });

  test("should handle filter changes correctly", async () => {
    render(
      <div>
        <CorrectTodoList />
        <FilterControls />
      </div>
    );

    const initialTodoListRenders = renderCounts.todoList;
    const initialFilterRenders = renderCounts.filterControls;

    // Change filter to 'active'
    const activeFilterButton = screen.getByTestId("filter-active");

    act(() => {
      fireEvent.click(activeFilterButton);
    });

    // Both components should re-render
    expect(renderCounts.todoList).toBeGreaterThan(initialTodoListRenders);
    expect(renderCounts.filterControls).toBeGreaterThan(initialFilterRenders);

    // Should only show active todos (id: 1, 3)
    expect(screen.getByTestId("todo-1")).toBeInTheDocument();
    expect(screen.queryByTestId("todo-2")).not.toBeInTheDocument(); // completed todo
    expect(screen.getByTestId("todo-3")).toBeInTheDocument();
  });

  test("should handle filtered list changes when todo completion changes", async () => {
    render(<CorrectTodoList />);

    act(() => {
      todoState.filter = "active";
    });

    expect(screen.getByTestId("todo-1")).toBeInTheDocument();
    expect(screen.queryByTestId("todo-2")).not.toBeInTheDocument();
    expect(screen.getByTestId("todo-3")).toBeInTheDocument();

    const initialRenderCount = renderCounts.todoList;
    const checkbox1 = screen.getByTestId("checkbox-1");

    act(() => {
      fireEvent.click(checkbox1);
    });

    expect(renderCounts.todoList).toBeGreaterThan(initialRenderCount);
    expect(screen.queryByTestId("todo-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("todo-2")).not.toBeInTheDocument();
    expect(screen.getByTestId("todo-3")).toBeInTheDocument();
  });

  test("should NOT re-render when unrelated state changes", async () => {
    render(<CorrectTodoList />);

    const initialRenderCount = renderCounts.todoList;

    act(() => {
      todoState.searchQuery = "some search";
    });

    expect(renderCounts.todoList).toBe(initialRenderCount);
  });

  test("should work with simple array subscription approach", () => {
    function OptimalTodoList() {
      const todos = useStore(todoState, (s) => s.todos);
      const filter = useStore(todoState, (s) => s.filter);

      const filteredTodos = useMemo(() => {
        return todos.filter((todo) => {
          if (filter === "active") return !todo.completed;
          if (filter === "completed") return todo.completed;
          return true;
        });
      }, [todos, filter]);

      return (
        <div>
          {filteredTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      );
    }

    expect(() => render(<OptimalTodoList />)).not.toThrow();
  });

  test("should re-render when array item property changes", () => {
    render(
      <div>
        <CorrectTodoList />
        <FilterControls />
      </div>
    );

    const initialTodoListRenders = renderCounts.todoList;

    act(() => {
      todoState.todos[1].completed = !todoState.todos[1].completed;
    });

    expect(renderCounts.todoList).toBeGreaterThan(initialTodoListRenders);

    const checkbox2 = screen.getByTestId("checkbox-2");
    expect(checkbox2).toBeChecked();
  });

  test("should handle multiple array item changes", () => {
    render(<CorrectTodoList />);

    const initialRenderCount = renderCounts.todoList;

    act(() => {
      todoState.todos[0].completed = true;
    });

    act(() => {
      todoState.todos[2].completed = false;
    });

    expect(renderCounts.todoList).toBeGreaterThan(initialRenderCount);
    expect(screen.getByTestId("checkbox-1")).toBeChecked();
    expect(screen.getByTestId("checkbox-3")).not.toBeChecked();
  });

  test("should re-render when array item is added or removed", () => {
    render(<CorrectTodoList />);

    const initialRenderCount = renderCounts.todoList;

    act(() => {
      todoState.todos.push({
        id: 4,
        text: "New Task",
        completed: false,
        priority: "medium",
        category: "Test",
      });
    });

    expect(renderCounts.todoList).toBeGreaterThan(initialRenderCount);
    expect(screen.getByTestId("todo-4")).toBeInTheDocument();

    const afterAddRenderCount = renderCounts.todoList;

    act(() => {
      todoState.todos.splice(0, 1);
    });

    expect(renderCounts.todoList).toBeGreaterThan(afterAddRenderCount);
    expect(screen.queryByTestId("todo-1")).not.toBeInTheDocument();
  });
});
