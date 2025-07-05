export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasProps {
  children?: React.ReactNode;
  minZoom?: number;
  maxZoom?: number;
  initialTransform?: Partial<CanvasTransform>;
  onTransformChange?: (transform: CanvasTransform) => void;
}

export interface CanvasElementProps extends React.HTMLAttributes<HTMLDivElement> {
  x: number;
  y: number;
}
