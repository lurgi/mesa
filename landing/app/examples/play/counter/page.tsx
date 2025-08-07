"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { proxy, useStore } from "mesa-react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Target,
  Zap,
  BarChart3,
  Eye,
  Settings,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Create reactive state - minimal and focused
const counterState = proxy({
  count: 0,
  step: 1,
});

// Simple render counter (outside of reactive state to avoid circular updates)
const renderCounts = {
  CounterDisplay: 0,
  CounterControls: 0,
  StepSelector: 0,
};

// Helper function to log renders
const logRender = (componentName: string, reason: string = "state change") => {
  console.log(`🔄 ${componentName} rendered - ${reason}`);
  renderCounts[componentName as keyof typeof renderCounts]++;
};

// Simple header
function PlaygroundHeader() {
  const [totalRenders, setTotalRenders] = useState(0);

  // Update total renders periodically to avoid circular dependencies
  useEffect(() => {
    const interval = setInterval(() => {
      const total = Object.values(renderCounts).reduce((sum, count) => sum + count, 0);
      setTotalRenders(total);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mesa Counter Playground</h1>
          <p className="text-muted-foreground max-w-2xl">
            Interactive demonstration of fine-grained reactivity. Watch how each component updates independently when
            only their subscribed data changes.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{totalRenders} total renders</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Counter display component with animations
function CounterDisplay() {
  // Only re-renders when count changes
  const count = useStore(counterState, (s) => s.count);
  const [prevCount, setPrevCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    logRender("CounterDisplay", "count changed");

    if (count !== prevCount) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
      setPrevCount(count);
    }
  }, [count, prevCount]);

  return (
    <div
      className={cn(
        "text-center p-8 rounded-xl border transition-all duration-300",
        "bg-card hover:shadow-md",
        isAnimating && "ring-2 ring-primary/50 ring-offset-2"
      )}
    >
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Current Count</h2>
        </div>
        <div className="text-xs text-muted-foreground">
          Only re-renders when count changes • Render count: {renderCounts.CounterDisplay}
        </div>
      </div>

      <div
        className={cn(
          "text-7xl md:text-8xl font-bold mb-4 transition-all duration-300",
          "bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent",
          isAnimating && "scale-110"
        )}
      >
        {count}
      </div>

      <div className="text-sm text-muted-foreground">Independent from step, stats, and history updates</div>
    </div>
  );
}

// Control buttons component with keyboard support
function CounterControls() {
  // Only re-renders when step changes
  const step = useStore(counterState, (s) => s.step);

  useEffect(() => {
    logRender("CounterControls", "step changed");
  }, [step]);

  const increment = useCallback(() => {
    counterState.count += step;
  }, [step]);

  const decrement = useCallback(() => {
    counterState.count -= step;
  }, [step]);

  const reset = useCallback(() => {
    counterState.count = 0;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          counterState.count += 1;
          break;
        case "ArrowUp":
          e.preventDefault();
          increment();
          break;
        case "ArrowDown":
          e.preventDefault();
          decrement();
          break;
        case "r":
        case "R":
          e.preventDefault();
          reset();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [step, increment, decrement, reset]);

  return (
    <div className="p-6 rounded-xl bg-card border">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Controls</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Step: {step}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Only re-renders when step changes • Render count: {renderCounts.CounterControls}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Button onClick={increment} className="flex-1 bg-green-500 hover:bg-green-600 text-white" size="lg">
          <ArrowUp className="h-4 w-4 mr-2" />+{step}
        </Button>
        <Button onClick={decrement} className="flex-1 bg-red-500 hover:bg-red-600 text-white" size="lg">
          <ArrowDown className="h-4 w-4 mr-2" />-{step}
        </Button>
        <Button onClick={reset} variant="outline" size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        <div className="mb-1">Keyboard shortcuts:</div>
        <div className="font-mono">
          Space: +1 • ↑: +{step} • ↓: -{step} • R: Reset
        </div>
      </div>
    </div>
  );
}

// Step size selector
function StepSelector() {
  // Only re-renders when step changes
  const step = useStore(counterState, (s) => s.step);

  useEffect(() => {
    logRender("StepSelector", "step changed");
  }, [step]);

  const stepOptions = [1, 5, 10, 100];

  return (
    <div className="p-6 rounded-xl bg-card border">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Step Size</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          Only re-renders when step changes • Render count: {renderCounts.StepSelector}
        </div>
      </div>

      <div className="space-y-4">
        <select
          value={step}
          onChange={(e) => (counterState.step = Number(e.target.value))}
          className="w-full p-3 rounded-lg border bg-background text-center font-semibold text-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {stepOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-4 gap-2">
          {stepOptions.map((option) => (
            <Button
              key={option}
              variant={step === option ? "default" : "outline"}
              size="sm"
              onClick={() => (counterState.step = option)}
              className="w-full"
            >
              {option}
            </Button>
          ))}
        </div>

        <div className="text-xs text-center text-muted-foreground">Current increment/decrement amount</div>
      </div>
    </div>
  );
}

// Simple render tracker display
function RenderInfo() {
  const [counts, setCounts] = useState(renderCounts);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounts({ ...renderCounts });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 rounded-xl bg-card border">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Component Render Counts</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          Each component only re-renders when its specific data changes
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(counts).map(([component, count]) => (
          <div key={component} className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="text-3xl font-bold text-primary mb-1">{count}</div>
            <div className="text-xs font-medium text-muted-foreground">
              {component.replace(/([A-Z])/g, " $1").trim()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Educational info panel
function InfoPanel() {
  return (
    <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
          <Lightbulb className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Understanding Fine-Grained Reactivity</h3>

          <div className="space-y-4 text-sm text-blue-700 dark:text-blue-300">
            <div>
              <h4 className="font-medium mb-2">🎯 What You&apos;re Seeing:</h4>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Each component only re-renders when ITS subscribed data changes</li>
                <li>• Console logs show exactly which components render and when</li>
                <li>• Render counters prove components update independently</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">⚡ Try This:</h4>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Increment the counter → Only CounterDisplay re-renders</li>
                <li>• Change step size → Only CounterControls and StepSelector re-render</li>
                <li>• Use keyboard shortcuts → Space: +1, ↑: +step, ↓: -step, R: reset</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔍 In Traditional React:</h4>
              <p className="text-xs">
                ALL components would re-render on ANY state change. Mesa prevents this with fine-grained subscriptions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main app component
function CounterApp() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PlaygroundHeader />

      {/* Main counter display */}
      <CounterDisplay />

      {/* Controls and settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CounterControls />
        <StepSelector />
      </div>

      {/* Render info and education */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RenderInfo />
        <InfoPanel />
      </div>
    </div>
  );
}

// Main Page Component
export default function CounterPlayPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/docs/examples/counter"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Counter Documentation
          </Link>
        </div>

        <CounterApp />
      </div>
    </div>
  );
}
