import { render, screen, cleanup } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { proxy } from '../src/main';
import { useStore } from '../src/useStore';

interface TestState {
  settings: {
    theme: string;
    notifications: {
      enabled: boolean;
      sound: string;
    };
  };
  items: string[];
}

describe('proxy.withSync reactivity', () => {
  afterEach(() => {
    cleanup();
  });

  const createTestHelper = () => {
    return proxy.withSync<TestState>({
      settings: { theme: 'dark', notifications: { enabled: true, sound: 'default' } },
      items: [],
    });
  };
  describe('Object Reactivity', () => {
    test('should update nested object properties', () => {
      const { state, useSync } = proxy.withSync<TestState>({
        settings: { theme: 'dark', notifications: { enabled: true, sound: 'default' } },
        items: [],
      });

      const SettingsDisplay = () => {
        const { settings } = useStore(state);
        return <div>{settings.notifications.sound}</div>;
      };

      render(<SettingsDisplay />);
      expect(screen.getByText('default')).toBeInTheDocument();

      const newSettings = { settings: { ...state.settings, notifications: { ...state.settings.notifications, sound: 'new-sound' } } };

      act(() => {
        renderHook(() => useSync(newSettings));
      });

      expect(screen.getByText('new-sound')).toBeInTheDocument();
    });

    test('should not overwrite other properties when syncing partial data', () => {
        const { state, useSync } = proxy.withSync<TestState>({
            settings: { theme: 'dark', notifications: { enabled: true, sound: 'default' } },
            items: ['one'],
        });

        const StateDisplay = () => {
            const s = useStore(state);
            return <div>Theme: {s.settings.theme}, Items: {s.items.length}</div>
        }

        render(<StateDisplay/>);
        expect(screen.getByText('Theme: dark, Items: 1')).toBeInTheDocument();

        const newSettings = { settings: { ...state.settings, theme: 'light' } };

        act(() => {
            renderHook(() => useSync(newSettings));
        });

        expect(screen.getByText('Theme: light, Items: 1')).toBeInTheDocument();
    });
  });

  describe('Array Reactivity', () => {
    test('should update components when array is synced', () => {
      const { state, useSync } = createTestHelper();
      state.items = ['a', 'b'];

      const ItemList = () => {
        const { items } = useStore(state);
        return <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>;
      };

      render(<ItemList />);
      expect(screen.getAllByRole('listitem').length).toBe(2);

      const newData = { items: ['a', 'b', 'c'] };

      act(() => {
        renderHook(() => useSync(newData));
      });

      expect(screen.getAllByRole('listitem').length).toBe(3);
    });

    test('should allow further reactive mutations after sync', () => {
        const { state, useSync } = createTestHelper();
        state.items = ['a'];

        const ItemList = () => {
            const { items } = useStore(state);
            return (
                <>
                    <span>Count: {items.length}</span>
                    <button onClick={() => items.push('new')}>Add</button>
                </>
            )
        }

        render(<ItemList/>);
        expect(screen.getByText('Count: 1')).toBeInTheDocument();

        const newData = { items: ['x', 'y'] };
        act(() => {
            renderHook(() => useSync(newData));
        });

        expect(screen.getByText('Count: 2')).toBeInTheDocument();

        act(() => {
            screen.getByText('Add').click();
        });

        expect(screen.getByText('Count: 3')).toBeInTheDocument();
    });

    test('should handle large arrays efficiently', () => {
      const { state, useSync } = createTestHelper();
      const largeArray = Array(1000).fill(0).map((_, i) => `item-${i}`);
      
      const start = performance.now();
      
      act(() => {
        renderHook(() => useSync({ items: largeArray }));
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(state.items.length).toBe(1000);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    test('should handle concurrent updates correctly', async () => {
      const { state, useSync } = createTestHelper();
      
      const updates = Array(5).fill(0).map((_, i) => 
        act(() => renderHook(() => useSync({ items: [`concurrent-${i}`] })))
      );
      
      await Promise.all(updates);
      
      expect(state.items).toBeDefined();
      expect(Array.isArray(state.items)).toBe(true);
    });
  });
});
