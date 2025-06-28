import { useCanvasEvents } from "./useCanvasEvents";
import type { CanvasProps } from "@/src/types/canvas";

export function BaseCanvas({
  children,
  minZoom = 0.25,
  maxZoom = 4,
  initialTransform = {},
  onTransformChange,
  ...props
}: CanvasProps) {
  const {
    canvasRef,
    isPanning,
    isSpacePressed,
    transform,
    zoomFeedback,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    isMinZoom,
    isMaxZoom,
  } = useCanvasEvents({ minZoom, maxZoom, initialTransform, onTransformChange });

  return (
    <div className="w-full h-screen overflow-hidden bg-white relative" {...props}>
      <div
        ref={canvasRef}
        className={`w-full h-full relative ${isSpacePressed ? "cursor-grab" : "cursor-default"} ${
          isPanning ? "cursor-grabbing" : ""
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          backgroundImage: `radial-gradient(circle, #D2D6DB 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            minWidth: "2000px",
            minHeight: "1500px",
            maxWidth: "4000px",
            maxHeight: "3000px",
          }}
        >
          {children}
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-sm text-gray-600">
        <div className="space-y-1">
          <div>스페이스바 + 드래그: 캔버스 이동</div>
          <div>Ctrl/Cmd + 휠: 줌 인/아웃</div>
          <div className="text-xs text-gray-400 mt-2">
            줌: {Math.round(transform.scale * 100)}% ({Math.round(minZoom * 100)}%~{Math.round(maxZoom * 100)}%)
          </div>
        </div>
      </div>

      {zoomFeedback && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium pointer-events-none">
          {zoomFeedback}
        </div>
      )}

      <ZoomControl
        isMaxZoom={isMaxZoom}
        isMinZoom={isMinZoom}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleResetZoom={handleResetZoom}
      />
    </div>
  );
}

function ZoomControl({
  isMaxZoom,
  isMinZoom,
  handleZoomIn,
  handleZoomOut,
  handleResetZoom,
}: {
  isMaxZoom: boolean;
  isMinZoom: boolean;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
}) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
      <button
        className={`w-10 h-10 border border-gray-200 rounded-lg shadow-sm flex items-center justify-center transition-colors ${
          isMaxZoom
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800"
        }`}
        onClick={handleZoomIn}
        disabled={isMaxZoom}
        title={isMaxZoom ? "최대 줌 도달" : "줌 인"}
      >
        +
      </button>
      <button
        className={`w-10 h-10 border border-gray-200 rounded-lg shadow-sm flex items-center justify-center transition-colors ${
          isMinZoom
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800"
        }`}
        onClick={handleZoomOut}
        disabled={isMinZoom}
        title={isMinZoom ? "최소 줌 도달" : "줌 아웃"}
      >
        -
      </button>
      <button
        className="w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors text-xs"
        onClick={handleResetZoom}
        title="줌 리셋"
      >
        ⌂
      </button>
    </div>
  );
}
