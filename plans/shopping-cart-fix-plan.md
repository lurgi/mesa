# Shopping Cart Fix Implementation Plan

## Critical Issue Summary

현재 Shopping Cart 예제는 **잘못된 아키텍처 패턴**을 사용하고 있어 문서와 일치하지 않으며 교육적 가치를 제공하지 못합니다.

### 🚨 Current Problems

1. **Wrong Pattern**: Single monolithic store (문서는 multi-store pattern)
2. **Missing Functionality**: 실제 쇼핑카트 기능 없음 (placeholder만 존재)
3. **Educational Value Lost**: Multi-store architecture 시연 없음
4. **Documentation Mismatch**: 예제와 문서가 완전히 다른 패턴

## Correct Architecture (per Documentation)

### Multi-Store Pattern
```tsx
// ✅ CORRECT: Domain-separated stores
const productsStore = proxy({
  products: [],
  loading: true,
  error: null,
  categories: [],
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
```

## Implementation Plan

### Phase 1: Architecture Restructure (Day 1)

#### 1.1 Remove Wrong Implementation
```bash
# Backup current implementation
cp landing/app/examples/play/shopping-cart/page.tsx shopping-cart-backup.tsx

# Clear problematic code
# Keep only the page structure and navigation
```

#### 1.2 Create Multi-Store Architecture
```tsx
// stores/products.ts
export const productsStore = proxy({
  products: [],
  loading: true,
  error: null,
  categories: [],
  filters: {
    category: 'all',
    search: '',
    priceRange: [0, 200],
  }
});

// stores/cart.ts
export const cartStore = proxy({
  items: [], // { productId, quantity, addedAt }
  total: 0,
  itemCount: 0,
  discount: 0,
  loading: false,
});

// stores/user.ts  
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

#### 1.3 Independent Initialization Hooks
```tsx
function useProductsInitialization() {
  useInitSync(productsStore, async (state) => {
    state.loading = true;
    state.error = null;
    
    try {
      const products = await fetchProducts();
      const categories = [...new Set(products.map(p => p.category))];
      
      state.products = products;
      state.categories = categories;
    } catch (error) {
      state.error = error.message;
    } finally {
      state.loading = false;
    }
  });
}

function useUserInitialization() {
  useInitSync(userStore, async (state) => {
    state.loading = true;
    
    try {
      // Simulate user session check
      const sessionData = await checkUserSession();
      state.user = sessionData.user;
      state.isAuthenticated = !!sessionData.user;
      state.preferences = sessionData.preferences || state.preferences;
    } catch (error) {
      state.isAuthenticated = false;
      state.user = null;
    } finally {
      state.loading = false;
    }
  });
}

