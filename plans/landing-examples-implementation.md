# Landing Examples Implementation Plan

## Current Status Analysis

### ✅ Working Examples
1. **Counter** (`/examples/play/counter`) - ✅ Perfect implementation
2. **Todo List** (`/examples/play/todo-list`) - ✅ Complete and functional

### ⚠️ Problematic Implementation
3. **Shopping Cart** (`/examples/play/shopping-cart`) - 🚨 **Incorrect Pattern**

### ❌ Missing Examples  
4. **User Profile** (`/examples/play/user-profile`) - ❌ Not implemented
5. **Dashboard** (`/examples/play/dashboard`) - ❌ Not implemented

## Current Shopping Cart Issues Analysis

### 🚨 Critical Problems Identified

#### 1. **Wrong Architecture Pattern**
```tsx
// ❌ WRONG: Single monolithic store (goes against documentation)
const shoppingState = proxy<ShoppingState>({
  products: [],      // Should be separate store
  cart: [],         // Should be separate store  
  categories: [],   // Part of products domain
  loading: boolean, // Global loading state
});
```

**Problem**: Documentation explicitly shows **multi-store pattern** for Shopping Cart, but current implementation uses **single coordinated store** pattern (which belongs to Dashboard example).

#### 2. **Mismatched Documentation vs Implementation**

**Documentation Pattern** (correct):
```tsx
// Multiple independent stores
const productsStore = proxy({ products: [], categories: [] });
const cartStore = proxy({ items: [], total: 0 });
const userStore = proxy({ user: null, isAuthenticated: false });
```

**Current Implementation** (wrong):
```tsx
// Single monolithic store
const shoppingState = proxy({
  products: [], cart: [], categories: [], loading: true // All in one
});
```

#### 3. **Educational Value Lost**
- **Missing**: Multi-store architecture demonstration  
- **Missing**: Independent initialization patterns
- **Missing**: Cross-store dependencies handling
- **Missing**: Domain separation benefits

#### 4. **Incomplete Implementation**
- No actual shopping cart functionality (add/remove items)
- No product catalog with filtering
- No user authentication flow
- Just shows "Shopping Cart Initialized!" placeholder

## Correct Implementation Patterns

### Pattern 1: Multi-Store Architecture (Shopping Cart)
```tsx
// Domain-separated stores
const productsStore = proxy({
  products: [],
  loading: true,
  categories: [],
  error: null,
});

const cartStore = proxy({
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
});

const userStore = proxy({
  user: null,
  isAuthenticated: false,
  preferences: {},
  loading: true,
});

// Independent initialization
function useProductsInitialization() {
  useInitSync(productsStore, async (state) => {
    const products = await fetchProducts();
    state.products = products;
    state.categories = extractCategories(products);
    state.loading = false;
  });
}

function useUserInitialization() {
  useInitSync(userStore, async (state) => {
    const user = await fetchUser();
    state.user = user;
    state.isAuthenticated = !!user;
    state.loading = false;
  });
}

function useCartInitialization() {
  const { user, isAuthenticated } = useStore(userStore);
  
  useInitSync(cartStore, async (state) => {
    if (!isAuthenticated) {
      state.items = [];
      return;
    }
    const cartItems = await fetchCart(user.id);
    state.items = cartItems;
    calculateTotals(state);
  }, {
    deps: [user?.id] // Proper dependency management
  });
}
```

### Pattern 2: Coordinated Single Store (Dashboard)
```tsx
// Single store for related data
const dashboardStore = proxy({
  user: null,
  analytics: {},
  notifications: [],
  activities: [],
  loading: true,
});

// Coordinated initialization
useInitSync(dashboardStore, async (state) => {
  const [user, analytics, notifications] = await Promise.all([
    fetchUser(),
    fetchAnalytics(), 
    fetchNotifications()
  ]);
  
  state.user = user;
  state.analytics = analytics;
  state.notifications = notifications;
  state.loading = false;
});
```

### Pattern 3: Single Entity with Async Loading (User Profile)
```tsx
// User-focused store
const userProfileStore = proxy({
  profile: null,
  preferences: {},
  activity: [],
  loading: true,
  editing: false,
});

useInitSync(userProfileStore, async (state) => {
  state.loading = true;
  const [profile, preferences, activity] = await Promise.all([
    fetchProfile(),
    fetchPreferences(),
    fetchActivity()
  ]);
  
  state.profile = profile;
  state.preferences = preferences;  
  state.activity = activity;
  state.loading = false;
});
```

## Implementation Plan

### Phase 1: Fix Shopping Cart (2-3 days)

