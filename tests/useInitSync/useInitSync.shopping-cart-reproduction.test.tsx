import { render, screen, waitFor } from "@testing-library/react";
import { proxy, useStore, useInitSync } from "../../src/main";
import { vi } from "vitest";

// Exact types from shopping-cart page.tsx
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  rating: number;
}

interface CartItem extends Product {
  quantity: number;
  addedAt: Date;
}

interface ShoppingState {
  // Product data
  products: Product[];
  categories: string[];
  searchQuery: string;
  selectedCategory: string;

  // Cart data
  cart: CartItem[];

  // Discount system
  couponCode: string;
  appliedDiscount: number;

  // Initialization state
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// Exact mock data from page.tsx
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Mesa Reactive State Guide",
    price: 29.99,
    image: "📚",
    category: "Books",
    stock: 15,
    rating: 4.8,
  },
  {
    id: "2",
    name: "React Performance Toolkit",
    price: 49.99,
    image: "⚡",
    category: "Tools",
    stock: 8,
    rating: 4.9,
  },
  {
    id: "3",
    name: "TypeScript Advanced Patterns",
    price: 39.99,
    image: "🔷",
    category: "Books",
    stock: 12,
    rating: 4.7,
  },
];

// Exact functions from page.tsx
const getPlaceholderProducts = (): Product[] => [
  {
    id: "loading",
    name: "Loading products...",
    price: 0,
    image: "⏳",
    category: "Loading",
    stock: 0,
    rating: 0,
  },
];

const fetchProducts = async (): Promise<Product[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return mockProducts;
};

const fetchUserPreferences = async () => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    defaultCategory: "all",
    favoriteProducts: ["1", "4"],
  };
};

