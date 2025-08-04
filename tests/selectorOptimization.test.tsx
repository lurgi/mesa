import { render, screen, fireEvent, act } from "@testing-library/react";
import { proxy, useStore } from "../src/main";

describe("Selector 실행 최적화", () => {
  describe("불필요한 selector 실행 방지", () => {
    test("관련 없는 속성 변경 시 selector가 실행되지 않아야 함", () => {
      const state = proxy({ count: 0, name: "John", other: "data" });
      let selectorExecutions = 0;

      function TestComponent() {
        const count = useStore(state, (s) => {
          selectorExecutions++;
          return s.count;
        });
        return <div data-testid="count">{count}</div>;
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => state.count++}>카운트 증가</button>
            <button
              onClick={() => {
                state.name = "Jane";
              }}
            >
              이름 변경
            </button>
            <button
              onClick={() => {
                state.other = "changed";
              }}
            >
              관련없는 변경
            </button>
          </div>
        );
      }

      render(<App />);
      const INITIAL_EXECUTIONS = selectorExecutions;

      act(() => {
        fireEvent.click(screen.getByText("카운트 증가"));
      });
      const EXPECTED_AFTER_COUNT_CHANGE = INITIAL_EXECUTIONS + 2;
      expect(selectorExecutions).toBe(EXPECTED_AFTER_COUNT_CHANGE);

      const afterCountChange = selectorExecutions;

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(selectorExecutions).toBe(afterCountChange);

      act(() => {
        fireEvent.click(screen.getByText("관련없는 변경"));
      });
      expect(selectorExecutions).toBe(afterCountChange);
    });

    test("중첩 객체에서 정확한 경로만 selector 실행", () => {
      const state = proxy({
        user: { name: "John", age: 30 },
        settings: { theme: "dark" },
      });

      let userNameExecutions = 0;
      let userAgeExecutions = 0;
      let settingsExecutions = 0;

      function UserNameComponent() {
        const name = useStore(state, (s) => {
          userNameExecutions++;
          return s.user.name;
        });
        return <div data-testid="user-name">{name}</div>;
      }

      function UserAgeComponent() {
        const age = useStore(state, (s) => {
          userAgeExecutions++;
          return s.user.age;
        });
        return <div data-testid="user-age">{age}</div>;
      }

      function SettingsComponent() {
        const theme = useStore(state, (s) => {
          settingsExecutions++;
          return s.settings.theme;
        });
        return <div data-testid="theme">{theme}</div>;
      }

      function App() {
        return (
          <div>
            <UserNameComponent />
            <UserAgeComponent />
            <SettingsComponent />
            <button
              onClick={() => {
                state.user.name = "Jane";
              }}
            >
              이름 변경
            </button>
            <button
              onClick={() => {
                state.user.age = 31;
              }}
            >
              나이 변경
            </button>
            <button
              onClick={() => {
                state.settings.theme = "light";
              }}
            >
              테마 변경
            </button>
          </div>
        );
      }

      render(<App />);

      const INITIAL_USER_NAME_EXEC = userNameExecutions;
      const INITIAL_USER_AGE_EXEC = userAgeExecutions;
      const INITIAL_SETTINGS_EXEC = settingsExecutions;

      // user.name 변경 - 해당 selector만 실행
      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      const EXPECTED_USER_NAME_AFTER_NAME_CHANGE = INITIAL_USER_NAME_EXEC + 3;
      expect(userNameExecutions).toBe(EXPECTED_USER_NAME_AFTER_NAME_CHANGE);
      expect(userAgeExecutions).toBe(INITIAL_USER_AGE_EXEC + 1);
      expect(settingsExecutions).toBe(INITIAL_SETTINGS_EXEC);

      // user.age 변경 - 해당 selector만 실행
      act(() => {
        fireEvent.click(screen.getByText("나이 변경"));
      });
      const EXPECTED_USER_AGE_AFTER_AGE_CHANGE = INITIAL_USER_AGE_EXEC + 4;
      expect(userNameExecutions).toBe(EXPECTED_USER_NAME_AFTER_NAME_CHANGE + 1);
      expect(userAgeExecutions).toBe(EXPECTED_USER_AGE_AFTER_AGE_CHANGE);
      expect(settingsExecutions).toBe(INITIAL_SETTINGS_EXEC);

      // settings.theme 변경 - 해당 selector만 실행
      act(() => {
        fireEvent.click(screen.getByText("테마 변경"));
      });
      const EXPECTED_SETTINGS_AFTER_THEME_CHANGE = INITIAL_SETTINGS_EXEC + 3;
      expect(userNameExecutions).toBe(EXPECTED_USER_NAME_AFTER_NAME_CHANGE + 1);
      expect(userAgeExecutions).toBe(EXPECTED_USER_AGE_AFTER_AGE_CHANGE);
      expect(settingsExecutions).toBe(EXPECTED_SETTINGS_AFTER_THEME_CHANGE);
    });

    test("동일한 값으로 변경 시 selector가 실행되지 않아야 함", () => {
      const state = proxy({ count: 0 });
      let selectorExecutions = 0;

      function TestComponent() {
        const count = useStore(state, (s) => {
          selectorExecutions++;
          return s.count;
        });
        return <div data-testid="count">{count}</div>;
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button
              onClick={() => {
                state.count = 0;
              }}
            >
              같은 값 설정
            </button>
            <button onClick={() => state.count++}>카운트 증가</button>
          </div>
        );
      }

      render(<App />);
      const INITIAL_EXECUTIONS = selectorExecutions;

      act(() => {
        fireEvent.click(screen.getByText("같은 값 설정"));
      });
      expect(selectorExecutions).toBe(INITIAL_EXECUTIONS);

      act(() => {
        fireEvent.click(screen.getByText("카운트 증가"));
      });
      const EXPECTED_AFTER_REAL_CHANGE = INITIAL_EXECUTIONS + 2;
      expect(selectorExecutions).toBe(EXPECTED_AFTER_REAL_CHANGE);
    });
  });

  describe("조건부 selector 최적화", () => {
    test("조건부 selector에서 사용되지 않는 경로는 실행하지 않음", () => {
      const state = proxy({
        useFirstName: true,
        firstName: "John",
        lastName: "Doe",
        unused: "data",
      });

      let selectorExecutions = 0;

      function TestComponent() {
        const displayName = useStore(state, (s) => {
          selectorExecutions++;
          return s.useFirstName ? s.firstName : s.lastName;
        });
        return <div data-testid="display-name">{displayName}</div>;
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button
              onClick={() => {
                state.useFirstName = false;
              }}
            >
              모드 토글
            </button>
            <button
              onClick={() => {
                state.firstName = "Jane";
              }}
            >
              이름 변경
            </button>
            <button
              onClick={() => {
                state.lastName = "Smith";
              }}
            >
              성 변경
            </button>
            <button
              onClick={() => {
                state.unused = "changed";
              }}
            >
              사용되지 않는 속성 변경
            </button>
          </div>
        );
      }

      render(<App />);
      const INITIAL_EXECUTIONS = selectorExecutions;
      expect(screen.getByTestId("display-name")).toHaveTextContent("John");

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });

      const EXPECTED_AFTER_FIRSTNAME_CHANGE = INITIAL_EXECUTIONS + 2;
      expect(selectorExecutions).toBe(EXPECTED_AFTER_FIRSTNAME_CHANGE);
      expect(screen.getByTestId("display-name")).toHaveTextContent("Jane");

      const afterFirstNameChange = selectorExecutions;

      act(() => {
        fireEvent.click(screen.getByText("성 변경"));
      });
      expect(selectorExecutions).toBe(afterFirstNameChange);

      act(() => {
        fireEvent.click(screen.getByText("사용되지 않는 속성 변경"));
      });
      expect(selectorExecutions).toBe(afterFirstNameChange);

      act(() => {
        fireEvent.click(screen.getByText("모드 토글"));
      });
      const EXPECTED_AFTER_MODE_TOGGLE = afterFirstNameChange + 2;
      expect(selectorExecutions).toBe(EXPECTED_AFTER_MODE_TOGGLE);
      expect(screen.getByTestId("display-name")).toHaveTextContent("Smith");

      const afterModeToggle = selectorExecutions;

      act(() => {
        fireEvent.click(screen.getByText("성 변경"));
      });
      const EXPECTED_AFTER_LASTNAME_CHANGE = afterModeToggle;
      expect(selectorExecutions).toBe(EXPECTED_AFTER_LASTNAME_CHANGE);

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(selectorExecutions).toBe(EXPECTED_AFTER_LASTNAME_CHANGE);
    });
  });

  describe("복합 selector 최적화", () => {
    test("복잡한 계산을 포함한 selector 최적화", () => {
      const state = proxy({
        items: [1, 2, 3, 4, 5],
        multiplier: 2,
        offset: 10,
      });

      let selectorExecutions = 0;
      let expensiveCalculations = 0;

      function TestComponent() {
        const result = useStore(state, (s) => {
          selectorExecutions++;
          const calculated = s.items.map((item) => {
            expensiveCalculations++;
            return item * s.multiplier + s.offset;
          });
          return calculated.reduce((sum, val) => sum + val, 0);
        });
        return <div data-testid="result">{result}</div>;
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button
              onClick={() => {
                state.multiplier = 3;
              }}
            >
              배수 변경
            </button>
            <button
              onClick={() => {
                state.offset = 20;
              }}
            >
              오프셋 변경
            </button>
            <button
              onClick={() => {
                state.items.push(6);
              }}
            >
              아이템 추가
            </button>
          </div>
        );
      }

      render(<App />);
      const INITIAL_SELECTOR_EXEC = selectorExecutions;
      const INITIAL_EXPENSIVE_CALC = expensiveCalculations;

      act(() => {
        fireEvent.click(screen.getByText("배수 변경"));
      });
      const EXPECTED_SELECTOR_AFTER_MULTIPLIER = INITIAL_SELECTOR_EXEC + 2;
      const EXPECTED_EXPENSIVE_AFTER_MULTIPLIER = INITIAL_EXPENSIVE_CALC + 10; // 5 items * 2 executions
      expect(selectorExecutions).toBe(EXPECTED_SELECTOR_AFTER_MULTIPLIER);
      expect(expensiveCalculations).toBe(EXPECTED_EXPENSIVE_AFTER_MULTIPLIER);

      const afterMultiplierChange = { selector: selectorExecutions, expensive: expensiveCalculations };

      act(() => {
        fireEvent.click(screen.getByText("오프셋 변경"));
      });
      const EXPECTED_SELECTOR_AFTER_OFFSET = afterMultiplierChange.selector + 2;
      const EXPECTED_EXPENSIVE_AFTER_OFFSET = afterMultiplierChange.expensive + 10; // 5 items * 2 executions
      expect(selectorExecutions).toBe(EXPECTED_SELECTOR_AFTER_OFFSET);
      expect(expensiveCalculations).toBe(EXPECTED_EXPENSIVE_AFTER_OFFSET);

      act(() => {
        fireEvent.click(screen.getByText("아이템 추가"));
      });
      expect(selectorExecutions).toBeGreaterThan(EXPECTED_SELECTOR_AFTER_OFFSET);
      expect(expensiveCalculations).toBeGreaterThan(EXPECTED_EXPENSIVE_AFTER_OFFSET);
    });
  });
});
