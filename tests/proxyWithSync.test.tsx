import { render, screen, cleanup } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { proxy } from '../src/main';
import { useStore } from '../src/useStore';

interface TestState {
  user: {
    name: string;
  };
}

describe('proxy.withSync', () => {
  afterEach(() => {
    cleanup();
  });
  test('should sync data from a hook and update a component', () => {
    const { state, useSync } = proxy.withSync<TestState>({ user: { name: 'John' } });

    const UserDisplay = () => {
      const { user } = useStore(state);
      return <div>{user.name}</div>;
    };

    render(<UserDisplay />);
    expect(screen.getByText('John')).toBeInTheDocument();

    const newData = { user: { name: 'Jane' } };
    
    act(() => {
      renderHook(() => useSync(newData));
    });

    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  test('should not update from useSync if data is undefined or null', () => {
    const { state, useSync } = proxy.withSync<TestState>({ user: { name: 'John' } });

    const UserDisplay = () => {
      const { user } = useStore(state);
      return <div>{user.name}</div>;
    };

    render(<UserDisplay />);
    expect(screen.getByText('John')).toBeInTheDocument();

    act(() => {
      renderHook(() => useSync(undefined));
    });
    expect(screen.getByText('John')).toBeInTheDocument();

    act(() => {
      renderHook(() => useSync(null));
    });
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  test('should handle invalid data types gracefully', () => {
    const { state, useSync } = proxy.withSync<TestState>({ user: { name: 'John' } });
    
    const UserDisplay = () => {
      const { user } = useStore(state);
      return <div>{user.name}</div>;
    };

    render(<UserDisplay />);
    expect(screen.getByText('John')).toBeInTheDocument();

    expect(() => {
      act(() => {
        renderHook(() => useSync("invalid string" as any));
      });
    }).not.toThrow();

    expect(() => {
      act(() => {
        renderHook(() => useSync(123 as any));
      });
    }).not.toThrow();

    expect(screen.getByText('John')).toBeInTheDocument();
  });

  test('should handle circular references without throwing', () => {
    const { state, useSync } = proxy.withSync<TestState>({ user: { name: 'John' } });
    
    const circular: any = { user: { name: 'Circular' } };
    circular.self = circular;

    const UserDisplay = () => {
      const { user } = useStore(state);
      return <div>{user.name}</div>;
    };

    render(<UserDisplay />);
    
    expect(() => {
      act(() => {
        renderHook(() => useSync(circular));
      });
    }).not.toThrow();
  });
});