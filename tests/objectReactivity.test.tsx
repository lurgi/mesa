import { render, screen, fireEvent, act } from "@testing-library/react";
import { proxy, useStore } from "../src/main";

describe("Object Fine-Grained Reactivity", () => {
  describe("Top-level property reactivity", () => {
    test("should only re-render components subscribed to changed property", () => {
      const state = proxy({ count: 0, name: "John", status: "active" });
      
      let countRenders = 0;
      let nameRenders = 0;
      let statusRenders = 0;

      function CountComponent() {
        countRenders++;
        const count = useStore(state, (s) => s.count);
        return <div data-testid="count">{count}</div>;
      }

      function NameComponent() {
        nameRenders++;
        const name = useStore(state, (s) => s.name);
        return <div data-testid="name">{name}</div>;
      }

      function StatusComponent() {
        statusRenders++;
        const status = useStore(state, (s) => s.status);
        return <div data-testid="status">{status}</div>;
      }

      function App() {
        return (
          <div>
            <CountComponent />
            <NameComponent />
            <StatusComponent />
            <button onClick={() => state.count++}>increment count</button>
            <button onClick={() => { state.name = "Jane"; }}>change name</button>
            <button onClick={() => { state.status = "inactive"; }}>change status</button>
          </div>
        );
      }

      render(<App />);
      expect(countRenders).toBe(1);
      expect(nameRenders).toBe(1);
      expect(statusRenders).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("increment count"));
      });
      expect(countRenders).toBe(2);
      expect(nameRenders).toBe(1);
      expect(statusRenders).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("change name"));
      });
      expect(countRenders).toBe(2);
      expect(nameRenders).toBe(2);
      expect(statusRenders).toBe(1);
    });

    test("should handle computed values based on multiple properties", () => {
      const state = proxy({ firstName: "John", lastName: "Doe", age: 30 });
      
      let fullNameRenders = 0;
      let ageRenders = 0;

      function FullNameComponent() {
        fullNameRenders++;
        const fullName = useStore(state, (s) => `${s.firstName} ${s.lastName}`);
        return <div data-testid="full-name">{fullName}</div>;
      }

      function AgeComponent() {
        ageRenders++;
        const age = useStore(state, (s) => s.age);
        return <div data-testid="age">{age}</div>;
      }

      function App() {
        return (
          <div>
            <FullNameComponent />
            <AgeComponent />
            <button onClick={() => { state.firstName = "Jane"; }}>change first name</button>
            <button onClick={() => { state.age = 31; }}>change age</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("full-name")).toHaveTextContent("John Doe");
      expect(fullNameRenders).toBe(1);
      expect(ageRenders).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("change first name"));
      });
      expect(screen.getByTestId("full-name")).toHaveTextContent("Jane Doe");
      expect(fullNameRenders).toBe(2); // Should re-render
      expect(ageRenders).toBe(1); // Should not re-render

      act(() => {
        fireEvent.click(screen.getByText("change age"));
      });
      expect(fullNameRenders).toBe(2); // Should not re-render
      expect(ageRenders).toBe(2); // Should re-render
    });
  });

  describe("Nested object reactivity", () => {
    test("should re-render only components subscribed to changed nested properties", () => {
      const state = proxy({
        user: { name: "John", profile: { age: 30, city: "New York" } },
        settings: { theme: "dark", notifications: { email: true, push: false } }
      });

      let userNameRenders = 0;
      let userAgeRenders = 0;
      let settingsThemeRenders = 0;
      let emailNotificationRenders = 0;

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

      function EmailNotificationComponent() {
        emailNotificationRenders++;
        const email = useStore(state, (s) => s.settings.notifications.email);
        return <div data-testid="email-notification">{email ? "on" : "off"}</div>;
      }

      function App() {
        return (
          <div>
            <UserNameComponent />
            <UserAgeComponent />
            <SettingsThemeComponent />
            <EmailNotificationComponent />
            <button onClick={() => { state.user.name = "Jane"; }}>change name</button>
            <button onClick={() => { state.user.profile.age = 31; }}>change age</button>
            <button onClick={() => { state.settings.theme = "light"; }}>change theme</button>
            <button onClick={() => { state.settings.notifications.email = false; }}>toggle email</button>
          </div>
        );
      }

      render(<App />);
      const initialUserNameRenders = userNameRenders;
      const initialUserAgeRenders = userAgeRenders;
      const initialSettingsThemeRenders = settingsThemeRenders;
      const initialEmailNotificationRenders = emailNotificationRenders;

      act(() => {
        fireEvent.click(screen.getByText("change name"));
      });
      expect(userNameRenders).toBe(initialUserNameRenders + 1);
      expect(userAgeRenders).toBe(initialUserAgeRenders);
      expect(settingsThemeRenders).toBe(initialSettingsThemeRenders);
      expect(emailNotificationRenders).toBe(initialEmailNotificationRenders);

      act(() => {
        fireEvent.click(screen.getByText("change age"));
      });
      expect(userNameRenders).toBe(initialUserNameRenders + 1);
      expect(userAgeRenders).toBe(initialUserAgeRenders + 1);
      expect(settingsThemeRenders).toBe(initialSettingsThemeRenders);
      expect(emailNotificationRenders).toBe(initialEmailNotificationRenders);
    });

    test("should handle entire object replacement", () => {
      const state = proxy({
        user: { name: "John", age: 30 }
      });

      let userNameRenders = 0;
      let userAgeRenders = 0;

      function UserNameComponent() {
        userNameRenders++;
        const name = useStore(state, (s) => s.user.name);
        return <div data-testid="user-name">{name}</div>;
      }

      function UserAgeComponent() {
        userAgeRenders++;
        const age = useStore(state, (s) => s.user.age);
        return <div data-testid="user-age">{age}</div>;
      }

      function App() {
        return (
          <div>
            <UserNameComponent />
            <UserAgeComponent />
            <button onClick={() => { 
              state.user = { name: "Jane", age: 25 }; 
            }}>replace user</button>
          </div>
        );
      }

      render(<App />);
      expect(screen.getByTestId("user-name")).toHaveTextContent("John");
      expect(screen.getByTestId("user-age")).toHaveTextContent("30");
      
      const initialUserNameRenders = userNameRenders;
      const initialUserAgeRenders = userAgeRenders;

      act(() => {
        fireEvent.click(screen.getByText("replace user"));
      });
      
      expect(screen.getByTestId("user-name")).toHaveTextContent("Jane");
      expect(screen.getByTestId("user-age")).toHaveTextContent("25");
      expect(userNameRenders).toBe(initialUserNameRenders + 1);
      expect(userAgeRenders).toBe(initialUserAgeRenders + 1);
    });
  });

  describe("Dynamic property operations", () => {
    test("should handle dynamic property addition", () => {
      const state = proxy<any>({ name: "John" });

      let renders = 0;
      function TestComponent() {
        renders++;
        const dynamicProp = useStore(state, (s) => s.dynamicProp || "not set");
        return (
          <div>
            <div data-testid="dynamic-prop">{dynamicProp}</div>
            <button onClick={() => { state.dynamicProp = "added"; }}>add property</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId("dynamic-prop")).toHaveTextContent("not set");
      expect(renders).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("add property"));
      });

      expect(screen.getByTestId("dynamic-prop")).toHaveTextContent("added");
      expect(renders).toBe(2);
    });

    test("should handle property deletion", () => {
      const state = proxy<any>({ name: "John", temp: "delete me" });

      let renders = 0;
      function TestComponent() {
        renders++;
        const temp = useStore(state, (s) => s.temp || "deleted");
        return (
          <div>
            <div data-testid="temp">{temp}</div>
            <button onClick={() => { delete state.temp; }}>delete property</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId("temp")).toHaveTextContent("delete me");
      expect(renders).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("delete property"));
      });

      expect(screen.getByTestId("temp")).toHaveTextContent("deleted");
      expect(renders).toBe(2);
    });
  });

  describe("Complex scenarios", () => {
    test("should handle conditional selectors", () => {
      const state = proxy({
        showFirstName: true,
        firstName: "John",
        lastName: "Doe",
        nickname: "Johnny"
      });

      let renders = 0;
      function TestComponent() {
        renders++;
        const displayName = useStore(state, (s) => 
          s.showFirstName ? s.firstName : s.lastName
        );
        return (
          <div>
            <div data-testid="display-name">{displayName}</div>
            <button onClick={() => { state.showFirstName = !state.showFirstName; }}>toggle mode</button>
            <button onClick={() => { state.firstName = "Jane"; }}>change first name</button>
            <button onClick={() => { state.lastName = "Smith"; }}>change last name</button>
            <button onClick={() => { state.nickname = "Janie"; }}>change nickname</button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId("display-name")).toHaveTextContent("John");
      const initialRenders = renders;

      // Change firstName - should trigger re-render
      act(() => {
        fireEvent.click(screen.getByText("change first name"));
      });
      expect(screen.getByTestId("display-name")).toHaveTextContent("Jane");
      expect(renders).toBe(initialRenders + 1);

      // Change lastName - should NOT trigger re-render (not currently used)
      act(() => {
        fireEvent.click(screen.getByText("change last name"));
      });
      expect(renders).toBe(initialRenders + 1);

      // Toggle mode to use lastName
      act(() => {
        fireEvent.click(screen.getByText("toggle mode"));
      });
      expect(screen.getByTestId("display-name")).toHaveTextContent("Smith");
      expect(renders).toBe(initialRenders + 2);

      // Change nickname - should NOT trigger re-render (not used)
      act(() => {
        fireEvent.click(screen.getByText("change nickname"));
      });
      expect(renders).toBe(initialRenders + 2);
    });

    test("should handle object-returning selectors", () => {
      const state = proxy({
        user: { name: "John", age: 30 },
        settings: { theme: "dark" }
      });

      // This is problematic pattern that should cause infinite re-renders
      function ProblematicComponent() {
        const userAndSettings = useStore(state, (s) => ({
          user: s.user,
          theme: s.settings.theme
        }));
        return <div data-testid="problematic">{userAndSettings.user.name}</div>;
      }

      // This should throw due to infinite re-renders
      expect(() => {
        render(<ProblematicComponent />);
      }).toThrow();
    });

    test("should handle deep nesting efficiently", () => {
      const state = proxy({
        level1: {
          level2: {
            level3: {
              level4: {
                value: "deep"
              }
            }
          }
        }
      });

      let renders = 0;
      function DeepComponent() {
        renders++;
        const deepValue = useStore(state, (s) => s.level1.level2.level3.level4.value);
        return (
          <div>
            <div data-testid="deep-value">{deepValue}</div>
            <button onClick={() => { 
              state.level1.level2.level3.level4.value = "updated";
            }}>update deep</button>
          </div>
        );
      }

      render(<DeepComponent />);
      expect(screen.getByTestId("deep-value")).toHaveTextContent("deep");
      expect(renders).toBe(1);

      act(() => {
        fireEvent.click(screen.getByText("update deep"));
      });

      expect(screen.getByTestId("deep-value")).toHaveTextContent("updated");
      expect(renders).toBe(2);
    });
  });
});