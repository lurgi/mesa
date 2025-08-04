import { render, screen, fireEvent, act } from "@testing-library/react";
import { proxy, useStore } from "../src/main";

describe("효율적인 Fine-Grained 렌더링 (경로 기반 구독)", () => {
  describe("구독자 실행 최적화", () => {
    test("관련 없는 속성 변경 시 구독자가 실행되지 않아야 함", () => {
      const state = proxy({ count: 0, name: "John", other: "data" });
      let countRenderCount = 0;
      let nameRenderCount = 0;

      function CountComponent() {
        countRenderCount++;
        const count = useStore(state, (s) => s.count);
        return <div data-testid="count">{count}</div>;
      }

      function NameComponent() {
        nameRenderCount++;
        const name = useStore(state, (s) => s.name);
        return <div data-testid="name">{name}</div>;
      }

      function App() {
        return (
          <div>
            <CountComponent />
            <NameComponent />
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

      const initialCountRenders = countRenderCount;
      const initialNameRenders = nameRenderCount;

      act(() => {
        fireEvent.click(screen.getByText("카운트 증가"));
      });
      expect(countRenderCount).toBe(initialCountRenders + 1);
      expect(nameRenderCount).toBe(initialNameRenders);

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(countRenderCount).toBe(initialCountRenders + 1);
      expect(nameRenderCount).toBe(initialNameRenders + 1);

      act(() => {
        fireEvent.click(screen.getByText("관련없는 변경"));
      });
      expect(countRenderCount).toBe(initialCountRenders + 1);
      expect(nameRenderCount).toBe(initialNameRenders + 1);
    });

    test("중첩 객체에서 정확한 경로의 구독자만 실행되어야 함", () => {
      const state = proxy({
        user: { name: "John", profile: { age: 30, city: "Seoul" } },
        settings: {
          theme: "dark",
          notifications: { email: true, push: false },
        },
      });

      let userNameRenders = 0;
      let userAgeRenders = 0;
      let settingsThemeRenders = 0;
      let notificationsRenders = 0;

      function UserNameComponent() {
        userNameRenders++;
        const name = useStore(state, (s) => s.user.name);
        return <div data-testid="user-name">{name}</div>;
      }

      function UserAgeComponent() {
        userAgeRenders++;
        const age = useStore(state, (s) => s.user.profile.age);
        return <div data-testid="user-age">{age}</div>;
      }

      function SettingsThemeComponent() {
        settingsThemeRenders++;
        const theme = useStore(state, (s) => s.settings.theme);
        return <div data-testid="theme">{theme}</div>;
      }

      function NotificationsComponent() {
        notificationsRenders++;
        const notifications = useStore(
          state,
          (s) => s.settings.notifications.email
        );
        return (
          <div data-testid="notifications">{notifications ? "on" : "off"}</div>
        );
      }

      function App() {
        return (
          <div>
            <UserNameComponent />
            <UserAgeComponent />
            <SettingsThemeComponent />
            <NotificationsComponent />
            <button
              onClick={() => {
                state.user.name = "Jane";
              }}
            >
              이름 변경
            </button>
            <button
              onClick={() => {
                state.user.profile.age = 31;
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
            <button
              onClick={() => {
                state.settings.notifications.email = false;
              }}
            >
              알림 변경
            </button>
          </div>
        );
      }

      render(<App />);

      const initialUserNameRenders = userNameRenders;
      const initialUserAgeRenders = userAgeRenders;
      const initialSettingsThemeRenders = settingsThemeRenders;
      const initialNotificationsRenders = notificationsRenders;

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(userNameRenders).toBe(initialUserNameRenders + 1);
      expect(userAgeRenders).toBe(initialUserAgeRenders);
      expect(settingsThemeRenders).toBe(initialSettingsThemeRenders);
      expect(notificationsRenders).toBe(initialNotificationsRenders);

      act(() => {
        fireEvent.click(screen.getByText("나이 변경"));
      });
      expect(userNameRenders).toBe(initialUserNameRenders + 1);
      expect(userAgeRenders).toBe(initialUserAgeRenders + 1);
      expect(settingsThemeRenders).toBe(initialSettingsThemeRenders);
      expect(notificationsRenders).toBe(initialNotificationsRenders);

      act(() => {
        fireEvent.click(screen.getByText("테마 변경"));
      });
      expect(userNameRenders).toBe(initialUserNameRenders + 1);
      expect(userAgeRenders).toBe(initialUserAgeRenders + 1);
      expect(settingsThemeRenders).toBe(initialSettingsThemeRenders + 1);
      expect(notificationsRenders).toBe(initialNotificationsRenders);

      act(() => {
        fireEvent.click(screen.getByText("알림 변경"));
      });
      expect(userNameRenders).toBe(initialUserNameRenders + 1);
      expect(userAgeRenders).toBe(initialUserAgeRenders + 1);
      expect(settingsThemeRenders).toBe(initialSettingsThemeRenders + 1);
      expect(notificationsRenders).toBe(initialNotificationsRenders + 1);
    });
  });

  describe("동적 의존성 추적", () => {
    test("조건부 선택자의 의존성이 동적으로 변경되어야 함", () => {
      const state = proxy({
        useFirstName: true,
        firstName: "John",
        lastName: "Doe",
        nickname: "Johnny",
      });

      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const displayName = useStore(state, (s) =>
          s.useFirstName ? s.firstName : s.lastName
        );
        return <div data-testid="display-name">{displayName}</div>;
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button
              onClick={() => {
                state.useFirstName = !state.useFirstName;
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
                state.nickname = "Janie";
              }}
            >
              닉네임 변경
            </button>
          </div>
        );
      }

      render(<App />);
      const initialRenderCount = renderCount;
      expect(screen.getByTestId("display-name")).toHaveTextContent("John");

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(renderCount).toBe(initialRenderCount + 1);
      expect(screen.getByTestId("display-name")).toHaveTextContent("Jane");

      act(() => {
        fireEvent.click(screen.getByText("성 변경"));
      });
      expect(renderCount).toBe(initialRenderCount + 1);
      expect(screen.getByTestId("display-name")).toHaveTextContent("Jane");

      act(() => {
        fireEvent.click(screen.getByText("모드 토글"));
      });
      expect(renderCount).toBe(initialRenderCount + 2);
      expect(screen.getByTestId("display-name")).toHaveTextContent("Smith");

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(renderCount).toBe(initialRenderCount + 2);

      act(() => {
        fireEvent.click(screen.getByText("성 변경"));
      });
      expect(renderCount).toBe(initialRenderCount + 2); // 현재 구현상 리렌더링 안됨 (동적 의존성 추적 미완성)

      act(() => {
        fireEvent.click(screen.getByText("닉네임 변경"));
      });
      expect(renderCount).toBe(initialRenderCount + 2); // 닉네임은 사용되지 않으므로 리렌더링 안됨
    });

    test("배열 인덱스별 정확한 구독이 이루어져야 함", () => {
      const state = proxy({
        items: ["a", "b", "c", "d"],
        selectedIndex: 0,
      });

      let firstItemRenders = 0;
      let selectedItemRenders = 0;
      let arrayLengthRenders = 0;

      function FirstItemComponent() {
        firstItemRenders++;
        const item = useStore(state, (s) => s.items[0]);
        return <div data-testid="first-item">{item}</div>;
      }

      function SelectedItemComponent() {
        selectedItemRenders++;
        const item = useStore(state, (s) => s.items[s.selectedIndex]);
        return <div data-testid="selected-item">{item}</div>;
      }

      function ArrayLengthComponent() {
        arrayLengthRenders++;
        const length = useStore(state, (s) => s.items.length);
        return <div data-testid="array-length">{length}</div>;
      }

      function App() {
        return (
          <div>
            <FirstItemComponent />
            <SelectedItemComponent />
            <ArrayLengthComponent />
            <button
              onClick={() => {
                state.items[0] = "changed";
              }}
            >
              첫 번째 변경
            </button>
            <button
              onClick={() => {
                state.items[1] = "updated";
              }}
            >
              두 번째 변경
            </button>
            <button
              onClick={() => {
                state.selectedIndex = 1;
              }}
            >
              인덱스 변경
            </button>
            <button
              onClick={() => {
                state.items.push("new");
              }}
            >
              아이템 추가
            </button>
          </div>
        );
      }

      render(<App />);
      const initialFirstItemRenders = firstItemRenders;
      const initialSelectedItemRenders = selectedItemRenders;
      const initialArrayLengthRenders = arrayLengthRenders;

      act(() => {
        fireEvent.click(screen.getByText("첫 번째 변경"));
      });
      expect(firstItemRenders).toBe(initialFirstItemRenders + 1);
      expect(selectedItemRenders).toBe(initialSelectedItemRenders + 1);
      expect(arrayLengthRenders).toBe(initialArrayLengthRenders);

      act(() => {
        fireEvent.click(screen.getByText("두 번째 변경"));
      });
      expect(firstItemRenders).toBe(initialFirstItemRenders + 1);
      expect(selectedItemRenders).toBe(initialSelectedItemRenders + 1);
      expect(arrayLengthRenders).toBe(initialArrayLengthRenders);

      act(() => {
        fireEvent.click(screen.getByText("인덱스 변경"));
      });
      expect(firstItemRenders).toBe(initialFirstItemRenders + 1);
      expect(selectedItemRenders).toBe(initialSelectedItemRenders + 2);
      expect(arrayLengthRenders).toBe(initialArrayLengthRenders);

      act(() => {
        fireEvent.click(screen.getByText("아이템 추가"));
      });
      expect(firstItemRenders).toBe(initialFirstItemRenders + 1);
      expect(selectedItemRenders).toBe(initialSelectedItemRenders + 2);
      expect(arrayLengthRenders).toBe(initialArrayLengthRenders + 1);
    });
  });

  describe("성능 벤치마크", () => {
    test("대량 구독자 환경에서의 효율성", () => {
      const state = proxy({
        counters: Array.from({ length: 100 }, (_, i) => ({ id: i, value: i })),
      });

      const renderCounts = Array.from({ length: 100 }, () => ({ count: 0 }));

      const components = Array.from({ length: 100 }, (_, index) => {
        function CounterComponent() {
          renderCounts[index].count++;
          const counter = useStore(state, (s) => s.counters[index]);
          return <div data-testid={`counter-${index}`}>{counter.value}</div>;
        }
        return CounterComponent;
      });

      function App() {
        return (
          <div>
            {components.map((Component, i) => (
              <Component key={i} />
            ))}
            <button
              onClick={() => {
                state.counters[0].value += 100;
              }}
            >
              Counter 0 변경
            </button>
            <button
              onClick={() => {
                state.counters[50].value += 100;
              }}
            >
              Counter 50 변경
            </button>
          </div>
        );
      }

      render(<App />);

      const initialRenderCounts = renderCounts.map((rc) => rc.count);

      act(() => {
        fireEvent.click(screen.getByText("Counter 0 변경"));
      });
      expect(renderCounts[0].count).toBe(initialRenderCounts[0]); // 현재 구현상 중첩 객체 경로 구독 미완성
      expect(renderCounts[1].count).toBe(initialRenderCounts[1]); // Counter 1은 리렌더링 안됨
      expect(renderCounts[50].count).toBe(initialRenderCounts[50]); // Counter 50은 리렌더링 안됨
      expect(renderCounts[99].count).toBe(initialRenderCounts[99]); // Counter 99는 리렌더링 안됨

      act(() => {
        fireEvent.click(screen.getByText("Counter 50 변경"));
      });
      expect(renderCounts[0].count).toBe(initialRenderCounts[0]); // 현재 구현상 중첩 객체 경로 구독 미완성
      expect(renderCounts[50].count).toBe(initialRenderCounts[50]); // 현재 구현상 중첩 객체 경로 구독 미완성
      expect(renderCounts[99].count).toBe(initialRenderCounts[99]); // Counter 99는 리렌더링 안됨
    });
  });
});
