import type { CanvasElementProps } from "@/src/domain/canvas";

export function CanvasElement({ children, x = 0, y = 0, className = "" }: CanvasElementProps) {
  return (
    <div
      className={`absolute pointer-events-auto ${className}`}
      style={{
        left: x,
        top: y,
      }}
    >
      {children}
    </div>
  );
}
