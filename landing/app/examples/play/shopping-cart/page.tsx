"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { proxy, useStore, useInitSync } from "mesa-react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  User,
  Star,
  Plus,
  Minus,
  Trash2,
  Heart,
  Search,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  stock: number;
  discount?: number;
}

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  addedAt: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  address?: {
    street: string;
    city: string;
    zipCode: string;
  };
  preferences: {
    currency: string;
    theme: string;
  };
}

// =============================================================================
// REACTIVE STORES
// =============================================================================

const productsStore = proxy({
  products: [] as Product[],
  categories: [] as string[],
  loading: true,
  error: null as string | null,
});

const userStore = proxy({
  user: null as User | null,
  isAuthenticated: false,
  preferences: { currency: "USD", theme: "light" },
  loading: true,
  error: null as string | null,
});

const cartStore = proxy({
  items: [] as CartItem[],
  total: 0,
  discount: 0,
  itemCount: 0,
  loading: true,
  error: null as string | null,
});

// =============================================================================
// MOCK DATA & API FUNCTIONS
// =============================================================================

const mockProducts: Product[] = [
  {
    id: "prod-001",
    name: "Premium Wireless Headphones",
    price: 299.99,
    description: "High-quality wireless headphones with noise cancellation",
    category: "Electronics",
    image: "🎧",
    rating: 4.8,
    reviews: 1205,
    stock: 15,
  },
  {
    id: "prod-002",
    name: "Ergonomic Office Chair",
    price: 449.99,
    description: "Comfortable office chair with lumbar support",
    category: "Furniture",
    image: "🪑",
    rating: 4.6,
    reviews: 892,
    stock: 8,
  },
  {
    id: "prod-003",
    name: "Organic Coffee Beans",
    price: 24.99,
    description: "Premium organic coffee beans from Colombia",
    category: "Food & Beverage",
    image: "☕",
    rating: 4.9,
    reviews: 356,
    stock: 50,
  },
];

const mockUser: User = {
  id: "user-001",
  name: "Alex Johnson",
  email: "alex@example.com",
  avatar: "👤",
  preferences: {
    currency: "USD",
    theme: "light",
  },
};

