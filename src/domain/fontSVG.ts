import { PathCommand } from "fontkit";

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface FontData {
  commands: PathCommand[];
  _bbox?: BoundingBox;
  _cbox?: BoundingBox | null;
}
