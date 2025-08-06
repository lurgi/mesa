# Mesa

> High-performance React state management with fine-grained reactivity

Mesa provides automatic dependency tracking and path-based subscriptions, ensuring only the components that need updates actually re-render. Zero dependencies, minimal bundle size, maximum performance.

## ⚡ Features

### 🎯 Fine-Grained Updates

Only re-render components that use changed data. Mesa automatically tracks dependencies and updates only what's necessary.

### 🚀 Simple API

Just two functions: `proxy()` and `useStore()`. No complex selectors, no manual optimizations.

### 🪶 Lightweight

~1KB gzipped with no external dependencies. Built for modern React applications.

## Quick Start

### Installation

```bash
npm install mesa-react
```

### Basic Usage

```tsx
import { proxy, useStore } from "mesa";

// Create a reactive store
const store = proxy({
  count: 0,
  user: {
    name: "John",
    age: 30,
  },
});

// Use in components
function Counter() {
  const count = useStore(store, (s) => s.count);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => store.count++}>Increment</button>
    </div>
  );
}

function UserInfo() {
  const userName = useStore(store, (s) => s.user.name);
  const userAge = useStore(store, (s) => s.user.age);

  return (
    <div>
      <p>Name: {userName}</p>
      <p>Age: {userAge}</p>
    </div>
  );
}
```

## How It Works

### Automatic Dependency Tracking

Mesa uses JavaScript Proxies to automatically track which properties your components access. When you use `useStore()`, Mesa creates a subscription to only the specific paths you read.

```tsx
function MyComponent() {
  const userName = useStore(store, (s) => s.user.name);
  // Only subscribes to 'user.name' property

  return <div>{userName}</div>;
  // Will re-render only when user.name changes
}
```

### Path-Based Subscriptions

Mesa tracks deep object access automatically:

```tsx
function DeepComponent() {
  const theme = useStore(store, (s) => s.user.profile.settings.theme);
  // Only subscribes to this specific path

  return <div>{theme}</div>;
}
```

### Immutable Updates

Mesa handles immutable updates automatically:

```tsx
// These all work seamlessly
store.count = 5;
store.user.name = "Jane";
store.items.push(newItem);
store.nested.deep.value = "updated";
```

## Advanced Patterns

### Computed Values

```tsx
const store = proxy({
  items: [],
  get totalCount() {
    return this.items.length;
  },
  get expensiveValue() {
    return this.items.reduce((sum, item) => sum + item.value, 0);
  },
});

function Summary() {
  const totalCount = useStore(store, (s) => s.totalCount);
  const expensiveValue = useStore(store, (s) => s.expensiveValue);

  return (
    <div>
      <p>Total Items: {totalCount}</p>
      <p>Total Value: {expensiveValue}</p>
    </div>
  );
}
```

### Async Operations

```tsx
const store = proxy({
  data: null,
  loading: false,
  error: null,
});

async function fetchData() {
  store.loading = true;
  store.error = null;

  try {
    const response = await fetch("/api/data");
    store.data = await response.json();
  } catch (err) {
    store.error = err.message;
  } finally {
    store.loading = false;
  }
}
```

### Local Component State

```tsx
function LocalCounter() {
  const localStore = useMemo(() => proxy({ count: 0 }), []);
  const count = useStore(localStore, (s) => s.count);

  return <button onClick={() => localStore.count++}>Count: {count}</button>;
}
```

## Performance Benefits

### Automatic Memoization

Mesa automatically memoizes expensive computations:

```tsx
const store = proxy({
  items: [],
  get filteredItems() {
    // This is automatically memoized
    return this.items.filter((item) => item.active);
  },
});
```

### Selective Re-renders

Only components that actually use changed data will re-render:

```tsx
function Header() {
  const userName = useStore(store, (s) => s.user.name);
  // Only re-renders when user.name changes
  return <header>Welcome, {userName}!</header>;
}

function Sidebar() {
  const sidebarContent = useStore(store, (s) => s.sidebar.content);
  // Only re-renders when sidebar.content changes
  return <aside>{sidebarContent}</aside>;
}

function Main() {
  const content = useStore(store, (s) => s.content);
  // Only re-renders when content changes
  return <main>{content}</main>;
}
```

## API Reference

### `proxy(initialState)`

Creates a reactive store from an initial state object.

```tsx
const store = proxy({
  count: 0,
  user: { name: "John" },
});
```

### `useStore(store, selector)`

Hook to subscribe to store changes. Returns the selected value.

```tsx
const count = useStore(store, (s) => s.count);
const userName = useStore(store, (s) => s.user.name);
```

## Migration Guide

### From Redux

```tsx
// Before (Redux)
const mapStateToProps = (state) => ({
  count: state.counter.count,
  user: state.user,
});

// After (Mesa)
const count = useStore(store, (s) => s.count);
const user = useStore(store, (s) => s.user);
```

### From Zustand

```tsx
// Before (Zustand)
const count = useStore((state) => state.count);
const increment = useStore((state) => state.increment);

// After (Mesa)
const count = useStore(store, (s) => s.count);
const increment = () => store.count++;
```

### From Context

```tsx
// Before (Context)
const { state, dispatch } = useContext(MyContext);

// After (Mesa)
const count = useStore(store, (s) => s.count);
```

## Browser Support

- Chrome 49+
- Firefox 18+
- Safari 10+
- Edge 12+

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ for the React community.