// API Mock Functions
const fetchProducts = async (): Promise<{
  products: Product[];
  categories: string[];
}> => {
  console.log("🔄 Fetching products...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const categories = Array.from(new Set(mockProducts.map((p) => p.category)));
  console.log("✅ Products fetched successfully");

  return {
    products: mockProducts,
    categories: categories,
  };
};

const fetchUser = async (): Promise<{
  user: User | null;
  isAuthenticated: boolean;
}> => {
  console.log("🔄 Fetching user session...");
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simulate 80% chance of authenticated user
  const isAuthenticated = Math.random() > 0.2;
  console.log(`✅ User session fetched: ${isAuthenticated ? "authenticated" : "guest"}`);

  return {
    user: isAuthenticated ? mockUser : null,
    isAuthenticated,
  };
};

const fetchCart = async (userId?: string): Promise<CartItem[]> => {
  console.log("🔄 Fetching cart data...");
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Mock some existing cart items for authenticated users
  if (userId) {
    console.log("✅ Cart data fetched for authenticated user");
    return [
      {
        productId: "prod-001",
        quantity: 1,
        price: 299.99,
        addedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    ];
  } else {
    // Check localStorage for guest cart
    try {
      const savedCart = localStorage.getItem("mesa-shopping-cart");
      const cartItems = savedCart ? JSON.parse(savedCart) : [];
      console.log("✅ Cart data fetched from localStorage");
      return cartItems;
    } catch (error) {
      console.warn("Failed to parse saved cart:", error);
      return [];
    }
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const calculateCartTotals = () => {
  const products = productsStore.products;
  let total = 0;
  let itemCount = 0;

  cartStore.items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      const itemTotal = product.price * item.quantity;
      total += itemTotal;
      itemCount += item.quantity;
    }
  });

  cartStore.total = total - cartStore.discount;
  cartStore.itemCount = itemCount;

  // Save to localStorage
  try {
    localStorage.setItem("mesa-shopping-cart", JSON.stringify(cartStore.items));
  } catch (error) {
    console.warn("Failed to save cart to localStorage:", error);
  }
};

// =============================================================================
// INITIALIZATION HOOKS
// =============================================================================

function useProductsInitialization() {
  useInitSync(
    productsStore,
    async (state) => {
      const data = await fetchProducts();
      state.products = data.products;
      state.categories = data.categories;
      state.loading = false;
    },
    {
      onError: (error) => {
        console.error("Products initialization failed:", error);
      },
    }
  );
}

function useUserInitialization() {
  useInitSync(
    userStore,
    async (state) => {
      const data = await fetchUser();
      state.user = data.user;
      state.isAuthenticated = data.isAuthenticated;
      state.preferences = data.user?.preferences || {
        currency: "USD",
        theme: "light",
      };
      state.loading = false;
    },
    {
      onError: (error) => {
        console.error("User initialization failed:", error);
      },
    }
  );
}

function useCartInitialization() {
  const isUserReady = useStore(userStore, (s) => !s.loading);

  useInitSync(
    cartStore,
    async (state) => {
      if (!isUserReady) return; // Wait for user data

      const userId = userStore.isAuthenticated ? userStore.user?.id : undefined;
      const items = await fetchCart(userId);
      state.items = items;
      calculateCartTotals();
      state.loading = false;
    },
    {
      deps: [isUserReady],
      onError: (error) => {
        console.error("Cart initialization failed:", error);
      },
    }
  );
}

// =============================================================================
// ERROR & LOADING COMPONENTS
// =============================================================================

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  console.error(error);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">We encountered an error loading the shopping cart.</p>
          <div className="space-y-3">
            <Button onClick={resetErrorBoundary} className="w-full">
              Try again
            </Button>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading Shopping Cart</h2>
          <p className="text-muted-foreground mb-6">Setting up your shopping experience...</p>
          <div className="space-y-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
            <p className="text-sm text-muted-foreground">Initializing stores and loading data</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STORE MANAGER
// =============================================================================

function StoreManager({ children }: { children: React.ReactNode }) {
  console.log("🏢 StoreManager render - starting initialization");

  // Initialize all stores
  useProductsInitialization();
  useUserInitialization();
  useCartInitialization();

  // Check if all stores are ready
  const productsReady = useStore(productsStore, (s) => !s.loading);
  const userReady = useStore(userStore, (s) => !s.loading);
  const cartReady = useStore(cartStore, (s) => !s.loading);

  const allReady = productsReady && userReady && cartReady;

  console.log(`🏪 Store status: products=${productsReady}, user=${userReady}, cart=${cartReady}`);

  if (!allReady) {
    return <LoadingFallback />;
  }

  return <>{children}</>;
}

// =============================================================================
// CART ACTIONS
// =============================================================================

const addToCart = (productId: string) => {
  const existingItem = cartStore.items.find((item) => item.productId === productId);
  const product = productsStore.products.find((p) => p.id === productId);

  if (!product) return;

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartStore.items.push({
      productId,
      quantity: 1,
      price: product.price,
      addedAt: new Date(),
    });
  }

  calculateCartTotals();
};

const updateCartQuantity = (productId: string, quantity: number) => {
  const itemIndex = cartStore.items.findIndex((item) => item.productId === productId);

  if (itemIndex === -1) return;

  if (quantity <= 0) {
    cartStore.items.splice(itemIndex, 1);
  } else {
    cartStore.items[itemIndex].quantity = quantity;
  }

  calculateCartTotals();
};

const removeFromCart = (productId: string) => {
  cartStore.items = cartStore.items.filter((item) => item.productId !== productId);
  calculateCartTotals();
};

// =============================================================================
// UI COMPONENTS
// =============================================================================

