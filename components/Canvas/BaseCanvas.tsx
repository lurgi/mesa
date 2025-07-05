import React from "react";
import { useCanvasEvents } from "./useCanvasEvents";
import type { CanvasProps, CanvasTransform } from "@/src/domain/canvas";
import { useToast } from "@/components/Toaster/useToast";

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
    feedbackMessage,
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

  const { showToast } = useToast();

  React.useEffect(() => {
    if (feedbackMessage) {
      showToast(feedbackMessage, {
        duration: 2000,
        position: "top-center",
        dismissible: true,
      });
    }
  }, [feedbackMessage, showToast]);

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

      <ZoomHelper transform={transform} minZoom={minZoom} maxZoom={maxZoom} />

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

interface ZoomHelperProps {
  transform: CanvasTransform;
  minZoom: number;
  maxZoom: number;
}

function ZoomHelper({ transform, minZoom, maxZoom }: ZoomHelperProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-100">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Canvas Controls</span>
        </div>

        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Space</kbd>
            <span>+ drag to move canvas</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl/Command</kbd>
            <span>+ wheel to zoom in/out</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Current Zoom</span>
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
        title={isMaxZoom ? "Maximum zoom reached" : "Zoom in"}
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
        title={isMinZoom ? "Minimum zoom reached" : "Zoom out"}
      >
        -
      </button>
      <button
        className="w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors text-xs"
        onClick={handleResetZoom}
        title="Reset zoom"
      >
        ⌂
      </button>
    </div>
  );
}