function useCartInitialization() {
  // ✅ CORRECT: Watch user state changes properly
  const [userReady, setUserReady] = useState(false);
  
  // Wait for user initialization to complete
  useEffect(() => {
    const unsubscribe = subscribeToPath(userStore, 'loading', (loading) => {
      if (!loading) {
        setUserReady(true);
      }
    });
    return unsubscribe;
  }, []);
  
  useInitSync(cartStore, async (state) => {
    if (!userReady) return;
    
    state.loading = true;
    
    try {
      if (userStore.isAuthenticated && userStore.user) {
        // Load user's cart
        const cartItems = await fetchUserCart(userStore.user.id);
        state.items = cartItems;
      } else {
        // Load from localStorage for anonymous users
        const savedCart = localStorage.getItem('mesa-cart');
        state.items = savedCart ? JSON.parse(savedCart) : [];
      }
      
      calculateCartTotals(state);
    } catch (error) {
      console.error('Failed to load cart:', error);
      state.items = [];
    } finally {
      state.loading = false;
    }
  }, {
    deps: [userReady]
  });
}
```

### Phase 2: Core Components (Day 1 continued)

#### 2.1 Store Manager Component
```tsx
function StoreManager({ children }: { children: React.ReactNode }) {
  // Initialize all stores
  useProductsInitialization();
  useUserInitialization(); 
  useCartInitialization();
  
  // Show loading state until all stores are ready
  const allReady = useStore(productsStore, s => !s.loading) &&
                   useStore(userStore, s => !s.loading) &&
                   useStore(cartStore, s => !s.loading);
  
  if (!allReady) {
    return <MultiStoreLoadingState />;
  }
  
  return <>{children}</>;
}
```

#### 2.2 Header Component  
```tsx
function ShopHeader() {
  // Subscribe to user store
  const { user, isAuthenticated } = useStore(userStore, s => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated
  }));
  
  // Subscribe to cart totals
  const { itemCount, total } = useStore(cartStore, s => ({
    itemCount: s.itemCount,
    total: s.total
  }));
  
  return (
    <header className="sticky top-0 bg-background border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Mesa Store</h1>
            <p className="text-sm text-muted-foreground">
              Multi-store architecture demonstration
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <CartIcon itemCount={itemCount} total={total} />
            {isAuthenticated ? (
              <UserMenu user={user} />
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
```

### Phase 3: Product Catalog (Day 2)

#### 3.1 Product Catalog Component
```tsx
function ProductCatalog() {
  const { products, loading, error, categories } = useStore(productsStore);
  const { category, search } = useStore(productsStore, s => s.filters);
  
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = category === 'all' || product.category === category;
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, category, search]);
  
  if (loading) return <ProductLoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <div className="space-y-6">
      <ProductFilters categories={categories} />
      <ProductGrid products={filteredProducts} />
    </div>
  );
}
```

#### 3.2 Product Card Component
```tsx
function ProductCard({ product }: { product: Product }) {
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddToCart = async () => {
    setIsAdding(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Add to cart store
    const existingItem = cartStore.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartStore.items.push({
        productId: product.id,
        quantity: 1,
        addedAt: new Date(),
        price: product.price,
        name: product.name,
        image: product.image,
      });
    }
    
    // Recalculate totals
    calculateCartTotals(cartStore);
    
    setIsAdding(false);
  };
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center text-4xl">
        {product.image}
      </div>
      <h3 className="font-semibold mb-2">{product.name}</h3>
      <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-green-600">
          ${product.price.toFixed(2)}
        </span>
        <Button
          onClick={handleAddToCart}
          disabled={isAdding || product.stock === 0}
          className={cn(
            isAdding && "animate-pulse"
          )}
        >
          {isAdding ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {product.stock} in stock
      </div>
    </div>
  );
}
```

### Phase 4: Cart Management (Day 2 continued)

#### 4.1 Cart Sidebar
```tsx
function CartSidebar() {
  const { items, total, itemCount, loading } = useStore(cartStore);
  const products = useStore(productsStore, s => s.products);
  
  if (loading) return <CartLoadingSkeleton />;
  
  if (items.length === 0) {
    return (
      <div className="bg-card p-6 rounded-lg">
        <h3 className="font-semibold mb-4">Shopping Cart</h3>
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Your cart is empty</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card p-6 rounded-lg sticky top-24">
      <h3 className="font-semibold mb-4">
        Shopping Cart ({itemCount} items)
      </h3>
      
      <div className="space-y-3 mb-6">
        {items.map(item => {
          const product = products.find(p => p.id === item.productId);
          if (!product) return null;
          
          return <CartItem key={item.productId} item={item} product={product} />;
        })}
      </div>
      
      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-lg font-bold mb-4">
          <span>Total:</span>
          <span className="text-green-600">${total.toFixed(2)}</span>
        </div>
        
        <Button className="w-full" size="lg">
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
```

#### 4.2 Cart Item Component
```tsx
function CartItem({ item, product }: { item: CartItem; product: Product }) {
  const updateQuantity = (newQuantity: number) => {
    if (newQuantity === 0) {
      // Remove item
      const index = cartStore.items.findIndex(i => i.productId === item.productId);
      cartStore.items.splice(index, 1);
    } else {
      // Update quantity
      const cartItem = cartStore.items.find(i => i.productId === item.productId);
      if (cartItem) {
        cartItem.quantity = newQuantity;
      }
    }
    
    calculateCartTotals(cartStore);
  };
  
  return (
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-lg">
        {product.image}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{product.name}</p>
        <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateQuantity(item.quantity - 1)}
        >
          -
        </Button>
        <span className="w-8 text-center">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateQuantity(item.quantity + 1)}
        >
          +
        </Button>
      </div>
    </div>
  );
}
```

### Phase 5: Educational Components (Day 3)

#### 5.1 Multi-Store Demo Panel
```tsx
function MultiStoreDemo() {
  const [renderCounts, setRenderCounts] = useState({
    products: 0,
    cart: 0,
    user: 0,
  });
  
  // Track component renders
  useEffect(() => {
    setRenderCounts(prev => ({ ...prev, products: prev.products + 1 }));
  }, [useStore(productsStore)]);
  
  useEffect(() => {
    setRenderCounts(prev => ({ ...prev, cart: prev.cart + 1 }));
  }, [useStore(cartStore)]);
  
  useEffect(() => {
    setRenderCounts(prev => ({ ...prev, user: prev.user + 1 }));
  }, [useStore(userStore)]);
  
  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200">
      <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">
        🏪 Multi-Store Architecture Benefits
      </h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{renderCounts.products}</div>
          <div className="text-xs text-blue-700">Products Renders</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{renderCounts.cart}</div>
          <div className="text-xs text-blue-700">Cart Renders</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{renderCounts.user}</div>
          <div className="text-xs text-blue-700">User Renders</div>
        </div>
      </div>
      
      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
        <p>• Each store updates independently</p>
        <p>• Adding to cart doesn't re-render product catalog</p>
        <p>• User login doesn't affect product display</p>
        <p>• Domain separation enables better performance</p>
      </div>
    </div>
  );
}
```

#### 5.2 Performance Comparison
```tsx
function PerformanceComparison() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Traditional State */}
      <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-lg border border-red-200">
        <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3">
          ❌ Traditional Single State
        </h4>
        <div className="text-sm text-red-700 dark:text-red-300 space-y-2">
          <p>• All components re-render on any change</p>
          <p>• Cart update → Product list re-renders</p>
          <p>• User login → Everything re-renders</p>
          <p>• Performance degrades with scale</p>
        </div>
      </div>
      
      {/* Mesa Multi-Store */}
      <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
          ✅ Mesa Multi-Store Pattern
        </h4>
        <div className="text-sm text-green-700 dark:text-green-300 space-y-2">
          <p>• Only relevant components re-render</p>
          <p>• Cart updates don't affect products</p>
          <p>• Independent loading states</p>
          <p>• Scales efficiently with complexity</p>
        </div>
      </div>
    </div>
  );
}
```

### Phase 6: Mock Data & Testing (Day 3 continued)

#### 6.1 Realistic Mock Data
```tsx
export const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Mesa State Management Course',
    description: 'Complete guide to reactive state management',
    price: 49.99,
    category: 'Education',
    image: '📚',
    stock: 15,
    rating: 4.8,
    reviews: 127,
  },
  {
    id: 'prod-002',
    name: 'React Performance Toolkit',
    description: 'Tools and techniques for optimizing React apps',
    price: 79.99,
    category: 'Development',
    image: '⚡',
    stock: 8,
    rating: 4.9,
    reviews: 89,
  },
  {
    id: 'prod-003',
    name: 'TypeScript Pro Bundle',
    description: 'Advanced TypeScript patterns and practices',
    price: 59.99,
    category: 'Development',
    image: '🔷',
    stock: 22,
    rating: 4.7,
    reviews: 156,
  },
  // ... more products
];

