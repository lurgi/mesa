import { commandsToSVGPath } from "@/src/lib/utils";
import { textSVGStore, textSVGItemManager } from "@/src/store/textSVGStore";
import { useSnapshot } from "valtio";
import React from "react";

interface FontGlyphRendererProps {
  className?: string;
}

export function FontGlyphRenderer({ className = "" }: FontGlyphRendererProps) {
  const { textSVGItems } = useSnapshot(textSVGStore);

  return (
    <div className="flex gap-4">
      {textSVGItems.map((item) => (
        <Glyph key={item.id} itemId={item.id} className={className} />
      ))}
    </div>
  );
}

function Glyph({ itemId, className }: { itemId: string; className: string }) {
  const { textSVGItems } = useSnapshot(textSVGStore);
  const item = textSVGItems.find((item) => item.id === itemId);

  if (!item) return null;

  const pathData = commandsToSVGPath(item.path.commands);
  const bbox = item.path.bbox;
  const viewBox = bbox ? `${bbox.minX} ${bbox.minY} ${bbox.maxX - bbox.minX} ${bbox.maxY - bbox.minY}` : "0 0 648 750";

  return (
    <Selectable itemId={itemId} isSelected={item.isSelected}>
      <svg
        width={200}
        height={200}
        viewBox={viewBox}
        className={className}
        style={{
          display: "block",
          transform: `scaleY(-1)`,
          fontWeight: item.style.weight,
          fontStyle: item.style.slant !== 0 ? `skewX(${item.style.slant}deg)` : "normal",
        }}
      >
        <path
          d={pathData}
          fill={item.style.fillColor}
          stroke={item.style.strokeColor}
          strokeWidth={item.style.strokeWidth}
          style={{
            filter: item.style.radius > 0 ? `blur(${item.style.radius}px)` : "none",
          }}
        />
      </svg>
    </Selectable>
  );
}

function Selectable({
  itemId,
  isSelected,
  children,
}: {
  itemId: string;
  isSelected: boolean;
  children: React.ReactNode;
}) {
  const handleClick = (e: React.MouseEvent) => {
    const itemActions = textSVGItemManager.getItemActions(itemId);

    if (itemActions) {
      if (e.metaKey || e.ctrlKey) {
        if (isSelected) {
          itemActions.deselect();
        } else {
          itemActions.select();
        }
      } else {
        textSVGItemManager.deselectAll();
        itemActions.select();
      }
    }
  };

  return (
    <div
      className={`relative cursor-pointer transition-all duration-200 ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-2 bg-blue-50/20" : "hover:ring-1 hover:ring-gray-300"
      }`}
      onClick={handleClick}
      style={{
        borderRadius: "4px",
      }}
    >
      {children}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
}
