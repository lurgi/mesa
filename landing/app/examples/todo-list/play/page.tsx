"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { proxy, useStore } from "mesa-react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Star,
  Clock,
  BarChart3,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define types
interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  category: string;
  createdAt: string;
  dueDate?: string;
}

interface TodoState {
  todos: Todo[];
  filter: "all" | "active" | "completed";
  priorityFilter: "all" | "high" | "medium" | "low";
  categoryFilter: string;
  searchQuery: string;
  newTodoText: string;
  selectedCategory: string;
  selectedPriority: "medium" | "high" | "low";
}

// Initial state
const initialTodos: Todo[] = [
  {
    id: 1,
    text: "Learn Mesa reactive state management",
    completed: false,
    priority: "high",
    category: "Learning",
    createdAt: "2026-01-01",
    dueDate: "2026-01-15",
  },
  {
    id: 2,
    text: "Build responsive dashboard layout",
    completed: false,
    priority: "medium",
    category: "Development",
    createdAt: "2026-01-02",
  },
  {
    id: 3,
    text: "Review code quality standards",
    completed: true,
    priority: "low",
    category: "Review",
    createdAt: "2026-01-03",
  },
  {
    id: 4,
    text: "Optimize performance metrics",
    completed: false,
    priority: "high",
    category: "Development",
    createdAt: "2026-01-04",
    dueDate: "2026-01-20",
  },
  {
    id: 5,
    text: "Document API endpoints",
    completed: true,
    priority: "medium",
    category: "Documentation",
    createdAt: "2026-01-05",
  },
];

// Reactive state
const todoState = proxy<TodoState>({
  todos: initialTodos,
  filter: "all",
  priorityFilter: "all",
  categoryFilter: "all",
  searchQuery: "",
  newTodoText: "",
  selectedCategory: "General",
  selectedPriority: "medium",
});

// Categories
const CATEGORIES = [
  "General",
  "Learning",
  "Development",
  "Review",
  "Documentation",
  "Meeting",
];

// Priority colors and icons
const PRIORITY_CONFIG = {
  high: {
    color:
      "text-red-500 bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-900",
    dot: "bg-red-500",
    icon: Star,
  },
  medium: {
    color:
      "text-yellow-500 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-900",
    dot: "bg-yellow-500",
    icon: Clock,
  },
  low: {
    color:
      "text-green-500 bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-900",
    dot: "bg-green-500",
    icon: Target,
  },
};

// Dashboard Header Component
function DashboardHeader() {
  const todos = useStore(todoState, (s) => s.todos);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const highPriority = todos.filter(
      (t) => !t.completed && t.priority === "high"
    ).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, active, highPriority, progress };
  }, [todos]);

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Todo Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your tasks efficiently with Mesa&apos;s fine-grained
              reactivity
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-medium">{stats.active}</span>
                <span className="text-muted-foreground">active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="font-medium">{stats.completed}</span>
                <span className="text-muted-foreground">done</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="font-medium">{stats.highPriority}</span>
                <span className="text-muted-foreground">urgent</span>
              </div>
            </div>

            {/* Progress Circle */}
            <div className="relative h-10 w-10">
              <svg
                className="h-10 w-10 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="stroke-muted"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeDasharray={`${stats.progress}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                {stats.progress}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Search and Filters Component
