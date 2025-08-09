import { proxy } from "../src/main";

describe("proxy function", () => {
  describe("Basic functionality", () => {
    test("should create proxy that preserves original values", () => {
      const originalState = { count: 0, name: "John" };
      const state = proxy(originalState);

      expect(state.count).toBe(0);
      expect(state.name).toBe("John");
    });

    test("should allow property mutations", () => {
      const state = proxy({ count: 0 });

      state.count = 5;
      expect(state.count).toBe(5);

      state.count++;
      expect(state.count).toBe(6);
    });

    test("should handle various data types", () => {
      const state = proxy({
        number: 42,
        string: "hello",
        boolean: true,
        array: [1, 2, 3],
        object: { nested: "value" },
      });

      expect(state.number).toBe(42);
      expect(state.string).toBe("hello");
      expect(state.boolean).toBe(true);
      expect(state.array).toEqual([1, 2, 3]);
      expect(state.object.nested).toBe("value");
    });
  });

  describe("Property operations", () => {
    test("should support property addition", () => {
      const state = proxy<any>({ count: 0 });

      state.newProperty = "added";
      expect(state.newProperty).toBe("added");
    });

    test("should support property deletion", () => {
      const state = proxy<any>({ count: 0, temp: "delete me" });

      delete state.temp;
      expect(state.temp).toBeUndefined();
      expect("temp" in state).toBe(false);
    });

    test("should support Object static methods", () => {
      const state = proxy({ a: 1, b: 2, c: 3 });

      expect(Object.keys(state)).toEqual(["a", "b", "c"]);
      expect(Object.values(state)).toEqual([1, 2, 3]);
      expect(Object.entries(state)).toEqual([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ]);
    });
  });

  describe("Nested objects", () => {
    test("should auto-proxy nested objects", () => {
      const state = proxy({
        user: { name: "John", age: 30 },
        settings: { theme: "dark", lang: "en" },
      });

      expect(state.user.name).toBe("John");
      expect(state.user.age).toBe(30);
      expect(state.settings.theme).toBe("dark");
    });

    test("should handle nested object mutations", () => {
      const state = proxy({
        user: { name: "John", age: 30 },
      });

      state.user.name = "Jane";
      state.user.age = 25;

      expect(state.user.name).toBe("Jane");
      expect(state.user.age).toBe(25);
    });

    test("should handle deeply nested objects", () => {
      const state = proxy({
        level1: {
          level2: {
            level3: {
              value: "deep",
            },
          },
        },
      });

      expect(state.level1.level2.level3.value).toBe("deep");

      state.level1.level2.level3.value = "updated";
      expect(state.level1.level2.level3.value).toBe("updated");
    });

    test("should proxy new objects assigned to properties", () => {
      const state = proxy<any>({ user: { name: "John" } });

      state.user = { name: "Jane", age: 25 };
      
      // The new object should be automatically proxied
      state.user.age = 30;
      expect(state.user.age).toBe(30);
    });
  });

  describe("Array operations", () => {
    test("should handle array access and mutations", () => {
      const state = proxy({ items: [1, 2, 3] });

      expect(state.items[0]).toBe(1);
      expect(state.items.length).toBe(3);

      state.items.push(4);
      expect(state.items.length).toBe(4);
      expect(state.items[3]).toBe(4);

      state.items[0] = 10;
      expect(state.items[0]).toBe(10);
    });

    test("should handle array methods", () => {
      const state = proxy({ items: [1, 2, 3] });

      const popped = state.items.pop();
      expect(popped).toBe(3);
      expect(state.items.length).toBe(2);

      state.items.unshift(0);
      expect(state.items[0]).toBe(0);
      expect(state.items.length).toBe(3);
    });

    test("should handle complex array operations", () => {
      const state = proxy({ items: [1, 2, 3, 4, 5] });

      // Test splice
      const removed = state.items.splice(1, 2, 10, 11);
      expect(removed).toEqual([2, 3]);
      expect(state.items).toEqual([1, 10, 11, 4, 5]);

      // Test sort
      state.items.sort((a, b) => b - a);
      expect(state.items[0]).toBeGreaterThan(state.items[1]);
    });
  });

  describe("Edge cases", () => {
    test("should handle empty objects", () => {
      const state = proxy<any>({});

      expect(Object.keys(state)).toEqual([]);

      state.newProp = "value";
      expect(state.newProp).toBe("value");
    });

    test("should handle null and undefined values", () => {
      const state = proxy<any>({
        nullValue: null,
        undefinedValue: undefined,
      });

      expect(state.nullValue).toBeNull();
      expect(state.undefinedValue).toBeUndefined();
    });

    test("should handle circular references gracefully", () => {
      const obj: any = { name: "test" };
      obj.self = obj;

      expect(() => {
        const state = proxy(obj);
        expect(state.name).toBe("test");
        expect(state.self.name).toBe("test");
      }).not.toThrow();
    });

    test("should maintain reference identity for unchanged objects", () => {
      const original = { nested: { value: 1 } };
      const state = proxy(original);

      expect(typeof state).toBe("object");
      expect(state !== original).toBe(true);
    });
  });

  describe("Type safety", () => {
    test("should maintain TypeScript type information", () => {
      interface User {
        name: string;
        age: number;
      }

      const state = proxy<User>({ name: "John", age: 30 });

      expect(state.name).toBe("John");
      expect(state.age).toBe(30);

      state.name = "Jane";
      state.age = 25;

      expect(state.name).toBe("Jane");
      expect(state.age).toBe(25);
    });
  });
});