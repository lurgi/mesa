"use client";

import React, { useState, useRef, useEffect } from "react";
import { proxy, useStore } from "mesa";

// Create reactive state
const todoState = proxy({
  todos: [
    { id: 1, text: "Learn Mesa", completed: false, priority: "high" },
    { id: 2, text: "Build awesome app", completed: false, priority: "medium" },
    { id: 3, text: "Share with community", completed: false, priority: "low" },
  ],
  filter: "all", // 'all', 'active', 'completed'
  newTodoText: "",
  stats: {
    total: 3,
    completed: 0,
    active: 3,
  },
});

// Visual render indicator component
function RenderIndicator({ componentName, color = "#3b82f6" }) {
  const [renderCount, setRenderCount] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setRenderCount((prev) => prev + 1);
    setIsFlashing(true);

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsFlashing(false);
    }, 300);

    return () => clearTimeout(timeoutRef.current);
  });

  return (
    <div
      className={`render-indicator ${isFlashing ? "flashing" : ""}`}
      style={{
        position: "absolute",
        top: "4px",
        right: "4px",
        background: isFlashing ? color : "rgba(156, 163, 175, 0.3)",
        color: "white",
        padding: "2px 6px",
        borderRadius: "12px",
        fontSize: "10px",
        fontWeight: "bold",
        transition: "all 0.3s ease",
        zIndex: 10,
      }}
    >
      {componentName}: {renderCount}
    </div>
  );
}

// Todo item component
function TodoItem({ todo }: { todo: { id: number } }) {
  const todoData = useStore(todoState, (s) => s.todos.find((t) => t.id === todo.id));

  if (!todoData) return null;

  const toggleComplete = () => {
    const todoIndex = todoState.todos.findIndex((t) => t.id === todo.id);
    if (todoIndex !== -1) {
      todoState.todos[todoIndex].completed = !todoState.todos[todoIndex].completed;
      updateStats();
    }
  };

  const deleteTodo = () => {
    todoState.todos = todoState.todos.filter((t) => t.id !== todo.id);
    updateStats();
  };

  const updateText = (newText: string) => {
    const todoIndex = todoState.todos.findIndex((t) => t.id === todo.id);
    if (todoIndex !== -1) {
      todoState.todos[todoIndex].text = newText;
    }
  };

  const updatePriority = (newPriority: string) => {
    const todoIndex = todoState.todos.findIndex((t) => t.id === todo.id);
    if (todoIndex !== -1) {
      todoState.todos[todoIndex].priority = newPriority as "high" | "medium" | "low";
    }
  };

  const priorityColors = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#10b981",
  };

  return (
    <div
      className={`todo-item ${todoData.completed ? "completed" : ""}`}
      style={{
        position: "relative",
        padding: "12px",
        margin: "8px 0",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: todoData.completed ? "#f9fafb" : "white",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        opacity: todoData.completed ? 0.7 : 1,
      }}
    >
      <RenderIndicator componentName={`Item-${todo.id}`} color={priorityColors[todoData.priority]} />

      <input type="checkbox" checked={todoData.completed} onChange={toggleComplete} style={{ cursor: "pointer" }} />

      <input
        type="text"
        value={todoData.text}
        onChange={(e) => updateText(e.target.value)}
        style={{
          flex: 1,
          border: "none",
          background: "transparent",
          textDecoration: todoData.completed ? "line-through" : "none",
          fontSize: "14px",
        }}
      />

      <select
        value={todoData.priority}
        onChange={(e) => updatePriority(e.target.value)}
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          border: "1px solid #d1d5db",
          background: priorityColors[todoData.priority],
          color: "white",
          fontSize: "12px",
        }}
      >
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <button
        onClick={deleteTodo}
        style={{
          background: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        Delete
      </button>
    </div>
  );
}

// Todo list display component
function TodoList() {
  const todos = useStore(todoState, (s) => s.todos);
  const filter = useStore(todoState, (s) => s.filter);

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  return (
    <div style={{ position: "relative", minHeight: "200px" }}>
      <RenderIndicator componentName="TodoList" color="#8b5cf6" />

      <div style={{ padding: "16px" }}>
        {filteredTodos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#6b7280",
              padding: "20px",
            }}
          >
            {filter === "active" && "No active todos"}
            {filter === "completed" && "No completed todos"}
            {filter === "all" && "No todos yet"}
          </div>
        ) : (
          filteredTodos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
        )}
      </div>
    </div>
  );
}