#### Day 1: Restructure Architecture
- [ ] Replace single store with multi-store pattern
- [ ] Implement domain separation (products, cart, user)
- [ ] Add independent initialization hooks
- [ ] Remove wrong patterns

#### Day 2: Implement Core Functionality
- [ ] Product catalog with filtering
- [ ] Add to cart functionality
- [ ] Cart management (update quantities, remove items)
- [ ] User authentication simulation

#### Day 3: Polish & Educational Value  
- [ ] Add render tracking for multi-store benefits
- [ ] Cross-store dependency demonstration
- [ ] Performance comparison info panels
- [ ] Error handling and edge cases

### Phase 2: User Profile Playground (2 days)

#### Day 1: Core Implementation
- [ ] Single store with async loading pattern
- [ ] Profile form with editing capabilities  
- [ ] Preferences management
- [ ] Avatar upload simulation

#### Day 2: Enhanced Features
- [ ] Activity history timeline
- [ ] Settings panels
- [ ] Form validation
- [ ] Loading states and error handling

### Phase 3: Dashboard Playground (2 days)

#### Day 1: Core Implementation  
- [ ] Coordinated multi-source loading
- [ ] Analytics dashboard layout
- [ ] Real-time metrics simulation
- [ ] User session management

#### Day 2: Enhanced Features
- [ ] Interactive charts and graphs
- [ ] Notification management
- [ ] Activity feed
- [ ] Quick actions panel

## Technical Specifications

### Shopping Cart - Multi-Store Pattern

#### File Structure
```
landing/app/examples/play/shopping-cart/
├── page.tsx                    # Main page component
├── components/
│   ├── ProductCatalog.tsx      # Products display & filtering  
│   ├── CartSidebar.tsx         # Cart management
│   ├── UserHeader.tsx          # User authentication
│   └── StoreManager.tsx        # Multi-store initialization
```

#### Store Architecture
```tsx
// products/store.ts
export const productsStore = proxy({
  products: [],
  loading: true,
  error: null,
  categories: [],
  filters: {
    category: 'all',
    priceRange: [0, 1000],
    rating: 0,
  }
});

// cart/store.ts  
export const cartStore = proxy({
  items: [],
  total: 0,
  itemCount: 0,
  discount: 0,
  loading: false,
});

// user/store.ts
export const userStore = proxy({
  user: null,
  isAuthenticated: false,
  preferences: {
    currency: 'USD',
    theme: 'light',
  },
  loading: true,
});
```

#### Component Architecture
```tsx
function ShoppingApp() {
  // Initialize all stores
  useProductsInitialization();
  useUserInitialization();
  useCartInitialization();
  
  return (
    <div className="shopping-app">
      <UserHeader />               {/* userStore + cartStore */}
      <div className="main-content">
        <ProductCatalog />         {/* productsStore */}
        <CartSidebar />           {/* cartStore + productsStore */}
      </div>
      <CrossStoreDemo />          {/* Educational component */}
    </div>
  );
}
```

### User Profile - Single Store Pattern

#### Store Architecture
```tsx
export const userProfileStore = proxy({
  // Profile data
  profile: {
    id: null,
    name: '',
    email: '',
    avatar: '',
    bio: '',
    location: '',
    website: '',
  },
  
  // User preferences
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      marketing: false,
    },
    privacy: {
      profilePublic: true,
      emailVisible: false,
    }
  },
  
  // Activity data
  activityHistory: [],
  
  // UI state
  isEditing: false,
  activeTab: 'profile',
  
  // Loading states
  loading: true,
  saving: false,
  error: null,
});
```

#### Component Architecture
```tsx
function UserProfileApp() {
  useInitSync(userProfileStore, initializeProfile);
  
  return (
    <div className="profile-app">
      <ProfileHeader />
      <div className="profile-content">
        <ProfileForm />
        <PreferencesPanel />
        <ActivityFeed />
      </div>
    </div>
  );
}
```

### Dashboard - Coordinated Store Pattern

#### Store Architecture
```tsx
export const dashboardStore = proxy({
  // User session
  user: {
    id: null,
    name: '',
    role: '',
    avatar: '',
    lastLogin: null,
  },
  
  // Analytics data
  analytics: {
    overview: {
      totalUsers: 0,
      revenue: 0,
      orders: 0,
      growth: 0,
    },
    charts: {
      dailyActive: [],
      revenue: [],
      conversion: [],
    },
    realtime: {
      activeNow: 0,
      sessionsToday: 0,
    }
  },
  
  // Activity feed
  recentActivities: [],
  
  // Notifications
  notifications: [],
  unreadCount: 0,
  
  // Loading states
  loading: true,
  error: null,
  initialized: false,
});
```