export const mockUser = {
  id: 'user-001',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  avatar: '👤',
  preferences: {
    currency: 'USD',
    theme: 'light',
  },
};
```

#### 6.2 API Simulation Functions
```tsx
export const fetchProducts = async (): Promise<Product[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockProducts;
};

export const checkUserSession = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 70% chance of authenticated user
  const isAuthenticated = Math.random() > 0.3;
  
  return {
    user: isAuthenticated ? mockUser : null,
    preferences: isAuthenticated ? mockUser.preferences : { currency: 'USD', theme: 'light' },
  };
};

export const fetchUserCart = async (userId: string): Promise<CartItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Return some pre-existing cart items
  return [
    {
      productId: 'prod-001',
      quantity: 1,
      addedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      productId: 'prod-003',
      quantity: 2,
      addedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
  ];
};
```

#### 6.3 Cart Calculation Utilities
```tsx
export const calculateCartTotals = (cartState: typeof cartStore) => {
  const products = productsStore.products;
  let total = 0;
  let itemCount = 0;
  
  cartState.items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      total += product.price * item.quantity;
      itemCount += item.quantity;
    }
  });
  
  cartState.total = total;
  cartState.itemCount = itemCount;
  
  // Save to localStorage for persistence
  try {
    localStorage.setItem('mesa-cart', JSON.stringify(cartState.items));
  } catch (error) {
    console.warn('Failed to save cart to localStorage:', error);
  }
};
```

## Success Criteria

### ✅ Implementation Must Achieve:

1. **Correct Pattern**: Multi-store architecture matching documentation exactly
2. **Full Functionality**: Complete shopping cart with add/remove/update operations  
3. **Educational Value**: Clear demonstration of multi-store benefits
4. **Performance**: Visible render optimization with independent updates
5. **User Experience**: Smooth, responsive shopping experience
6. **Code Quality**: Clean, maintainable, well-typed implementation

### 🧪 Testing Checklist:

- [ ] Products load correctly from mock API
- [ ] User authentication simulation works
- [ ] Cart persists items across page reloads
- [ ] Add to cart functionality works properly
- [ ] Quantity updates work correctly
- [ ] Remove from cart works properly
- [ ] Totals calculate correctly
- [ ] Cross-store dependencies work without infinite loops
- [ ] Loading states display appropriately
- [ ] Error handling works gracefully
- [ ] Mobile responsiveness maintained
- [ ] Dark mode compatibility preserved

### 📈 Performance Targets:

- [ ] Product catalog doesn't re-render on cart changes
- [ ] Cart sidebar doesn't re-render on product filter changes  
- [ ] User header updates independently
- [ ] No infinite render loops
- [ ] Smooth animations and transitions
- [ ] Fast initial load (< 2 seconds)

This implementation plan will transform the current broken shopping cart into a proper demonstration of Mesa's multi-store architecture, matching the documentation and providing clear educational value.