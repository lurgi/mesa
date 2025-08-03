import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { proxy, useSnapshot } from '../src/main';

describe('useSnapshot() 훅', () => {
  describe('기본 기능', () => {
    test('프록시 상태의 현재 값을 반환해야 함', () => {
      const state = proxy({ count: 42 });
      
      function TestComponent() {
        const count = useSnapshot(state.count);
        return <div data-testid="count">{count}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('count')).toHaveTextContent('42');
    });

    test('문자열 값을 올바르게 반환해야 함', () => {
      const state = proxy({ name: 'John' });
      
      function TestComponent() {
        const name = useSnapshot(state.name);
        return <div data-testid="name">{name}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('name')).toHaveTextContent('John');
    });

    test('불린 값을 올바르게 반환해야 함', () => {
      const state = proxy({ isVisible: true });
      
      function TestComponent() {
        const isVisible = useSnapshot(state.isVisible);
        return <div data-testid="visible">{isVisible ? 'visible' : 'hidden'}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('visible')).toHaveTextContent('visible');
    });
  });

  describe('반응성', () => {
    test('상태 변경 시 컴포넌트가 리렌더링되어야 함', () => {
      const state = proxy({ count: 0 });
      
      function TestComponent() {
        const count = useSnapshot(state.count);
        return (
          <div>
            <div data-testid="count">{count}</div>
            <button onClick={() => state.count++}>증가</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId('count')).toHaveTextContent('0');

      act(() => {
        fireEvent.click(screen.getByText('증가'));
      });

      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });

    test('직접 값 할당 시에도 리렌더링되어야 함', () => {
      const state = proxy({ count: 5 });
      
      function TestComponent() {
        const count = useSnapshot(state.count);
        return (
          <div>
            <div data-testid="count">{count}</div>
            <button onClick={() => { state.count = 10; }}>설정</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId('count')).toHaveTextContent('5');

      act(() => {
        fireEvent.click(screen.getByText('설정'));
      });

      expect(screen.getByTestId('count')).toHaveTextContent('10');
    });
  });

  describe('Fine-Grained 렌더링', () => {
    test('구독하지 않은 속성 변경 시 리렌더링되지 않아야 함', () => {
      const state = proxy({ count: 0, name: 'John' });
      let renderCount = 0;
      
      function TestComponent() {
        renderCount++;
        const count = useSnapshot(state.count);
        return (
          <div>
            <div data-testid="count">{count}</div>
            <div data-testid="render-count">{renderCount}</div>
            <button onClick={() => { state.name = 'Jane'; }}>이름 변경</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      act(() => {
        fireEvent.click(screen.getByText('이름 변경'));
      });

      expect(screen.getByTestId('render-count')).toHaveTextContent('1');
    });

    test('구독한 속성 변경 시에만 리렌더링되어야 함', () => {
      const state = proxy({ count: 0, name: 'John' });
      let renderCount = 0;
      
      function TestComponent() {
        renderCount++;
        const count = useSnapshot(state.count);
        return (
          <div>
            <div data-testid="count">{count}</div>
            <div data-testid="render-count">{renderCount}</div>
            <button onClick={() => state.count++}>카운트 증가</button>
            <button onClick={() => { state.name = 'Jane'; }}>이름 변경</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      act(() => {
        fireEvent.click(screen.getByText('이름 변경'));
      });
      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      act(() => {
        fireEvent.click(screen.getByText('카운트 증가'));
      });
      expect(screen.getByTestId('render-count')).toHaveTextContent('2');
    });
  });

  describe('중첩 객체', () => {
    test('중첩 객체의 속성을 구독할 수 있어야 함', () => {
      const state = proxy({ user: { name: 'John', age: 30 } });
      
      function TestComponent() {
        const userName = useSnapshot(state.user.name);
        return <div data-testid="user-name">{userName}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('user-name')).toHaveTextContent('John');
    });

    test('중첩 객체의 속성 변경 시 리렌더링되어야 함', () => {
      const state = proxy({ user: { name: 'John', age: 30 } });
      
      function TestComponent() {
        const userName = useSnapshot(state.user.name);
        return (
          <div>
            <div data-testid="user-name">{userName}</div>
            <button onClick={() => { state.user.name = 'Jane'; }}>이름 변경</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId('user-name')).toHaveTextContent('John');

      act(() => {
        fireEvent.click(screen.getByText('이름 변경'));
      });

      expect(screen.getByTestId('user-name')).toHaveTextContent('Jane');
    });

    test('중첩 객체의 다른 속성 변경 시 리렌더링되지 않아야 함', () => {
      const state = proxy({ user: { name: 'John', age: 30 }, settings: { theme: 'dark' } });
      let renderCount = 0;
      
      function TestComponent() {
        renderCount++;
        const userName = useSnapshot(state.user.name);
        return (
          <div>
            <div data-testid="user-name">{userName}</div>
            <div data-testid="render-count">{renderCount}</div>
            <button onClick={() => state.user.age++}>나이 증가</button>
            <button onClick={() => { state.settings.theme = 'light'; }}>테마 변경</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      act(() => {
        fireEvent.click(screen.getByText('나이 증가'));
      });
      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      act(() => {
        fireEvent.click(screen.getByText('테마 변경'));
      });
      expect(screen.getByTestId('render-count')).toHaveTextContent('1');
    });
  });

  describe('배열', () => {
    test('배열 요소를 구독할 수 있어야 함', () => {
      const state = proxy({ items: ['apple', 'banana', 'cherry'] });
      
      function TestComponent() {
        const firstItem = useSnapshot(state.items[0]);
        return <div data-testid="first-item">{firstItem}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('first-item')).toHaveTextContent('apple');
    });

    test('배열 요소 변경 시 리렌더링되어야 함', () => {
      const state = proxy({ items: ['apple', 'banana'] });
      
      function TestComponent() {
        const firstItem = useSnapshot(state.items[0]);
        return (
          <div>
            <div data-testid="first-item">{firstItem}</div>
            <button onClick={() => { state.items[0] = 'orange'; }}>첫 번째 변경</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId('first-item')).toHaveTextContent('apple');

      act(() => {
        fireEvent.click(screen.getByText('첫 번째 변경'));
      });

      expect(screen.getByTestId('first-item')).toHaveTextContent('orange');
    });

    test('배열 길이 변경을 감지해야 함', () => {
      const state = proxy({ items: ['apple'] });
      
      function TestComponent() {
        const length = useSnapshot(state.items.length);
        return (
          <div>
            <div data-testid="length">{length}</div>
            <button onClick={() => state.items.push('banana')}>추가</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId('length')).toHaveTextContent('1');

      act(() => {
        fireEvent.click(screen.getByText('추가'));
      });

      expect(screen.getByTestId('length')).toHaveTextContent('2');
    });
  });

  describe('다중 컴포넌트', () => {
    test('여러 컴포넌트가 같은 상태를 구독할 수 있어야 함', () => {
      const state = proxy({ count: 0 });
      
      function Component1() {
        const count = useSnapshot(state.count);
        return <div data-testid="count1">{count}</div>;
      }

      function Component2() {
        const count = useSnapshot(state.count);
        return <div data-testid="count2">{count}</div>;
      }

      function App() {
        return (
          <div>
            <Component1 />
            <Component2 />
            <button onClick={() => state.count++}>증가</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId('count1')).toHaveTextContent('0');
      expect(screen.getByTestId('count2')).toHaveTextContent('0');

      act(() => {
        fireEvent.click(screen.getByText('증가'));
      });

      expect(screen.getByTestId('count1')).toHaveTextContent('1');
      expect(screen.getByTestId('count2')).toHaveTextContent('1');
    });

    test('독립적인 구독을 가진 컴포넌트들이 선택적으로 렌더링되어야 함', () => {
      const state = proxy({ count: 0, name: 'John' });
      let countRenderCount = 0;
      let nameRenderCount = 0;
      
      function CountComponent() {
        countRenderCount++;
        const count = useSnapshot(state.count);
        return <div data-testid="count-renders">{countRenderCount}</div>;
      }

      function NameComponent() {
        nameRenderCount++;
        const name = useSnapshot(state.name);
        return <div data-testid="name-renders">{nameRenderCount}</div>;
      }

      function App() {
        return (
          <div>
            <CountComponent />
            <NameComponent />
            <button onClick={() => state.count++}>카운트 증가</button>
            <button onClick={() => { state.name = 'Jane'; }}>이름 변경</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId('count-renders')).toHaveTextContent('1');
      expect(screen.getByTestId('name-renders')).toHaveTextContent('1');

      act(() => {
        fireEvent.click(screen.getByText('카운트 증가'));
      });
      expect(screen.getByTestId('count-renders')).toHaveTextContent('2');
      expect(screen.getByTestId('name-renders')).toHaveTextContent('1');

      act(() => {
        fireEvent.click(screen.getByText('이름 변경'));
      });
      expect(screen.getByTestId('count-renders')).toHaveTextContent('2');
      expect(screen.getByTestId('name-renders')).toHaveTextContent('2');
    });
  });

  describe('엣지 케이스', () => {
    test('null 값을 올바르게 처리해야 함', () => {
      const state = proxy<any>({ value: null });
      
      function TestComponent() {
        const value = useSnapshot(state.value);
        return <div data-testid="value">{value === null ? 'null' : String(value)}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('value')).toHaveTextContent('null');
    });

    test('undefined 값을 올바르게 처리해야 함', () => {
      const state = proxy<any>({ value: undefined });
      
      function TestComponent() {
        const value = useSnapshot(state.value);
        return <div data-testid="value">{value === undefined ? 'undefined' : String(value)}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('value')).toHaveTextContent('undefined');
    });

    test('0 값을 올바르게 처리해야 함', () => {
      const state = proxy({ value: 0 });
      
      function TestComponent() {
        const value = useSnapshot(state.value);
        return <div data-testid="value">{value}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('value')).toHaveTextContent('0');
    });

    test('빈 문자열을 올바르게 처리해야 함', () => {
      const state = proxy({ value: '' });
      
      function TestComponent() {
        const value = useSnapshot(state.value);
        return <div data-testid="value">"{value}"</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('value')).toHaveTextContent('""');
    });
  });
});