## Mock Data Strategy

### Realistic Business Data
```tsx
// Products with proper categories, pricing, ratings
const mockProducts = [
  {
    id: 'prod-001',
    name: 'Mesa State Management Course',
    price: 49.99,
    category: 'Education',
    rating: 4.8,
    reviews: 127,
    stock: 15,
    images: ['course-1.jpg'],
    description: 'Learn advanced state management with Mesa...',
    features: ['Video lectures', 'Code examples', 'Certificate'],
  },
  // ... more realistic products
];

// User profiles with authentication states
const mockUsers = [
  {
    id: 'user-001', 
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    role: 'Developer',
    avatar: 'https://images.unsplash.com/photo-...',
    preferences: {
      theme: 'dark',
      currency: 'USD',
    },
    isAuthenticated: true,
  },
  // ... anonymous user state
];

// Dashboard analytics with time series data
const mockAnalytics = {
  dailyStats: generateTimeSeriesData(30), // 30 days
  userGrowth: generateGrowthData(),
  revenueData: generateRevenueData(),
  realTimeMetrics: generateRealTimeData(),
};
```

### Progressive Loading Simulation
```tsx
// Simulate realistic API delays and errors
const fetchWithDelay = async <T>(data: T, delay: number = 1000): Promise<T> => {
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // 5% chance of network error
  if (Math.random() < 0.05) {
    throw new Error('Network error occurred');
  }
  
  return data;
};

// Different loading patterns
const fetchProducts = () => fetchWithDelay(mockProducts, 800);      // Fast
const fetchUser = () => fetchWithDelay(mockUser, 500);              // Very fast  
const fetchAnalytics = () => fetchWithDelay(mockAnalytics, 1500);   // Slower
const fetchCart = (userId: string) => fetchWithDelay(mockCart, 600); // Medium
```

## Quality Assurance Checklist

### Functional Requirements
- [ ] **Shopping Cart**: Multi-store architecture working correctly
- [ ] **User Profile**: Single store with complex form handling  
- [ ] **Dashboard**: Coordinated loading with real-time updates
- [ ] All examples load without errors
- [ ] State updates work correctly across components
- [ ] Error handling gracefully manages failures

### Educational Value
- [ ] **Shopping Cart**: Clearly demonstrates multi-store benefits
- [ ] **User Profile**: Shows complex single-store patterns
- [ ] **Dashboard**: Illustrates coordinated initialization
- [ ] Each example teaches specific Mesa concepts
- [ ] Performance benefits are visible and measurable
- [ ] Code patterns match documentation examples

### UX/UI Quality  
- [ ] Responsive design works on all devices
- [ ] Dark mode compatibility maintained
- [ ] Loading states provide good feedback
- [ ] Animations are smooth and purposeful
- [ ] Navigation is intuitive and consistent
- [ ] Error messages are helpful and actionable

### Code Quality
- [ ] TypeScript coverage is complete
- [ ] Component architecture is clean and modular
- [ ] Performance optimizations are in place
- [ ] Code follows established patterns from counter/todo
- [ ] No infinite loops or memory leaks
- [ ] Proper cleanup in useEffect hooks

## Success Metrics

### Implementation Success
1. **Shopping Cart**: Matches multi-store documentation pattern exactly
2. **User Profile**: Demonstrates single complex store management
3. **Dashboard**: Shows coordinated loading benefits clearly
4. **Performance**: No infinite loops, efficient re-renders
5. **Education**: Each example teaches specific Mesa concepts

### User Experience
1. **Load Time**: Under 2 seconds to interactive
2. **Responsiveness**: Smooth on mobile and desktop
3. **Intuitive**: Self-explanatory interface
4. **Educational**: Clear learning value for each example
5. **Consistent**: Matches existing example design patterns

## 🚨 CRITICAL: Maximum Update Depth Prevention

### 🔥 Common Infinite Loop Causes (NEVER DO THESE)

#### 1. **Hook in useMemo Dependencies** 
```tsx
// ❌ NEVER: Hook inside dependency array
const stats = useMemo(() => {
  return { count: data.length };
}, [
  useStore(store, s => s.data.length) // ❌ This causes infinite loops
]);

// ✅ CORRECT: Separate useStore calls
const dataLength = useStore(store, s => s.data.length);
const stats = useMemo(() => {
  return { count: dataLength };
}, [dataLength]);
```

