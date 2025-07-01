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
    handleWheel,
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
        onWheel={handleWheel}
        style={{
          backgroundImage: `radial-gradient(circle, #D2D6DB 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0",
        }}
      >
        <div
          className="absolute inset-0 w-[2000px] h-[1500px] max-w-[4000px] max-h-[3000px]"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {children}
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-100">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">캔버스 컨트롤</span>
          </div>

          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Space</kbd>
              <span>+ 드래그로 캔버스 이동</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl</kbd>
              <span>+ 휠로 줌 인/아웃</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">현재 줌</span>
              <span className="text-sm font-semibold text-gray-700">{Math.round(transform.scale * 100)}%</span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: `${((transform.scale - minZoom) / (maxZoom - minZoom)) * 100}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{Math.round(minZoom * 100)}%</span>
              <span>{Math.round(maxZoom * 100)}%</span>
            </div>
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
