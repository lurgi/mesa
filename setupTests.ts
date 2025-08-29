import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  // Clean up React components
  cleanup();
  // Clear all timers
  vi.clearAllTimers();
  // Clear all mocks
  vi.clearAllMocks();
});