// Add new todo component
function AddTodo() {
  const newTodoText = useStore(todoState, (s) => s.newTodoText);

  const addTodo = () => {
    if (newTodoText.trim()) {
      const newTodo = {
        id: Date.now(),
        text: newTodoText.trim(),
        completed: false,
        priority: "medium" as const,
      };
      todoState.todos.push(newTodo);
      todoState.newTodoText = "";
      updateStats();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  return (
    <div style={{ position: "relative", padding: "16px" }}>
      <RenderIndicator componentName="AddTodo" color="#059669" />

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => (todoState.newTodoText = e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a new todo..."
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        />
        <button
          onClick={addTodo}
          disabled={!newTodoText.trim()}
          style={{
            padding: "8px 16px",
            background: newTodoText.trim() ? "#3b82f6" : "#9ca3af",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: newTodoText.trim() ? "pointer" : "not-allowed",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          Add Todo
        </button>
      </div>
    </div>
  );
}

// Filter controls component
function FilterControls() {
  const filter = useStore(todoState, (s) => s.filter);

  const filters = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div style={{ position: "relative", padding: "16px" }}>
      <RenderIndicator componentName="Filters" color="#dc2626" />

      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => (todoState.filter = f.value as "all" | "active" | "completed")}
            style={{
              padding: "6px 12px",
              background: filter === f.value ? "#3b82f6" : "transparent",
              color: filter === f.value ? "white" : "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Statistics component
function TodoStats() {
  const stats = useStore(todoState, (s) => s.stats);

  return (
    <div style={{ position: "relative", padding: "16px" }}>
      <RenderIndicator componentName="Stats" color="#7c3aed" />

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          background: "#f3f4f6",
          padding: "12px",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold", color: "#374151" }}>{stats.total}</div>
          <div style={{ color: "#6b7280" }}>Total</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold", color: "#059669" }}>{stats.active}</div>
          <div style={{ color: "#6b7280" }}>Active</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold", color: "#dc2626" }}>{stats.completed}</div>
          <div style={{ color: "#6b7280" }}>Completed</div>
        </div>
      </div>
    </div>
  );
}

// Bulk actions component
function BulkActions() {
  const todos = useStore(todoState, (s) => s.todos);
  const hasActiveTodos = todos.some((todo) => !todo.completed);
  const hasCompletedTodos = todos.some((todo) => todo.completed);

  const completeAll = () => {
    todoState.todos.forEach((todo, index) => {
      if (!todo.completed) {
        todoState.todos[index].completed = true;
      }
    });
    updateStats();
  };

  const clearCompleted = () => {
    todoState.todos = todoState.todos.filter((todo) => !todo.completed);
    updateStats();
  };

  return (
    <div style={{ position: "relative", padding: "16px" }}>
      <RenderIndicator componentName="BulkActions" color="#f59e0b" />

      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <button
          onClick={completeAll}
          disabled={!hasActiveTodos}
          style={{
            padding: "8px 12px",
            background: hasActiveTodos ? "#10b981" : "#9ca3af",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: hasActiveTodos ? "pointer" : "not-allowed",
            fontSize: "13px",
          }}
        >
          Complete All
        </button>
        <button
          onClick={clearCompleted}
          disabled={!hasCompletedTodos}
          style={{
            padding: "8px 12px",
            background: hasCompletedTodos ? "#ef4444" : "#9ca3af",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: hasCompletedTodos ? "pointer" : "not-allowed",
            fontSize: "13px",
          }}
        >
          Clear Completed
        </button>
      </div>
    </div>
  );
}

// Helper function to update stats
function updateStats() {
  const total = todoState.todos.length;
  const completed = todoState.todos.filter((todo) => todo.completed).length;
  const active = total - completed;

  todoState.stats = { total, completed, active };
}

// Main app component
function TodoApp() {
  useEffect(() => {
    updateStats();
  }, []);

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          margin: "20px 0",
        }}
      >
        <RenderIndicator componentName="TodoApp" color="#1f2937" />

        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "24px" }}>Mesa Todo List</h1>
          <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
            Watch the render indicators to see Mesa's fine-grained updates!
          </p>
        </div>

        <TodoStats />
        <AddTodo />
        <FilterControls />
        <TodoList />
        <BulkActions />
      </div>

      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "16px",
          fontSize: "13px",
          color: "#6b7280",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>🎯 Render Tracking Guide</h3>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          <li>
            <strong>Colored badges</strong> show component names and render counts
          </li>
          <li>
            <strong>Flashing effect</strong> indicates when a component re-renders
          </li>
          <li>
            <strong>Try these actions</strong> to see fine-grained updates:
            <ul style={{ marginTop: "4px" }}>
              <li>Toggle a todo → Only that item re-renders</li>
              <li>Change filter → Only TodoList re-renders</li>
              <li>Add todo → Only AddTodo and Stats re-render</li>
              <li>Edit todo text → Only that specific item re-renders</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function TodoListPlayPage() {
  return (
    <div style={{ padding: "20px", minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#1f2937", margin: "0 0 8px 0" }}>
            Mesa Todo List Playground
          </h1>
          <p style={{ color: "#6b7280", fontSize: "16px", margin: 0 }}>
            Interactive demo showcasing Mesa's fine-grained reactivity
          </p>
        </div>
        
        <TodoApp />
        
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <a 
            href="/docs/examples/todo-list"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "#3b82f6",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600",
            }}
          >
            ← Back to Documentation
          </a>
        </div>
      </div>
      
      <style jsx>{`
        .render-indicator.flashing {
          animation: flash 0.3s ease-in-out;
          transform: scale(1.1);
        }

        @keyframes flash {
          0% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
          100% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        .todo-item {
          transition: all 0.2s ease;
        }

        .todo-item.completed {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}