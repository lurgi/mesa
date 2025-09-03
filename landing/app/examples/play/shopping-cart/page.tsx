"use client";

import React, { useState } from "react";
import Link from "next/link";
import { proxy, useStore, useInitSync } from "mesa-react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
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

// Create reactive state
const shoppingState = proxy<ShoppingState>({
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

// Mock data
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
  {
    id: "4",
    name: "State Management Course",
    price: 79.99,
    image: "🎓",
    category: "Courses",
    stock: 20,
    rating: 4.9,
  },
  {
    id: "5",
    name: "Frontend Architecture Bundle",
    price: 89.99,
    image: "🏗️",
    category: "Tools",
    stock: 5,
    rating: 4.6,
  },
  {
    id: "6",
    name: "React Hooks Masterclass",
    price: 59.99,
    image: "🎣",
    category: "Courses",
    stock: 18,
    rating: 4.8,
  },
];

// Mock functions for useInitSync
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

// Header Component
function ShopHeader() {
  // Optimize cart calculations with useMemo-like selector
  const cartData = useStore(shoppingState, (s) => {
    const cartItemsCount = s.cart.reduce((sum, item) => sum + item.quantity, 0);
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
    <div className="mb-8 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Mesa Shopping Cart
            </h1>
            <p className="text-sm text-muted-foreground">
              Experience fine-grained reactivity with complex state calculations
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {cartData.cartItemsCount} items
              </span>
              <span className="text-xs text-muted-foreground">
                ${cartData.cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <ShoppingCart className="h-8 w-8 text-primary animate-pulse" />
      </div>
      <h3 className="text-lg font-medium mb-2">Loading Store...</h3>
      <p className="text-muted-foreground">
        Setting up your shopping experience
      </p>
    </div>
  );
}

// Main Shopping Cart App
function ShoppingCartApp() {
  // Initialize with useInitSync - Progressive Enhancement pattern
  useInitSync(
    shoppingState,
    async (state) => {
      // Stage 1: Immediate placeholder data
      state.loading = true;
      state.products = getPlaceholderProducts();
      state.categories = ["Books", "Tools", "Courses"];

      // Stage 2: Restore cart from localStorage
      const savedCart = localStorage.getItem("mesa-cart");
      if (savedCart) {
        try {
          state.cart = JSON.parse(savedCart);
        } catch (error) {
          console.warn("Failed to restore cart from localStorage:", error);
        }
      }

      // Stage 3: Load real data from server
      const [products, userPreferences] = await Promise.all([
        fetchProducts(),
        fetchUserPreferences(),
      ]);

      state.products = products;
      state.selectedCategory = userPreferences.defaultCategory;
      state.loading = false;
      state.initialized = true;
    },
    {
      onError: (error) => {
        shoppingState.error = error.message;
        shoppingState.loading = false;
      },
      onSuccess: () => {
        console.log("Shopping cart initialized successfully");
      },
    }
  );

  const { loading, error, initialized } = useStore(shoppingState, (s) => ({
    loading: s.loading,
    error: s.error,
    initialized: s.initialized,
  }));

  if (loading && !initialized) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">❌ Error loading store</div>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const statsData = useStore(shoppingState, s => ({
    productsCount: s.products.length,
    cartCount: s.cart.length
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <ShopHeader />

      {/* Main content area - will add more components here */}
      <div className="container mx-auto px-6">
        <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
          <h3 className="text-lg font-medium mb-2">
            Shopping Cart Initialized!
          </h3>
          <p className="text-muted-foreground">
            Ready for product catalog and cart functionality
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            Products loaded: {statsData.productsCount} | Cart items: {statsData.cartCount}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function ShoppingCartPlayPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/docs/examples/shopping-cart"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shopping Cart Documentation
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            Mesa <span className="text-primary">Shopping Cart</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A complete e-commerce experience showcasing Mesa&apos;s fine-grained
            reactivity with complex state calculations, localStorage
            integration, and progressive enhancement.
          </p>
        </div>

        <ShoppingCartApp />
      </div>
    </div>
  );
}
