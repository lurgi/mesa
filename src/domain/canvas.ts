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

export const CONSTRAIN_CANVAS_SIZE = {
  width: 4000,
  height: 3000,
};
