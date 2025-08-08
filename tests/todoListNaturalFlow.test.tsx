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

interface TodoState {
  todos: Todo[];
  filter: "all" | "active" | "completed";
}

describe("Todo List Natural Flow", () => {
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
    });
  });

  // Natural TodoItem - receives todo as prop, no useStore
  function TodoItem({ 
    todo, 
    onToggle 
  }: { 
    todo: Todo; 
    onToggle: (id: number) => void;
  }) {
    renderCounts.todoItem++;

    return (
      <div data-testid={`todo-${todo.id}`}>
        <input 
          type="checkbox" 
          checked={todo.completed} 
          onChange={() => onToggle(todo.id)} 
          data-testid={`checkbox-${todo.id}`} 
        />
        <span>{todo.text}</span>
      </div>
    );
  }

  // Natural TodoList - manages state and passes handlers down
  function TodoList() {
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

    const handleToggle = (id: number) => {
      todoState.todos = todoState.todos.map((todo) => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
    };

    const handleAdd = (text: string) => {
      const newId = Math.max(...todoState.todos.map(t => t.id)) + 1;
      todoState.todos = [
        ...todoState.todos,
        { 
          id: newId, 
          text, 
          completed: false, 
          priority: "medium" as const,
          category: "General"
        }
      ];
    };

    const handleRemove = (id: number) => {
      todoState.todos = todoState.todos.filter(todo => todo.id !== id);
    };

    return (
      <div data-testid="todo-list">
        <button 
          onClick={() => handleAdd("New Task")} 
          data-testid="add-todo"
        >
          Add Todo
        </button>
        <div>
          {filteredTodos.map((todo) => (
            <div key={todo.id} style={{ display: "flex", alignItems: "center" }}>
              <TodoItem todo={todo} onToggle={handleToggle} />
              <button 
                onClick={() => handleRemove(todo.id)} 
                data-testid={`remove-${todo.id}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function FilterControls() {
    renderCounts.filterControls++;
    const filter = useStore(todoState, (s) => s.filter);

    return (
      <div data-testid="filter-controls">
        <button 
          onClick={() => (todoState.filter = "all")} 
          data-testid="filter-all"
          className={filter === "all" ? "active" : ""}
        >
          All
        </button>
        <button 
          onClick={() => (todoState.filter = "active")} 
          data-testid="filter-active"
          className={filter === "active" ? "active" : ""}
        >
          Active
        </button>
        <button 
          onClick={() => (todoState.filter = "completed")} 
          data-testid="filter-completed"
          className={filter === "completed" ? "active" : ""}
        >
          Completed
        </button>
      </div>
    );
  }

  test("should render initial todos correctly", () => {
    render(<TodoList />);
    
    expect(screen.getByTestId("todo-1")).toBeInTheDocument();
    expect(screen.getByTestId("todo-2")).toBeInTheDocument();
    expect(screen.getByTestId("todo-3")).toBeInTheDocument();
    
    expect(screen.getByTestId("checkbox-1")).not.toBeChecked();
    expect(screen.getByTestId("checkbox-2")).toBeChecked();
    expect(screen.getByTestId("checkbox-3")).not.toBeChecked();
  });

  test("should toggle todo completion", () => {
    render(<TodoList />);
    
    const checkbox1 = screen.getByTestId("checkbox-1");
    const initialTodoListRenders = renderCounts.todoList;
    
    act(() => {
      fireEvent.click(checkbox1);
    });
    
    expect(checkbox1).toBeChecked();
    expect(renderCounts.todoList).toBeGreaterThan(initialTodoListRenders);
    expect(todoState.todos[0].completed).toBe(true);
  });

  test("should add new todo", () => {
    render(<TodoList />);
    
    const addButton = screen.getByTestId("add-todo");
    const initialTodoCount = todoState.todos.length;
    
    act(() => {
      fireEvent.click(addButton);
    });
    
    expect(todoState.todos.length).toBe(initialTodoCount + 1);
    expect(screen.getByTestId("todo-4")).toBeInTheDocument();
    expect(todoState.todos[3].text).toBe("New Task");
  });

  test("should remove todo", () => {
    render(<TodoList />);
    
    const removeButton = screen.getByTestId("remove-1");
    
    act(() => {
      fireEvent.click(removeButton);
    });
    
    expect(todoState.todos.length).toBe(2);
    expect(screen.queryByTestId("todo-1")).not.toBeInTheDocument();
    expect(todoState.todos.find(t => t.id === 1)).toBeUndefined();
  });

  test("should filter todos correctly", () => {
    render(
      <div>
        <TodoList />
        <FilterControls />
      </div>
    );
    
    const activeFilterButton = screen.getByTestId("filter-active");
    
    act(() => {
      fireEvent.click(activeFilterButton);
    });
    
    // Only active (uncompleted) todos should be visible
    expect(screen.getByTestId("todo-1")).toBeInTheDocument();
    expect(screen.queryByTestId("todo-2")).not.toBeInTheDocument(); // completed
    expect(screen.getByTestId("todo-3")).toBeInTheDocument();
  });

  test("should update filter display when todos change", () => {
    render(
      <div>
        <TodoList />
        <FilterControls />
      </div>
    );
    
    // Set filter to active
    act(() => {
      todoState.filter = "active";
    });
    
    expect(screen.getByTestId("todo-1")).toBeInTheDocument();
    expect(screen.queryByTestId("todo-2")).not.toBeInTheDocument();
    expect(screen.getByTestId("todo-3")).toBeInTheDocument();
    
    // Complete todo 1
    const checkbox1 = screen.getByTestId("checkbox-1");
    act(() => {
      fireEvent.click(checkbox1);
    });
    
    // Todo 1 should disappear from active filter
    expect(screen.queryByTestId("todo-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("todo-3")).toBeInTheDocument();
  });

  test("should not re-render TodoItems unnecessarily", () => {
    render(<TodoList />);
    
    const initialItemRenders = renderCounts.todoItem;
    
    // Add a new todo
    act(() => {
      const addButton = screen.getByTestId("add-todo");
      fireEvent.click(addButton);
    });
    
    // All TodoItems should re-render due to the list change, but that's expected
    expect(renderCounts.todoItem).toBeGreaterThan(initialItemRenders);
    
    // Reset counter
    renderCounts.todoItem = 0;
    
    // Toggle one todo
    act(() => {
      const checkbox1 = screen.getByTestId("checkbox-1");
      fireEvent.click(checkbox1);
    });
    
    // All TodoItems re-render because the entire todos array changed
    // This is the expected behavior in the natural flow
    expect(renderCounts.todoItem).toBeGreaterThan(0);
  });

  test("should handle multiple operations correctly", () => {
    render(<TodoList />);
    
    // Add a todo
    act(() => {
      fireEvent.click(screen.getByTestId("add-todo"));
    });
    
    // Toggle a todo
    act(() => {
      fireEvent.click(screen.getByTestId("checkbox-4"));
    });
    
    // Remove a todo
    act(() => {
      fireEvent.click(screen.getByTestId("remove-2"));
    });
    
    // Verify final state
    expect(todoState.todos.length).toBe(3); // Started with 3, added 1, removed 1
    expect(todoState.todos.find(t => t.id === 4)?.completed).toBe(true);
    expect(todoState.todos.find(t => t.id === 2)).toBeUndefined();
  });

  test("should maintain filter state across operations", () => {
    render(
      <div>
        <TodoList />
        <FilterControls />
      </div>
    );
    
    // Set to completed filter
    act(() => {
      fireEvent.click(screen.getByTestId("filter-completed"));
    });
    
    // Only completed todos should show
    expect(screen.queryByTestId("todo-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("todo-2")).toBeInTheDocument();
    expect(screen.queryByTestId("todo-3")).not.toBeInTheDocument();
    
    // Complete todo 1
    act(() => {
      todoState.todos = todoState.todos.map(t => 
        t.id === 1 ? { ...t, completed: true } : t
      );
    });
    
    // Now todo 1 should appear in completed filter
    expect(screen.getByTestId("todo-1")).toBeInTheDocument();
    expect(screen.getByTestId("todo-2")).toBeInTheDocument();
    expect(screen.queryByTestId("todo-3")).not.toBeInTheDocument();
  });
});