describe("useInitSync Shopping Cart Exact Reproduction", () => {
  let shoppingState: ShoppingState;
  let renderCounts: { main: number; header: number };

  beforeEach(() => {
    renderCounts = { main: 0, header: 0 };

    // Create reactive state exactly like page.tsx
    shoppingState = proxy<ShoppingState>({
      products: [],
      categories: [],
      searchQuery: "",
      selectedCategory: "all",
      cart: [],
      couponCode: "",
      appliedDiscount: 0,
      loading: true,
      error: null,
      initialized: false,
    });

    // Mock localStorage exactly like page.tsx
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() =>
          JSON.stringify([
            {
              id: "1",
              name: "Test Item",
              price: 10,
              image: "📚",
              category: "Books",
              stock: 15,
              rating: 4.8,
              quantity: 2,
              addedAt: new Date(),
            },
          ])
        ),
        setItem: vi.fn(),
      },
      writable: true,
    });
  });

  test("should reproduce the exact Maximum update depth exceeded error from page.tsx", async () => {
    console.log("=== Starting exact shopping-cart reproduction ===");

    // Exact ShopHeader component from page.tsx
    function ShopHeader() {
      renderCounts.header++;
      console.log(`ShopHeader render #${renderCounts.header}`);

      // Exact cartData calculation from page.tsx
      const cartData = useStore(shoppingState, (s) => {
        console.log(
          `ShopHeader useStore selector - cart.length: ${s.cart.length}`
        );

        const cartItemsCount = s.cart.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const cartTotal = s.cart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return {
          cartItemsCount,
          cartTotal,
          loading: s.loading,
        };
      });

      return (
        <div data-testid="shop-header">
          <div data-testid="cart-count">{cartData.cartItemsCount}</div>
          <div data-testid="cart-total">${cartData.cartTotal.toFixed(2)}</div>
          <div data-testid="loading-status">
            {cartData.loading ? "loading" : "ready"}
          </div>
        </div>
      );
    }

    // Exact LoadingState component from page.tsx
    function LoadingState() {
      return (
        <div data-testid="loading">
          <div>Loading Store...</div>
          <p>Setting up your shopping experience</p>
        </div>
      );
    }

    // Exact ShoppingCartApp component from page.tsx
    function ShoppingCartApp() {
      renderCounts.main++;
      console.log(`ShoppingCartApp render #${renderCounts.main}`);

      // Exact useInitSync implementation from page.tsx
      useInitSync(
        shoppingState,
        async (state) => {
          console.log(
            "useInitSync executing - Stage 1: Immediate placeholder data"
          );
          // Stage 1: Immediate placeholder data
          state.loading = true;
          state.products = getPlaceholderProducts();
          state.categories = ["Books", "Tools", "Courses"];

          console.log(
            "useInitSync executing - Stage 2: Restore cart from localStorage"
          );
          // Stage 2: Restore cart from localStorage
          const savedCart = localStorage.getItem("mesa-cart");
          if (savedCart) {
            try {
              state.cart = JSON.parse(savedCart);
              console.log(
                "Cart restored from localStorage:",
                state.cart.length,
                "items"
              );
            } catch (error) {
              console.warn("Failed to restore cart from localStorage:", error);
            }
          }

          console.log(
            "useInitSync executing - Stage 3: Load real data from server"
          );
          // Stage 3: Load real data from server
          const [products, userPreferences] = await Promise.all([
            fetchProducts(),
            fetchUserPreferences(),
          ]);

          state.products = products;
          state.selectedCategory = userPreferences.defaultCategory;
          state.loading = false;
          state.initialized = true;
          console.log("useInitSync completed successfully");
        },
        {
          onError: (error) => {
            console.error("useInitSync onError:", error);
            shoppingState.error = error.message;
            shoppingState.loading = false;
          },
          onSuccess: () => {
            console.log("Shopping cart initialized successfully");
          },
        }
      );

      // Exact state extraction from page.tsx
      const { loading, error, initialized } = useStore(shoppingState, (s) => ({
        loading: s.loading,
        error: s.error,
        initialized: s.initialized,
      }));

      // Check for infinite loop
      if (renderCounts.main > 25) {
        throw new Error(
          `Maximum update depth exceeded reproduction - Main renders: ${renderCounts.main}, Header renders: ${renderCounts.header}`
        );
      }

      // Exact loading condition from page.tsx
      if (loading && !initialized) {
        return <LoadingState />;
      }

      // Exact error condition from page.tsx
      if (error) {
        return (
          <div data-testid="error">
            <div>❌ Error loading store</div>
            <p>{error}</p>
          </div>
        );
      }

      // Exact statsData from page.tsx
      const statsData = useStore(shoppingState, (s) => ({
        productsCount: s.products.length,
        cartCount: s.cart.length,
      }));

      return (
        <div data-testid="shopping-app">
          <ShopHeader />
          <div data-testid="stats">
            Products loaded: {statsData.productsCount} | Cart items:{" "}
            {statsData.cartCount}
          </div>
        </div>
      );
    }

    const { unmount } = render(<ShoppingCartApp />);

    // Should show loading initially
    expect(screen.getByTestId("loading")).toBeInTheDocument();

    try {
      // Wait for initialization to complete
      await waitFor(
        () => {
          expect(screen.getByTestId("shopping-app")).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Check final state matches expectations
      expect(screen.getByTestId("cart-count")).toHaveTextContent("2");
      expect(screen.getByTestId("cart-total")).toHaveTextContent("$20.00");
      expect(screen.getByTestId("loading-status")).toHaveTextContent("ready");
      expect(screen.getByTestId("stats")).toHaveTextContent(
        "Products loaded: 3 | Cart items: 1"
      );

      // This should fail due to infinite renders
      expect(renderCounts.main).toBeLessThan(15);
      expect(renderCounts.header).toBeLessThan(15);

      console.log(
        `✅ Test unexpectedly passed - Main: ${renderCounts.main}, Header: ${renderCounts.header}`
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Test failed as expected: ${error.message}`);
        console.error(
          `Final render counts - Main: ${renderCounts.main}, Header: ${renderCounts.header}`
        );
      }

      // Log the exact error pattern for analysis
      if (
        error instanceof Error &&
        error.message.includes("Maximum update depth exceeded")
      ) {
        console.error(
          "🔍 CONFIRMED: This reproduces the exact same error as page.tsx"
        );
      }

      throw error;
    } finally {
      unmount();
    }
  });
});