#### 2. **Unstable useInitSync Dependencies**
```tsx
// ❌ NEVER: Multiple separate primitive deps
const userLoading = useStore(userStore, s => s.loading);
const userAuth = useStore(userStore, s => s.isAuthenticated); 
const userId = useStore(userStore, s => s.user?.id);
useInitSync(cartStore, async (state) => {
  // ...
}, { 
  deps: [userLoading, userAuth, userId] // ❌ Unstable array reference
});

// ✅ CORRECT: Single stable object dependency
const userState = useStore(userStore, s => ({
  loading: s.loading,
  isAuthenticated: s.isAuthenticated,
  userId: s.user?.id
}));
useInitSync(cartStore, async (state) => {
  // ...
}, { 
  deps: [userState.loading, userState.isAuthenticated, userState.userId]
});
```

#### 3. **Cross-Store Access in Calculations**
```tsx
// ❌ NEVER: External store access in shared functions
const calculateCartTotals = () => {
  const products = productsStore.products; // ❌ Cross-store access
  cartStore.items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    // This creates circular dependencies
  });
  cartStore.total = total; // Multiple updates
};

// ✅ CORRECT: Inline calculations with local data
const updateCart = () => {
  // All calculations inline, no external function calls
  let total = 0;
  cartStore.items.forEach(item => {
    const product = productsStore.products.find(p => p.id === item.productId);
    if (product) total += product.price * item.quantity;
  });
  cartStore.total = total;
};
```

#### 4. **Multiple Store Loading Checks**
```tsx
// ❌ NEVER: Separate boolean checks that change frequently
const productsReady = useStore(productsStore, s => !s.loading);
const userReady = useStore(userStore, s => !s.loading);
const cartReady = useStore(cartStore, s => !s.loading);
const allReady = productsReady && userReady && cartReady; // ❌ Recalculates constantly

// ✅ CORRECT: Single subscription with stable reference
const allStoresReady = useStore([productsStore, userStore, cartStore], 
  ([products, user, cart]) => !products.loading && !user.loading && !cart.loading
);
```

### 🛡️ Prevention Rules (MANDATORY)

#### Rule 1: **No Hooks in Dependencies**
- Never call `useStore`, `useState`, `useEffect`, etc. inside dependency arrays
- Always declare hooks at component top level first

#### Rule 2: **Stable Dependencies Only**
- Use object destructuring for multiple values from same store
- Avoid array literals in deps (use primitive values)
- Prefer single store subscriptions over multiple

#### Rule 3: **No Shared Calculation Functions**
- Inline all calculations that modify store state
- Avoid helper functions that access multiple stores
- Each update should be self-contained

#### Rule 4: **Single Responsibility Updates**
- One store update per user action
- Batch related changes within same store
- Avoid cascading store updates

#### Rule 5: **useInitSync Stability**
- Dependencies should be primitives or stable object properties
- Use conditional return instead of conditional execution
- Keep deps array as short as possible

### ⚠️ Debug Checklist (When Infinite Loops Occur)

1. **Check useMemo/useCallback deps**: Any hooks inside?
2. **Check useInitSync deps**: Are they stable primitives?
3. **Check cross-store access**: Any external store reads in calculations?
4. **Check component subscriptions**: Too many useStore calls?
5. **Check update cascades**: Does one store update trigger another?

### 🧪 Testing for Infinite Loops

```tsx
// Add this to components during development
const renderCount = useRef(0);
renderCount.current++;
console.log(`Component rendered ${renderCount.current} times`);
if (renderCount.current > 10) {
  console.error('⚠️ Possible infinite loop detected!');
}
```

## Risk Mitigation

### Technical Risks
- **Cross-store dependencies**: Use proper dependency management patterns with stable references
- **Performance issues**: Implement selective subscriptions correctly
- **State synchronization**: Avoid circular dependencies with single-direction data flow
- **Infinite loops**: Follow the prevention rules above religiously

### Implementation Risks  
- **Pattern confusion**: Clear documentation of which pattern to use when
- **Complexity creep**: Keep examples focused on core concepts
- **Maintenance burden**: Use consistent, reusable patterns
- **Hook violations**: Always run ESLint with React hooks plugin

### User Experience Risks
- **Cognitive overload**: Progressive disclosure of complexity
- **Confusing interactions**: Clear labeling and feedback
- **Mobile experience**: Test early and often on devices
- **Performance degradation**: Monitor for infinite loops in development

## Timeline

### Week 1: Shopping Cart Fix
- Days 1-2: Architecture restructure + core functionality
- Day 3: Polish and educational enhancements

### Week 2: Missing Examples
- Days 1-2: User Profile playground implementation  
- Days 3-4: Dashboard playground implementation
- Day 5: Testing, bug fixes, documentation updates

### Total Estimate: 8 working days

This plan ensures we deliver high-quality, educational examples that properly demonstrate Mesa's capabilities while fixing the current architectural issues.