function SearchAndFilters() {
  const searchQuery = useStore(todoState, (s) => s.searchQuery);
  const filter = useStore(todoState, (s) => s.filter);
  const priorityFilter = useStore(todoState, (s) => s.priorityFilter);
  const categoryFilter = useStore(todoState, (s) => s.categoryFilter);
  const todos = useStore(todoState, (s) => s.todos);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(todos.map((t) => t.category)));
    return ["all", ...cats];
  }, [todos]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => (todoState.searchQuery = e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-lg border p-1">
          {(["all", "active", "completed"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "ghost"}
              size="sm"
              onClick={() => (todoState.filter = f)}
              className="h-7 px-3 text-xs"
            >
              {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
            </Button>
          ))}
        </div>

        <div className="flex rounded-lg border p-1">
          {(["all", "high", "medium", "low"] as const).map((p) => (
            <Button
              key={p}
              variant={priorityFilter === p ? "secondary" : "ghost"}
              size="sm"
              onClick={() => (todoState.priorityFilter = p)}
              className="h-7 px-3 text-xs"
            >
              {p === "all"
                ? "All Priority"
                : p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => (todoState.categoryFilter = e.target.value)}
          className="h-7 rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Add Todo Component
function AddTodo() {
  const newTodoText = useStore(todoState, (s) => s.newTodoText);
  const selectedCategory = useStore(todoState, (s) => s.selectedCategory);
  const selectedPriority = useStore(todoState, (s) => s.selectedPriority);

  const addTodo = () => {
    if (newTodoText.trim()) {
      const newTodo: Todo = {
        id: Date.now(),
        text: newTodoText.trim(),
        completed: false,
        priority: selectedPriority,
        category: selectedCategory,
        createdAt: new Date().toISOString(),
      };
      todoState.todos.push(newTodo);
      todoState.newTodoText = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 font-medium">Add New Task</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTodoText}
          onChange={(e) => (todoState.newTodoText = e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => (todoState.selectedCategory = e.target.value)}
            className="flex-1 h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) =>
              (todoState.selectedPriority = e.target.value as
                | "low"
                | "medium"
                | "high")
            }
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-ring"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <Button
          onClick={addTodo}
          disabled={!newTodoText.trim()}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>
    </div>
  );
}

// Todo Item Component
function TodoItem({ todo }: { todo: Todo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleComplete = () => {
    const index = todoState.todos.findIndex((t) => t.id === todo.id);
    if (index !== -1) {
      todoState.todos[index].completed = !todoState.todos[index].completed;
    }
  };

  const deleteTodo = () => {
    todoState.todos = todoState.todos.filter((t) => t.id !== todo.id);
  };

  const saveEdit = () => {
    const index = todoState.todos.findIndex((t) => t.id === todo.id);
    if (index !== -1 && editText.trim()) {
      todoState.todos[index].text = editText.trim();
      setIsEditing(false);
    }
  };

  const priorityConfig = PRIORITY_CONFIG[todo.priority];
  const PriorityIcon = priorityConfig.icon;

  return (
    <div
      className={cn(
        "group rounded-lg border p-4 transition-all hover:shadow-sm",
        todo.completed && "opacity-50",
        priorityConfig.color
      )}
    >
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleComplete}
          className="mt-0.5 h-5 w-5 rounded-full border-2 p-0 hover:bg-transparent"
        >
          {todo.completed ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <PriorityIcon className="h-3 w-3" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {todo.category}
            </span>
            <div className={cn("h-1 w-1 rounded-full", priorityConfig.dot)} />
            <span className="text-xs text-muted-foreground">
              {todo.priority}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") {
                    setIsEditing(false);
                    setEditText(todo.text);
                  }
                }}
                className="w-full rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p
              className={cn(
                "text-sm font-medium leading-relaxed",
                todo.completed && "line-through"
              )}
            >
              {todo.text}
            </p>
          )}

          {todo.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                Due {isMounted ? new Date(todo.dueDate).toLocaleDateString('en-US') : todo.dueDate}
              </span>
            </div>
          )}
        </div>

        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={deleteTodo}
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Todo List Component
function TodoList() {
  const todos = useStore(todoState, (s) => s.todos);
  const filter = useStore(todoState, (s) => s.filter);
  const priorityFilter = useStore(todoState, (s) => s.priorityFilter);
  const categoryFilter = useStore(todoState, (s) => s.categoryFilter);
  const searchQuery = useStore(todoState, (s) => s.searchQuery);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      const matchesStatus =
        filter === "all" ||
        (filter === "active" && !todo.completed) ||
        (filter === "completed" && todo.completed);

      const matchesPriority =
        priorityFilter === "all" || todo.priority === priorityFilter;

      const matchesCategory =
        categoryFilter === "all" || todo.category === categoryFilter;

      const matchesSearch =
        searchQuery === "" ||
        todo.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.category.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        matchesStatus && matchesPriority && matchesCategory && matchesSearch
      );
    });
  }, [todos, filter, priorityFilter, categoryFilter, searchQuery]);

  if (filteredTodos.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-medium">No tasks found</h3>
        <p className="text-sm text-muted-foreground">
          {searchQuery
            ? "Try adjusting your search terms"
            : "Create your first task to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}

// Analytics Panel
function AnalyticsPanel() {
  const todos = useStore(todoState, (s) => s.todos);

  const analytics = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const categories = todos.reduce((acc, todo) => {
      acc[todo.category] = (acc[todo.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorities = todos.reduce((acc, todo) => {
      if (!todo.completed) {
        acc[todo.priority] = (acc[todo.priority] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return { total, completed, categories, priorities };
  }, [todos]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <h3 className="font-medium">Analytics</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">
                {analytics.total === 0
                  ? 0
                  : Math.round((analytics.completed / analytics.total) * 100)}
                %
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{
                  width: `${
                    analytics.total === 0
                      ? 0
                      : (analytics.completed / analytics.total) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Active by Priority</h4>
            <div className="space-y-2">
              {Object.entries(analytics.priorities).map(([priority, count]) => (
                <div
                  key={priority}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        PRIORITY_CONFIG[
                          priority as keyof typeof PRIORITY_CONFIG
                        ].dot
                      )}
                    />
                    <span className="capitalize">{priority}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">By Category</h4>
            <div className="space-y-2">
              {Object.entries(analytics.categories)
                .slice(0, 3)
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{category}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
function TodoDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <AddTodo />
            <AnalyticsPanel />
          </div>

          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            <SearchAndFilters />
            <TodoList />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function TodoListPlayPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/docs/examples/todo-list"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documentation
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            Professional <span className="text-primary">Todo Dashboard</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A complete task management solution built with Mesa&apos;s
            fine-grained reactivity. Experience lightning-fast updates and
            smooth interactions.
          </p>
        </div>

        <TodoDashboard />
      </div>
    </div>
  );
}
