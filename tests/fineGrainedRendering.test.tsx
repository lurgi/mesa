import { render, screen, fireEvent, act } from "@testing-library/react";
import { proxy, useStore } from "../src/main";

describe("Fine-Grained 렌더링 고급 테스트", () => {
  describe("복합 선택자 시나리오", () => {
    test("선택자 내 함수 호출 결과 변경 감지", () => {
      const state = proxy({ 
        items: ["apple", "banana", "cherry"],
        filter: "a",
        other: { unrelated: 42 }
      });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const filteredItems = useStore(state, (s) => 
          s.items.filter(item => item.includes(s.filter)).length
        );
        return (
          <div>
            <div data-testid="filtered-count">{filteredItems}</div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => { state.items.push("avocado"); }}>아이템 추가</button>
            <button onClick={() => { state.filter = "b"; }}>필터 변경</button>
            <button onClick={() => { state.items[0] = "apricot"; }}>첫 아이템 변경</button>
            <button onClick={() => { state.other.unrelated++; }}>관련없는 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("filtered-count")).toHaveTextContent("1");
      expect(screen.getByTestId("render-count")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("아이템 추가"));
      });
      expect(screen.getByTestId("filtered-count")).toHaveTextContent("2");
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("필터 변경"));
      });
      expect(screen.getByTestId("filtered-count")).toHaveTextContent("1");
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("첫 아이템 변경"));
      });
      expect(screen.getByTestId("filtered-count")).toHaveTextContent("2");
      expect(screen.getByTestId("render-count")).toHaveTextContent("4");

      act(() => {
        fireEvent.click(screen.getByText("관련없는 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("4");
    });

    test("중복 계산 최적화", () => {
      const state = proxy({ x: 1, y: 2, z: 3 });
      let expensiveCalculationCalls = 0;
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const result = useStore(state, (s) => {
          expensiveCalculationCalls++;
          return s.x * s.y + s.z;
        });
        return (
          <div>
            <div data-testid="result">{result}</div>
            <div data-testid="render-count">{renderCount}</div>
            <div data-testid="calc-calls">{expensiveCalculationCalls}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <TestComponent />
            <button onClick={() => { state.x++; }}>X 증가</button>
            <button onClick={() => { state.z = 999; }}>Z 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getAllByTestId("result")[0]).toHaveTextContent("5");
      expect(screen.getAllByTestId("render-count")[0]).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("X 증가"));
      });
      expect(screen.getAllByTestId("result")[0]).toHaveTextContent("7");
      expect(screen.getAllByTestId("render-count")[0]).toHaveTextContent("2");
      expect(screen.getAllByTestId("render-count")[1]).toHaveTextContent("2");
    });
    test("계산된 값을 구독하는 컴포넌트는 의존성 변경 시에만 리렌더링되어야 함", () => {
      const state = proxy({ 
        firstName: "John", 
        lastName: "Doe", 
        age: 30,
        metadata: { version: 1 }
      });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const fullName = useStore(state, (s) => `${s.firstName} ${s.lastName}`);
        return (
          <div>
            <div data-testid="full-name">{fullName}</div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => { state.firstName = "Jane"; }}>이름 변경</button>
            <button onClick={() => { state.lastName = "Smith"; }}>성 변경</button>
            <button onClick={() => { state.age++; }}>나이 증가</button>
            <button onClick={() => { state.metadata.version++; }}>메타데이터 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("full-name")).toHaveTextContent("John Doe");
      expect(screen.getByTestId("render-count")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(screen.getByTestId("full-name")).toHaveTextContent("Jane Doe");
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("성 변경"));
      });
      expect(screen.getByTestId("full-name")).toHaveTextContent("Jane Smith");
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("나이 증가"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("메타데이터 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");
    });

    test("조건부 선택자는 조건에 따라 다른 속성을 구독해야 함", () => {
      const state = proxy({ 
        useFirstName: true, 
        firstName: "John", 
        lastName: "Doe",
        nickname: "Johnny"
      });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const displayName = useStore(state, (s) => 
          s.useFirstName ? s.firstName : s.nickname
        );
        return (
          <div>
            <div data-testid="display-name">{displayName}</div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => { state.useFirstName = !state.useFirstName; }}>토글</button>
            <button onClick={() => { state.firstName = "Jane"; }}>이름 변경</button>
            <button onClick={() => { state.nickname = "Janie"; }}>닉네임 변경</button>
            <button onClick={() => { state.lastName = "Smith"; }}>성 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("display-name")).toHaveTextContent("John");
      expect(screen.getByTestId("render-count")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(screen.getByTestId("display-name")).toHaveTextContent("Jane");
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("닉네임 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("토글"));
      });
      expect(screen.getByTestId("display-name")).toHaveTextContent("Janie");
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("성 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");
    });
  });

  describe("배열과 객체의 복합 구조", () => {
    test("배열 인덱스 기반 접근과 동적 인덱스", () => {
      const state = proxy({
        items: ["a", "b", "c", "d"],
        selectedIndex: 0,
        meta: { count: 4 }
      });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const selectedItem = useStore(state, (s) => s.items[s.selectedIndex]);
        return (
          <div>
            <div data-testid="selected-item">{selectedItem}</div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => { state.selectedIndex = 2; }}>인덱스 변경</button>
            <button onClick={() => { state.items[0] = "changed"; }}>첫 아이템 변경</button>
            <button onClick={() => { state.items[2] = "updated"; }}>세 번째 아이템 변경</button>
            <button onClick={() => { state.meta.count = 5; }}>메타 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("selected-item")).toHaveTextContent("a");
      expect(screen.getByTestId("render-count")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("인덱스 변경"));
      });
      expect(screen.getByTestId("selected-item")).toHaveTextContent("c");
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("첫 아이템 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("세 번째 아이템 변경"));
      });
      expect(screen.getByTestId("selected-item")).toHaveTextContent("updated");
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("메타 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");
    });

    test("Map/Set 스타일 데이터 구조", () => {
      const state = proxy({
        keyValuePairs: [
          { key: "name", value: "John" },
          { key: "age", value: "30" },
          { key: "city", value: "Seoul" }
        ],
        targetKey: "name",
        metadata: { version: 1 }
      });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const targetValue = useStore(state, (s) => 
          s.keyValuePairs.find(pair => pair.key === s.targetKey)?.value || "not found"
        );
        return (
          <div>
            <div data-testid="target-value">{targetValue}</div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => { state.targetKey = "age"; }}>타겟 변경</button>
            <button onClick={() => { 
              const pair = state.keyValuePairs.find(p => p.key === "name");
              if (pair) pair.value = "Jane";
            }}>이름 값 변경</button>
            <button onClick={() => { 
              const pair = state.keyValuePairs.find(p => p.key === "city");
              if (pair) pair.value = "Busan";
            }}>도시 값 변경</button>
            <button onClick={() => { state.metadata.version++; }}>메타 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("target-value")).toHaveTextContent("John");
      expect(screen.getByTestId("render-count")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("타겟 변경"));
      });
      expect(screen.getByTestId("target-value")).toHaveTextContent("30");
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("이름 값 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("도시 값 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("메타 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");
    });
    test("배열 내 객체의 특정 속성만 구독해야 함", () => {
      const state = proxy({
        users: [
          { id: 1, name: "John", age: 30, active: true },
          { id: 2, name: "Jane", age: 25, active: false }
        ]
      });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const activeUserNames = useStore(state, (s) => 
          s.users.filter(user => user.active).map(user => user.name)
        );
        return (
          <div>
            <div data-testid="active-users">{activeUserNames.join(", ")}</div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => { state.users[0].name = "Johnny"; }}>이름 변경</button>
            <button onClick={() => { state.users[0].age++; }}>나이 증가</button>
            <button onClick={() => { state.users[0].active = false; }}>활성 상태 변경</button>
            <button onClick={() => { state.users[1].active = true; }}>Jane 활성화</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("active-users")).toHaveTextContent("John");
      expect(screen.getByTestId("render-count")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("이름 변경"));
      });
      expect(screen.getByTestId("active-users")).toHaveTextContent("Johnny");
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("나이 증가"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("활성 상태 변경"));
      });
      expect(screen.getByTestId("active-users")).toHaveTextContent("");
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("Jane 활성화"));
      });
      expect(screen.getByTestId("active-users")).toHaveTextContent("Jane");
      expect(screen.getByTestId("render-count")).toHaveTextContent("4");
    });

    test("중첩된 배열 구조의 특정 경로만 구독해야 함", () => {
      const state = proxy({
        departments: [
          {
            name: "Engineering",
            teams: [
              { name: "Frontend", members: ["Alice", "Bob"] },
              { name: "Backend", members: ["Carol", "Dave"] }
            ]
          },
          {
            name: "Design",
            teams: [
              { name: "UX", members: ["Eve", "Frank"] }
            ]
          }
        ]
      });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const frontendMembers = useStore(state, (s) => 
          s.departments.find(d => d.name === "Engineering")
            ?.teams.find(t => t.name === "Frontend")
            ?.members || []
        );
        return (
          <div>
            <div data-testid="frontend-members">{frontendMembers.join(", ")}</div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => { 
              state.departments[0].teams[0].members.push("Grace"); 
            }}>Frontend 멤버 추가</button>
            <button onClick={() => { 
              state.departments[0].teams[1].members.push("Henry"); 
            }}>Backend 멤버 추가</button>
            <button onClick={() => { 
              state.departments[1].teams[0].members.push("Ivan"); 
            }}>UX 멤버 추가</button>
            <button onClick={() => { 
              state.departments[0].name = "Technology"; 
            }}>부서명 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("frontend-members")).toHaveTextContent("Alice, Bob");
      expect(screen.getByTestId("render-count")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("Frontend 멤버 추가"));
      });
      expect(screen.getByTestId("frontend-members")).toHaveTextContent("Alice, Bob, Grace");
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("Backend 멤버 추가"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("UX 멤버 추가"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("부서명 변경"));
      });
      expect(screen.getByTestId("frontend-members")).toHaveTextContent("");
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");
    });
  });

  describe("동적 선택자와 다중 의존성", () => {
    test("깊이가 다른 중첩 경로의 동적 구독", () => {
      const state = proxy({
        mode: "simple",
        simple: { value: "simple data" },
        complex: {
          level1: {
            level2: {
              level3: { value: "deep data" }
            }
          }
        },
        other: { data: "unchanged" }
      });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const data = useStore(state, (s) => 
          s.mode === "simple" 
            ? s.simple.value 
            : s.complex.level1.level2.level3.value
        );
        return (
          <div>
            <div data-testid="data">{data}</div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => { state.mode = "complex"; }}>복잡 모드</button>
            <button onClick={() => { state.simple.value = "updated simple"; }}>간단 데이터 변경</button>
            <button onClick={() => { state.complex.level1.level2.level3.value = "updated deep"; }}>깊은 데이터 변경</button>
            <button onClick={() => { state.other.data = "still unchanged"; }}>관련없는 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("data")).toHaveTextContent("simple data");
      expect(screen.getByTestId("render-count")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("간단 데이터 변경"));
      });
      expect(screen.getByTestId("data")).toHaveTextContent("updated simple");
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("깊은 데이터 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("복잡 모드"));
      });
      expect(screen.getByTestId("data")).toHaveTextContent("updated deep");
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("간단 데이터 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("관련없는 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");
    });
    test("선택자가 다중 독립적 경로를 참조할 때 각각 독립적으로 반응해야 함", () => {
      const state = proxy({
        ui: { theme: "dark", language: "ko" },
        user: { name: "John", preferences: { theme: "light" } },
        system: { version: "1.0", build: 123 }
      });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const themeInfo = useStore(state, (s) => ({
          uiTheme: s.ui.theme,
          userTheme: s.user.preferences.theme,
          userName: s.user.name
        }));
        return (
          <div>
            <div data-testid="theme-info">
              UI: {themeInfo.uiTheme}, User: {themeInfo.userTheme}, Name: {themeInfo.userName}
            </div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => { state.ui.theme = "light"; }}>UI 테마 변경</button>
            <button onClick={() => { state.user.preferences.theme = "dark"; }}>사용자 테마 변경</button>
            <button onClick={() => { state.user.name = "Jane"; }}>사용자명 변경</button>
            <button onClick={() => { state.ui.language = "en"; }}>언어 변경</button>
            <button onClick={() => { state.system.version = "2.0"; }}>시스템 버전 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("theme-info")).toHaveTextContent("UI: dark, User: light, Name: John");
      expect(screen.getByTestId("render-count")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("UI 테마 변경"));
      });
      expect(screen.getByTestId("theme-info")).toHaveTextContent("UI: light, User: light, Name: John");
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("사용자 테마 변경"));
      });
      expect(screen.getByTestId("theme-info")).toHaveTextContent("UI: light, User: dark, Name: John");
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("사용자명 변경"));
      });
      expect(screen.getByTestId("theme-info")).toHaveTextContent("UI: light, User: dark, Name: Jane");
      expect(screen.getByTestId("render-count")).toHaveTextContent("4");

      act(() => {
        fireEvent.click(screen.getByText("언어 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("4");

      act(() => {
        fireEvent.click(screen.getByText("시스템 버전 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("4");
    });
  });

  describe("성능 최적화 시나리오", () => {
    test("조건부 렌더링과 Fine-Grained 구독", () => {
      const state = proxy({
        showDetails: false,
        summary: { count: 5, total: 100 },
        details: {
          items: ["item1", "item2", "item3"],
          metadata: { lastUpdated: "2024-01-01" }
        }
      });
      let summaryRenders = 0;
      let detailsRenders = 0;

      function SummaryComponent() {
        summaryRenders++;
        const summary = useStore(state, (s) => s.summary);
        return (
          <div data-testid="summary">
            Count: {summary.count}, Total: {summary.total}, Renders: {summaryRenders}
          </div>
        );
      }

      function DetailsComponent() {
        detailsRenders++;
        const details = useStore(state, (s) => s.details);
        return (
          <div data-testid="details">
            Items: {details.items.length}, Updated: {details.metadata.lastUpdated}, Renders: {detailsRenders}
          </div>
        );
      }

      function App() {
        const showDetails = useStore(state, (s) => s.showDetails);
        return (
          <div>
            <SummaryComponent />
            {showDetails && <DetailsComponent />}
            <button onClick={() => { state.showDetails = !state.showDetails; }}>토글</button>
            <button onClick={() => { state.summary.count++; }}>카운트 증가</button>
            <button onClick={() => { state.details.items.push("new item"); }}>아이템 추가</button>
            <button onClick={() => { state.details.metadata.lastUpdated = "2024-12-31"; }}>날짜 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("summary")).toHaveTextContent("Count: 5, Total: 100, Renders: 1");
      expect(screen.queryByTestId("details")).toBeNull();

      act(() => {
        fireEvent.click(screen.getByText("토글"));
      });
      expect(screen.getByTestId("details")).toHaveTextContent("Items: 3, Updated: 2024-01-01, Renders: 1");

      act(() => {
        fireEvent.click(screen.getByText("카운트 증가"));
      });
      expect(screen.getByTestId("summary")).toHaveTextContent("Count: 6, Total: 100, Renders: 2");
      expect(screen.getByTestId("details")).toHaveTextContent("Items: 3, Updated: 2024-01-01, Renders: 1");

      act(() => {
        fireEvent.click(screen.getByText("아이템 추가"));
      });
      expect(screen.getByTestId("summary")).toHaveTextContent("Count: 6, Total: 100, Renders: 2");
      expect(screen.getByTestId("details")).toHaveTextContent("Items: 4, Updated: 2024-01-01, Renders: 2");
    });

    test("빈번한 업데이트와 배치 처리 효과", () => {
      const state = proxy({ counter: 0, multiplier: 2, offset: 10 });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const result = useStore(state, (s) => s.counter * s.multiplier + s.offset);
        return (
          <div>
            <div data-testid="result">{result}</div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => {
              state.counter += 1;
              state.multiplier += 1;
              state.offset += 1;
            }}>모든 값 동시 변경</button>
            <button onClick={() => { state.counter += 5; }}>카운터만 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("result")).toHaveTextContent("10");
      expect(screen.getByTestId("render-count")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("모든 값 동시 변경"));
      });
      expect(screen.getByTestId("result")).toHaveTextContent("14");
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("카운터만 변경"));
      });
      expect(screen.getByTestId("result")).toHaveTextContent("29");
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");
    });
    test("대량의 컴포넌트가 각기 다른 속성을 구독할 때 독립적 렌더링", () => {
      const state = proxy({
        counters: Array.from({ length: 10 }, (_, i) => ({ id: i, value: i * 10 }))
      });
      
      const renderCounts = Array.from({ length: 10 }, () => ({ count: 0 }));

      function CounterComponent({ index }: { index: number }) {
        renderCounts[index].count++;
        const counter = useStore(state, (s) => s.counters[index]);
        return (
          <div data-testid={`counter-${index}`}>
            Value: {counter.value}, Renders: {renderCounts[index].count}
          </div>
        );
      }

      function App() {
        return (
          <div>
            {Array.from({ length: 10 }, (_, i) => (
              <CounterComponent key={i} index={i} />
            ))}
            <button onClick={() => { state.counters[0].value += 100; }}>Counter 0 증가</button>
            <button onClick={() => { state.counters[5].value += 100; }}>Counter 5 증가</button>
            <button onClick={() => { state.counters.push({ id: 10, value: 1000 }); }}>Counter 추가</button>
          </div>
        );
      }

      render(<App />);
      
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`counter-${i}`)).toHaveTextContent(`Value: ${i * 10}, Renders: 1`);
      }

      act(() => {
        fireEvent.click(screen.getByText("Counter 0 증가"));
      });
      expect(screen.getByTestId("counter-0")).toHaveTextContent("Value: 100, Renders: 2");
      for (let i = 1; i < 10; i++) {
        expect(screen.getByTestId(`counter-${i}`)).toHaveTextContent(`Value: ${i * 10}, Renders: 1`);
      }

      act(() => {
        fireEvent.click(screen.getByText("Counter 5 증가"));
      });
      expect(screen.getByTestId("counter-0")).toHaveTextContent("Value: 100, Renders: 2");
      expect(screen.getByTestId("counter-5")).toHaveTextContent("Value: 150, Renders: 2");
      for (let i = 1; i < 10; i++) {
        if (i !== 5) {
          expect(screen.getByTestId(`counter-${i}`)).toHaveTextContent(`Value: ${i * 10}, Renders: 1`);
        }
      }
    });

    test("같은 계산된 값을 여러 컴포넌트가 구독할 때 모두 동시에 업데이트", () => {
      const state = proxy({ a: 1, b: 2, c: 3 });
      let renderCount1 = 0;
      let renderCount2 = 0;
      let renderCount3 = 0;

      function Component1() {
        renderCount1++;
        const sum = useStore(state, (s) => s.a + s.b);
        return <div data-testid="sum1">Sum1: {sum}, Renders: {renderCount1}</div>;
      }

      function Component2() {
        renderCount2++;
        const sum = useStore(state, (s) => s.a + s.b);
        return <div data-testid="sum2">Sum2: {sum}, Renders: {renderCount2}</div>;
      }

      function Component3() {
        renderCount3++;
        const c = useStore(state, (s) => s.c);
        return <div data-testid="c">C: {c}, Renders: {renderCount3}</div>;
      }

      function App() {
        return (
          <div>
            <Component1 />
            <Component2 />
            <Component3 />
            <button onClick={() => { state.a += 10; }}>A 증가</button>
            <button onClick={() => { state.b += 10; }}>B 증가</button>
            <button onClick={() => { state.c += 10; }}>C 증가</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("sum1")).toHaveTextContent("Sum1: 3, Renders: 1");
      expect(screen.getByTestId("sum2")).toHaveTextContent("Sum2: 3, Renders: 1");
      expect(screen.getByTestId("c")).toHaveTextContent("C: 3, Renders: 1");

      act(() => {
        fireEvent.click(screen.getByText("A 증가"));
      });
      expect(screen.getByTestId("sum1")).toHaveTextContent("Sum1: 13, Renders: 2");
      expect(screen.getByTestId("sum2")).toHaveTextContent("Sum2: 13, Renders: 2");
      expect(screen.getByTestId("c")).toHaveTextContent("C: 3, Renders: 1");

      act(() => {
        fireEvent.click(screen.getByText("C 증가"));
      });
      expect(screen.getByTestId("sum1")).toHaveTextContent("Sum1: 13, Renders: 2");
      expect(screen.getByTestId("sum2")).toHaveTextContent("Sum2: 13, Renders: 2");
      expect(screen.getByTestId("c")).toHaveTextContent("C: 13, Renders: 2");
    });
  });

  describe("메모리 및 구독 정리", () => {
    test("동적 선택자 경로 변경 시 이전 구독 정리", () => {
      const state = proxy({
        path: "a",
        a: { value: "value A", counter: 0 },
        b: { value: "value B", counter: 0 },
        c: { value: "value C", counter: 0 }
      });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const value = useStore(state, (s) => s[s.path as 'a' | 'b' | 'c'].value);
        return (
          <div>
            <div data-testid="value">{value}</div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <TestComponent />
            <button onClick={() => { state.path = "b"; }}>경로 B</button>
            <button onClick={() => { state.path = "c"; }}>경로 C</button>
            <button onClick={() => { state.a.value = "updated A"; }}>A 값 변경</button>
            <button onClick={() => { state.b.value = "updated B"; }}>B 값 변경</button>
            <button onClick={() => { state.c.value = "updated C"; }}>C 값 변경</button>
            <button onClick={() => { state.a.counter++; }}>A 카운터</button>
            <button onClick={() => { state.b.counter++; }}>B 카운터</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("value")).toHaveTextContent("value A");
      expect(screen.getByTestId("render-count")).toHaveTextContent("1");

      act(() => {
        fireEvent.click(screen.getByText("A 값 변경"));
      });
      expect(screen.getByTestId("value")).toHaveTextContent("updated A");
      expect(screen.getByTestId("render-count")).toHaveTextContent("2");

      act(() => {
        fireEvent.click(screen.getByText("경로 B"));
      });
      expect(screen.getByTestId("value")).toHaveTextContent("value B");
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("A 값 변경"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("A 카운터"));
      });
      expect(screen.getByTestId("render-count")).toHaveTextContent("3");

      act(() => {
        fireEvent.click(screen.getByText("B 값 변경"));
      });
      expect(screen.getByTestId("value")).toHaveTextContent("updated B");
      expect(screen.getByTestId("render-count")).toHaveTextContent("4");
    });
    test("컴포넌트 언마운트 시 구독이 정리되어야 함", () => {
      const state = proxy({ count: 0 });
      let renderCount = 0;

      function TestComponent() {
        renderCount++;
        const count = useStore(state, (s) => s.count);
        return <div data-testid="count">{count}</div>;
      }

      function App({ showComponent }: { showComponent: boolean }) {
        return (
          <div>
            {showComponent && <TestComponent />}
            <button onClick={() => { state.count++; }}>증가</button>
          </div>
        );
      }

      const { rerender } = render(<App showComponent={true} />);
      expect(screen.getByTestId("count")).toHaveTextContent("0");
      expect(renderCount).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("증가"));
      });
      expect(screen.getByTestId("count")).toHaveTextContent("1");
      expect(renderCount).toBe(2);

      rerender(<App showComponent={false} />);
      expect(screen.queryByTestId("count")).toBeNull();

      const prevRenderCount = renderCount;
      act(() => {
        fireEvent.click(screen.getByText("증가"));
      });
      expect(renderCount).toBe(prevRenderCount);

      rerender(<App showComponent={true} />);
      expect(screen.getByTestId("count")).toHaveTextContent("2");
    });
  });
});