import { render, screen } from "@testing-library/react";
import { proxy } from "../src/main";

interface TestState {
  user: {
    name: string;
  };
}

describe("withSync isLoading", () => {
  test("should return isLoading from useSync hook", () => {
    const { useSync } = proxy.withSync<TestState>({
      user: { name: "John" },
    });

    const TestComponent = () => {
      const { isLoading } = useSync({ user: { name: "Jane" } });

      return (
        <div>
          <span>Loading: {isLoading.toString()}</span>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText("Loading: false")).toBeInTheDocument();
  });

  test("should handle multiple components with independent loading states", () => {
    const { useSync } = proxy.withSync<TestState>({
      user: { name: "John" },
    });

    const Component1 = () => {
      const { isLoading } = useSync({ user: { name: "Jane" } });
      return <div>Component1 Loading: {isLoading.toString()}</div>;
    };

    const Component2 = () => {
      const { isLoading } = useSync({ user: { name: "Bob" } });
      return <div>Component2 Loading: {isLoading.toString()}</div>;
    };

    render(
      <div>
        <Component1 />
        <Component2 />
      </div>
    );

    expect(screen.getByText("Component1 Loading: false")).toBeInTheDocument();
    expect(screen.getByText("Component2 Loading: false")).toBeInTheDocument();
  });
});
