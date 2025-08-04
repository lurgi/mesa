import { render, screen, fireEvent, act } from "@testing-library/react";
import { proxy, useStore } from "../src/main";

describe("효율적인 Fine-Grained 렌더링 (경로 기반 구독)", () => {
  describe("구독자 실행 최적화", () => {
    test("관련 없는 속성 변경 시 구독자가 실행되지 않아야 함", () => {
      const state = proxy({ count: 0, name: "John", other: "data" });
      let countSelectorCalls = 0;
      let nameSelectorCalls = 0;

      function CountComponent() {
        const count = useStore(state, (s) => {
          countSelectorCalls++;
          return s.count;
        });
        return <div data-testid="count">{count}</div>;
      }

      function NameComponent() {
        const name = useStore(state, (s) => {
          nameSelectorCalls++;
          return s.name;
        });
        return <div data-testid="name">{name}</div>;
      }

      function App() {
        return (
          <div>
            <CountComponent />
            <NameComponent />
            <button onClick={() => state.count++}>카운트 증가</button>
            <button onClick={() => { state.name = "Jane"; }}>이름 변경</button>
            <button onClick={() => { state.other = "changed"; }}>관련없는 변경</button>
          </div>
        );
      }

      render(<App />);
      
      expect(countSelectorCalls).toBe(1);
      expect(nameSelectorCalls).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("카운트 증가"));
      });
      expect(countSelectorCalls).toBe(2);
      expect(nameSelectorCalls).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(countSelectorCalls).toBe(2);
      expect(nameSelectorCalls).toBe(2);

      act(() => {
        fireEvent.click(screen.getByText("관련없는 변경"));
      });
      expect(countSelectorCalls).toBe(2);
      expect(nameSelectorCalls).toBe(2);
    });

    test("중첩 객체에서 정확한 경로의 구독자만 실행되어야 함", () => {
      const state = proxy({
        user: { name: "John", profile: { age: 30, city: "Seoul" } },
        settings: { theme: "dark", notifications: { email: true, push: false } }
      });

      let userNameCalls = 0;
      let userAgeCalls = 0;
      let settingsThemeCalls = 0;
      let notificationsCalls = 0;

      function UserNameComponent() {
        const name = useStore(state, (s) => {
          userNameCalls++;
          return s.user.name;
        });
        return <div data-testid="user-name">{name}</div>;
      }

      function UserAgeComponent() {
        const age = useStore(state, (s) => {
          userAgeCalls++;
          return s.user.profile.age;
        });
        return <div data-testid="user-age">{age}</div>;
      }

      function SettingsThemeComponent() {
        const theme = useStore(state, (s) => {
          settingsThemeCalls++;
          return s.settings.theme;
        });
        return <div data-testid="theme">{theme}</div>;
      }

      function NotificationsComponent() {
        const notifications = useStore(state, (s) => {
          notificationsCalls++;
          return s.settings.notifications.email;
        });
        return <div data-testid="notifications">{notifications ? "on" : "off"}</div>;
      }

      function App() {
        return (
          <div>
            <UserNameComponent />
            <UserAgeComponent />
            <SettingsThemeComponent />
            <NotificationsComponent />
            <button onClick={() => { state.user.name = "Jane"; }}>이름 변경</button>
            <button onClick={() => { state.user.profile.age = 31; }}>나이 변경</button>
            <button onClick={() => { state.settings.theme = "light"; }}>테마 변경</button>
            <button onClick={() => { state.settings.notifications.email = false; }}>알림 변경</button>
          </div>
        );
      }

      render(<App />);

      expect(userNameCalls).toBe(1);
      expect(userAgeCalls).toBe(1);
      expect(settingsThemeCalls).toBe(1);
      expect(notificationsCalls).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(userNameCalls).toBe(2);
      expect(userAgeCalls).toBe(1);
      expect(settingsThemeCalls).toBe(1);
      expect(notificationsCalls).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("나이 변경"));
      });
      expect(userNameCalls).toBe(2);
      expect(userAgeCalls).toBe(2);
      expect(settingsThemeCalls).toBe(1);
      expect(notificationsCalls).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("테마 변경"));
      });
      expect(userNameCalls).toBe(2);
      expect(userAgeCalls).toBe(2);
      expect(settingsThemeCalls).toBe(2);
      expect(notificationsCalls).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("알림 변경"));
      });
      expect(userNameCalls).toBe(2);
      expect(userAgeCalls).toBe(2);
      expect(settingsThemeCalls).toBe(2);
      expect(notificationsCalls).toBe(2);
    });
  });

  describe("동적 의존성 추적", () => {
    test("조건부 선택자의 의존성이 동적으로 변경되어야 함", () => {
      const state = proxy({
        useFirstName: true,
        firstName: "John",
        lastName: "Doe",
        nickname: "Johnny"
      });

      let selectorCalls = 0;

      function TestComponent() {
        const displayName = useStore(state, (s) => {
          selectorCalls++;
          return s.useFirstName ? s.firstName : s.lastName;
        });
        return <div data-testid="display-name">{displayName}</div>;
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => { state.useFirstName = !state.useFirstName; }}>모드 토글</button>
            <button onClick={() => { state.firstName = "Jane"; }}>이름 변경</button>
            <button onClick={() => { state.lastName = "Smith"; }}>성 변경</button>
            <button onClick={() => { state.nickname = "Janie"; }}>닉네임 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(selectorCalls).toBe(1);
      expect(screen.getByTestId("display-name")).toHaveTextContent("John");

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(selectorCalls).toBe(2);
      expect(screen.getByTestId("display-name")).toHaveTextContent("Jane");

      act(() => {
        fireEvent.click(screen.getByText("성 변경"));
      });
      expect(selectorCalls).toBe(2);
      expect(screen.getByTestId("display-name")).toHaveTextContent("Jane");

      act(() => {
        fireEvent.click(screen.getByText("모드 토글"));
      });
      expect(selectorCalls).toBe(3);
      expect(screen.getByTestId("display-name")).toHaveTextContent("Smith");

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(selectorCalls).toBe(3);

      act(() => {
        fireEvent.click(screen.getByText("성 변경"));
      });
      expect(selectorCalls).toBe(4);

      act(() => {
        fireEvent.click(screen.getByText("닉네임 변경"));
      });
      expect(selectorCalls).toBe(4);
    });

    test("배열 인덱스별 정확한 구독이 이루어져야 함", () => {
      const state = proxy({
        items: ["a", "b", "c", "d"],
        selectedIndex: 0
      });

      let firstItemCalls = 0;
      let selectedItemCalls = 0;
      let arrayLengthCalls = 0;

      function FirstItemComponent() {
        const item = useStore(state, (s) => {
          firstItemCalls++;
          return s.items[0];
        });
        return <div data-testid="first-item">{item}</div>;
      }

      function SelectedItemComponent() {
        const item = useStore(state, (s) => {
          selectedItemCalls++;
          return s.items[s.selectedIndex];
        });
        return <div data-testid="selected-item">{item}</div>;
      }

      function ArrayLengthComponent() {
        const length = useStore(state, (s) => {
          arrayLengthCalls++;
          return s.items.length;
        });
        return <div data-testid="array-length">{length}</div>;
      }

      function App() {
        return (
          <div>
            <FirstItemComponent />
            <SelectedItemComponent />
            <ArrayLengthComponent />
            <button onClick={() => { state.items[0] = "changed"; }}>첫 번째 변경</button>
            <button onClick={() => { state.items[1] = "updated"; }}>두 번째 변경</button>
            <button onClick={() => { state.selectedIndex = 1; }}>인덱스 변경</button>
            <button onClick={() => { state.items.push("new"); }}>아이템 추가</button>
          </div>
        );
      }

      render(<App />);
      expect(firstItemCalls).toBe(1);
      expect(selectedItemCalls).toBe(1);
      expect(arrayLengthCalls).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("첫 번째 변경"));
      });
      expect(firstItemCalls).toBe(2);
      expect(selectedItemCalls).toBe(2);
      expect(arrayLengthCalls).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("두 번째 변경"));
      });
      expect(firstItemCalls).toBe(2);
      expect(selectedItemCalls).toBe(2);
      expect(arrayLengthCalls).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("인덱스 변경"));
      });
      expect(firstItemCalls).toBe(2);
      expect(selectedItemCalls).toBe(3);
      expect(arrayLengthCalls).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("아이템 추가"));
      });
      expect(firstItemCalls).toBe(2);
      expect(selectedItemCalls).toBe(2);
      expect(arrayLengthCalls).toBe(2);
    });
  });

  describe("성능 벤치마크", () => {
    test("대량 구독자 환경에서의 효율성", () => {
      const state = proxy({
        counters: Array.from({ length: 100 }, (_, i) => ({ id: i, value: i }))
      });

      const selectorCalls = Array.from({ length: 100 }, () => ({ count: 0 }));

      const components = Array.from({ length: 100 }, (_, index) => {
        function CounterComponent() {
          const counter = useStore(state, (s) => {
            selectorCalls[index].count++;
            return s.counters[index];
          });
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
            <button onClick={() => { state.counters[0].value += 100; }}>Counter 0 변경</button>
            <button onClick={() => { state.counters[50].value += 100; }}>Counter 50 변경</button>
          </div>
        );
      }

      render(<App />);

      for (let i = 0; i < 100; i++) {
        expect(selectorCalls[i].count).toBe(1);
      }

      act(() => {
        fireEvent.click(screen.getByText("Counter 0 변경"));
      });
      expect(selectorCalls[0].count).toBe(2);
      expect(selectorCalls[1].count).toBe(1);
      expect(selectorCalls[50].count).toBe(1);
      expect(selectorCalls[99].count).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("Counter 50 변경"));
      });
      expect(selectorCalls[0].count).toBe(2);
      expect(selectorCalls[50].count).toBe(2);
      expect(selectorCalls[99].count).toBe(1);
    });
  });
});