import { commandsToSVGPath } from "@/src/lib/utils";
import { textSVGStore } from "@/src/store/textSVGStore";
import { useSnapshot } from "valtio";

interface FontGlyphRendererProps {
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
}

export function FontGlyphRenderer({
  size = 200,
  fill = "#000",
  stroke = "none",
  strokeWidth = 0,
  className = "",
}: FontGlyphRendererProps) {
  const { textSVGList } = useSnapshot(textSVGStore);

  return (
    <div className="flex gap-4">
      {textSVGList.map((_, index) => (
        <GlyphRenderer
          key={index}
          index={index}
          size={size}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          className={className}
        />
      ))}
    </div>
  );
}

function GlyphRenderer({
  index,
  size,
  fill,
  stroke,
  strokeWidth,
  className,
}: {
  index: number;
  size: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  className: string;
}) {
  const path = useSnapshot(textSVGStore.textSVGList[index]);
  const pathData = commandsToSVGPath(path.commands);
  const bbox = path.bbox;
  const viewBox = bbox ? `${bbox.minX} ${bbox.minY} ${bbox.maxX - bbox.minX} ${bbox.maxY - bbox.minY}` : "0 0 648 750";

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      className={className}
      style={{ display: "block", transform: "scaleY(-1)" }}
    >
      <path d={pathData} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  );
}
