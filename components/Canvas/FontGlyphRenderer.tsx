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
  const { textSVG: fontData } = useSnapshot(textSVGStore);

  const commandsToSVGPath = (
    commands: readonly {
      readonly command: "moveTo" | "lineTo" | "quadraticCurveTo" | "bezierCurveTo" | "closePath";
      readonly args: readonly number[];
    }[]
  ) => {
    return commands
      .map((cmd) => {
        switch (cmd.command) {
          case "moveTo":
            return `M ${cmd.args[0]} ${cmd.args[1]}`;
          case "lineTo":
            return `L ${cmd.args[0]} ${cmd.args[1]}`;
          case "quadraticCurveTo":
            return `Q ${cmd.args[0]} ${cmd.args[1]} ${cmd.args[2]} ${cmd.args[3]}`;
          case "bezierCurveTo":
            return `C ${cmd.args[0]} ${cmd.args[1]} ${cmd.args[2]} ${cmd.args[3]} ${cmd.args[4]} ${cmd.args[5]}`;
          case "closePath":
            return "Z";
          default:
            return "";
        }
      })
      .join(" ");
  };

  if (!fontData || !fontData.commands) {
    return null;
  }

  const pathData = commandsToSVGPath(fontData.commands);
  const bbox = fontData._bbox;
  const viewBox = bbox ? `${bbox.minX} ${bbox.minY} ${bbox.maxX - bbox.minX} ${bbox.maxY - bbox.minY}` : "0 0 648 750";

  return (
    <svg width={size} height={size} viewBox={viewBox} className={className} style={{ display: "block" }}>
      <path d={pathData} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  );
}
