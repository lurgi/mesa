import { proxy } from "../src/main";

describe("proxy() 함수", () => {
  describe("기본 기능", () => {
    test("원본 값을 보존하는 프록시 객체를 생성해야 함", () => {
      const originalState = { count: 0, name: "John" };
      const state = proxy(originalState);

      expect(state.count).toBe(0);
      expect(state.name).toBe("John");
    });

    test("속성 변경을 허용해야 함", () => {
      const state = proxy({ count: 0 });

      state.count = 5;
      expect(state.count).toBe(5);

      state.count++;
      expect(state.count).toBe(6);
    });

    test("다양한 데이터 타입을 처리해야 함", () => {
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

  describe("속성 연산", () => {
    test("속성 추가를 지원해야 함", () => {
      const state = proxy<any>({ count: 0 });

      state.newProperty = "added";
      expect(state.newProperty).toBe("added");
    });

    test("속성 삭제를 지원해야 함", () => {
      const state = proxy<any>({ count: 0, temp: "delete me" });

      delete state.temp;
      expect(state.temp).toBeUndefined();
      expect("temp" in state).toBe(false);
    });

    test("Object.keys(), Object.values(), Object.entries()를 지원해야 함", () => {
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

  describe("중첩 객체", () => {
    test("중첩 객체 접근을 처리해야 함", () => {
      const state = proxy({
        user: { name: "John", age: 30 },
        settings: { theme: "dark", lang: "en" },
      });

      expect(state.user.name).toBe("John");
      expect(state.user.age).toBe(30);
      expect(state.settings.theme).toBe("dark");
    });

    test("중첩 객체 변경을 처리해야 함", () => {
      const state = proxy({
        user: { name: "John", age: 30 },
      });

      state.user.name = "Jane";
      state.user.age = 25;

      expect(state.user.name).toBe("Jane");
      expect(state.user.age).toBe(25);
    });

    test("깊게 중첩된 객체를 처리해야 함", () => {
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
  });

  describe("배열 연산", () => {
    test("배열 접근과 변경을 처리해야 함", () => {
      const state = proxy({ items: [1, 2, 3] });

      expect(state.items[0]).toBe(1);
      expect(state.items.length).toBe(3);

      state.items.push(4);
      expect(state.items.length).toBe(4);
      expect(state.items[3]).toBe(4);

      state.items[0] = 10;
      expect(state.items[0]).toBe(10);
    });

    test("배열 메서드를 처리해야 함", () => {
      const state = proxy({ items: [1, 2, 3] });

      const popped = state.items.pop();
      expect(popped).toBe(3);
      expect(state.items.length).toBe(2);

      state.items.unshift(0);
      expect(state.items[0]).toBe(0);
      expect(state.items.length).toBe(3);
    });
  });

  describe("엣지 케이스", () => {
    test("빈 객체를 처리해야 함", () => {
      const state = proxy({});

      expect(Object.keys(state)).toEqual([]);

      state.newProp = "value";
      expect(state.newProp).toBe("value");
    });

    test("null과 undefined 값을 처리해야 함", () => {
      const state = proxy<any>({
        nullValue: null,
        undefinedValue: undefined,
      });

      expect(state.nullValue).toBeNull();
      expect(state.undefinedValue).toBeUndefined();
    });

    test("변경되지 않은 객체의 참조 식별성을 보존해야 함", () => {
      const original = { nested: { value: 1 } };
      const state = proxy(original);

      // 프록시는 참조 추적의 어떤 형태를 유지해야 함
      expect(typeof state).toBe("object");
      expect(state !== original).toBe(true); // 다른 참조여야 함
    });

    test("순환 참조를 우아하게 처리해야 함", () => {
      const obj: any = { name: "test" };
      obj.self = obj;

      expect(() => {
        const state = proxy(obj);
        expect(state.name).toBe("test");
        expect(state.self.name).toBe("test");
      }).not.toThrow();
    });
  });

  describe("타입 안전성", () => {
    test("TypeScript 타입 정보를 유지해야 함", () => {
      interface User {
        name: string;
        age: number;
      }

      const state = proxy<User>({ name: "John", age: 30 });

      // TypeScript 오류 없이 작동해야 함
      expect(state.name).toBe("John");
      expect(state.age).toBe(30);

      state.name = "Jane";
      state.age = 25;

      expect(state.name).toBe("Jane");
      expect(state.age).toBe(25);
    });
  });
});
