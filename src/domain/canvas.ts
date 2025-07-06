export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasElementProps extends React.HTMLAttributes<HTMLDivElement> {
  x: number;
  y: number;
}

export const CONSTRAIN_CANVAS_SIZE = {
  WIDTH: 4000,
  HEIGHT: 3000,
};