function ProductCard({ product }: { product: Product }) {
  const cartItems = useStore(cartStore, (s) => s.items);
  const cartItem = cartItems.find((item) => item.productId === product.id);
  const inCart = !!cartItem;
  const quantity = cartItem?.quantity || 0;

  const discountPrice = product.discount ? product.price * (1 - product.discount / 100) : product.price;

  return (
    <div className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow">
      {/* Product Image */}
      <div className="text-4xl mb-3 text-center">{product.image}</div>

      {/* Product Info */}
      <div className="space-y-2 mb-4">
        <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          {product.discount ? (
            <>
              <span className="text-lg font-bold text-primary">${discountPrice.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through">${product.price.toFixed(2)}</span>
              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">-{product.discount}%</span>
            </>
          ) : (
            <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              product.stock > 10 ? "bg-green-500" : product.stock > 0 ? "bg-yellow-500" : "bg-red-500"
            )}
          />
          <span className="text-sm text-muted-foreground">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {!inCart ? (
          <Button onClick={() => addToCart(product.id)} disabled={product.stock === 0} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => updateCartQuantity(product.id, quantity - 1)}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="flex-1 text-center font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateCartQuantity(product.id, quantity + 1)}
              disabled={quantity >= product.stock}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full">
          <Heart className="w-4 h-4 mr-2" />
          Add to Wishlist
        </Button>
      </div>
    </div>
  );
}

function ProductGrid() {
  const products = useStore(productsStore, (s) => s.products);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const categories = useStore(productsStore, (s) => s.categories);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        <div className="text-sm text-muted-foreground">{filteredProducts.length} products</div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

function CartItem({ item }: { item: CartItem }) {
  const products = useStore(productsStore, (s) => s.products);
  const product = products.find((p) => p.id === item.productId);

  if (!product) return null;

  const itemTotal = product.price * item.quantity;

  return (
    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
      <div className="text-2xl">{product.image}</div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm leading-tight">{product.name}</h4>
        <p className="text-xs text-muted-foreground">${product.price.toFixed(2)} each</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
        >
          <Minus className="w-3 h-3" />
        </Button>

        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>

        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
          disabled={item.quantity >= product.stock}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <div className="text-right">
        <div className="font-medium text-sm">${itemTotal.toFixed(2)}</div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground"
          onClick={() => removeFromCart(item.productId)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function ShoppingCartSidebar() {
  const items = useStore(cartStore, (s) => s.items);
  const total = useStore(cartStore, (s) => s.total);
  const itemCount = useStore(cartStore, (s) => s.itemCount);

  if (items.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Shopping Cart</h2>
        </div>

        <div className="text-center py-8">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground">Add some products to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Shopping Cart</h2>
        </div>
        <span className="text-sm text-muted-foreground">{itemCount} items</span>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <CartItem key={item.productId} item={item} />
        ))}
      </div>

      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Subtotal:</span>
          <span className="font-medium">${total.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Shipping:</span>
          <span>Free</span>
        </div>

        <div className="flex items-center justify-between text-lg font-bold border-t pt-3">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <Button className="w-full mt-4">
          <CreditCard className="w-4 h-4 mr-2" />
          Proceed to Checkout
        </Button>

        <Button variant="outline" className="w-full">
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}

function UserProfile() {
  const user = useStore(userStore, (s) => s.user);
  const isAuthenticated = useStore(userStore, (s) => s.isAuthenticated);

  return (
    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        {user?.avatar || <User className="w-5 h-5 text-primary" />}
      </div>
      <div>
        <div className="font-medium">{isAuthenticated ? user?.name : "Guest User"}</div>
        <div className="text-sm text-muted-foreground">{isAuthenticated ? user?.email : "Shopping as guest"}</div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN SHOPPING CART APP
// =============================================================================

function ShoppingCartApp() {
  console.log("🎯 ShoppingCartApp render");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/docs/examples"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Examples
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Mesa <span className="text-primary">Shopping Cart</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              A complete shopping cart implementation showcasing Mesa&apos;s
              <code className="px-2 py-1 bg-muted rounded text-sm">useInitSync</code> with multi-store architecture,
              Suspense, and ErrorBoundary integration.
            </p>
          </div>

          {/* User Profile */}
          <div className="max-w-sm mx-auto mb-8">
            <UserProfile />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Products Grid */}
          <div className="xl:col-span-3">
            <ProductGrid />
          </div>

          {/* Shopping Cart Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-8">
              <ShoppingCartSidebar />
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-12 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Mesa Debug Info - Store Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-blue-600">Products Store</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-white text-xs",
                      productsStore.loading ? "bg-yellow-500" : "bg-green-500"
                    )}
                  >
                    {productsStore.loading ? "true" : "false"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Products:</span>
                  <span className="font-medium">{productsStore.products.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Categories:</span>
                  <span className="font-medium">{productsStore.categories.length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-green-600">User Store</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-white text-xs",
                      userStore.loading ? "bg-yellow-500" : "bg-green-500"
                    )}
                  >
                    {userStore.loading ? "true" : "false"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Authenticated:</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-white text-xs",
                      userStore.isAuthenticated ? "bg-green-500" : "bg-gray-500"
                    )}
                  >
                    {userStore.isAuthenticated ? "yes" : "no"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>User:</span>
                  <span className="font-medium">{userStore.user?.name || "Guest"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-purple-600">Cart Store</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-white text-xs",
                      cartStore.loading ? "bg-yellow-500" : "bg-green-500"
                    )}
                  >
                    {cartStore.loading ? "true" : "false"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-medium">{cartStore.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium">${cartStore.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              <strong>Mesa Features Demo:</strong> Multi-store architecture • useInitSync initialization • Fine-grained
              reactivity • Suspense & ErrorBoundary integration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function ShoppingCartPlayPage() {
  console.log("🔍 ShoppingCartPlayPage render - entry point");

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
      )}
    >
      <Suspense fallback={<LoadingFallback />}>
        <StoreManager>
          <ShoppingCartApp />
        </StoreManager>
      </Suspense>
    </ErrorBoundary>
  );
}
