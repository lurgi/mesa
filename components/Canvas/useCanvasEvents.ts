import React from "react";
import type { CanvasTransform } from "@/src/domain/canvas";

const ZOOM_IN_RATIO = 1.04;
const ZOOM_OUT_RATIO = 2 - ZOOM_IN_RATIO;

export function useCanvasEvents({
  minZoom = 0.25,
  maxZoom = 4,
  initialTransform = {},
  onTransformChange,
}: {
  minZoom?: number;
  maxZoom?: number;
  initialTransform?: Partial<CanvasTransform>;
  onTransformChange?: (transform: CanvasTransform) => void;
}) {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const [isSpacePressed, setIsSpacePressed] = React.useState(false);
  const [transform, setTransform] = React.useState<CanvasTransform>({
    x: 0,
    y: 0,
    scale: 1,
    ...initialTransform,
  });
  const [lastMousePos, setLastMousePos] = React.useState({ x: 0, y: 0 });

  // Zoom 이벤트 훅 사용
  const { feedbackMessage, handleZoomIn, handleZoomOut, handleWheel, handleResetZoom, isMinZoom, isMaxZoom } =
    useCanvasZoomEvents({
      minZoom,
      maxZoom,
      transform,
      setTransform,
      canvasRef,
    });

  // Key 이벤트 훅 사용
  useCanvasKeyEvents({
    isSpacePressed,
    setIsSpacePressed,
    setIsPanning,
  });

  React.useEffect(() => {
    onTransformChange?.(transform);
  }, [transform, onTransformChange]);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (isSpacePressed) {
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    },
    [isSpacePressed, setIsPanning]
  );

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && isSpacePressed) {
        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;

        setTransform((prev) => ({
          ...prev,
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    },
    [isPanning, isSpacePressed, lastMousePos, setTransform]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsPanning(false);
  }, [setIsPanning]);

  return {
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
  };
}

function useCanvasZoomEvents({
  minZoom = 0.25,
  maxZoom = 4,
  transform,
  setTransform,
  canvasRef,
}: {
  minZoom?: number;
  maxZoom?: number;
  transform: CanvasTransform;
  setTransform: React.Dispatch<React.SetStateAction<CanvasTransform>>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);

  const showZoomFeedback = React.useCallback((message: string) => {
    setFeedbackMessage(message);
    // 3초 후에 feedback message를 리셋
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  }, []);

  const handleZoomIn = React.useCallback(
    (centerX?: number, centerY?: number) => {
      const newScale = Math.min(maxZoom, transform.scale * ZOOM_IN_RATIO);
      if (newScale === maxZoom && transform.scale === maxZoom) {
        showZoomFeedback(`최대 줌: ${Math.round(maxZoom * 100)}%`);
        return;
      }

      if (centerX !== undefined && centerY !== undefined) {
        const scaleRatio = newScale / transform.scale;
        const newX = centerX - (centerX - transform.x) * scaleRatio;
        const newY = centerY - (centerY - transform.y) * scaleRatio;

        setTransform({
          x: newX,
          y: newY,
          scale: newScale,
        });
      } else {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const canvasCenterX = rect.width / 2;
          const canvasCenterY = rect.height / 2;
          const scaleRatio = newScale / transform.scale;
          const newX = canvasCenterX - (canvasCenterX - transform.x) * scaleRatio;
          const newY = canvasCenterY - (canvasCenterY - transform.y) * scaleRatio;

          setTransform({
            x: newX,
            y: newY,
            scale: newScale,
          });
        } else {
          setTransform((prev) => ({ ...prev, scale: newScale }));
        }
      }
    },
    [transform, maxZoom, showZoomFeedback, setTransform, canvasRef]
  );

  const handleZoomOut = React.useCallback(
    (centerX?: number, centerY?: number) => {
      const newScale = Math.max(minZoom, transform.scale * ZOOM_OUT_RATIO);
      if (newScale === minZoom && transform.scale === minZoom) {
        showZoomFeedback(`최소 줌: ${Math.round(minZoom * 100)}%`);
        return;
      }

      if (centerX !== undefined && centerY !== undefined) {
        const scaleRatio = newScale / transform.scale;
        const newX = centerX - (centerX - transform.x) * scaleRatio;
        const newY = centerY - (centerY - transform.y) * scaleRatio;

        setTransform({
          x: newX,
          y: newY,
          scale: newScale,
        });
      } else {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const canvasCenterX = rect.width / 2;
          const canvasCenterY = rect.height / 2;
          const scaleRatio = newScale / transform.scale;
          const newX = canvasCenterX - (canvasCenterX - transform.x) * scaleRatio;
          const newY = canvasCenterY - (canvasCenterY - transform.y) * scaleRatio;

          setTransform({
            x: newX,
            y: newY,
            scale: newScale,
          });
        } else {
          setTransform((prev) => ({ ...prev, scale: newScale }));
        }
      }
    },
    [transform, minZoom, showZoomFeedback, setTransform, canvasRef]
  );

  const handleWheel = React.useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (e.deltaY > 0) {
          handleZoomOut(mouseX, mouseY);
        } else {
          handleZoomIn(mouseX, mouseY);
        }
      }
    },
    [handleZoomIn, handleZoomOut]
  );

  const handleResetZoom = React.useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, [setTransform]);

  const isMinZoom = transform.scale <= minZoom;
  const isMaxZoom = transform.scale >= maxZoom;

  return {
    feedbackMessage,
    handleZoomIn,
    handleZoomOut,
    handleWheel,
    handleResetZoom,
    isMinZoom,
    isMaxZoom,
  };
}

function useCanvasKeyEvents({
  isSpacePressed,
  setIsSpacePressed,
  setIsPanning,
}: {
  isSpacePressed: boolean;
  setIsSpacePressed: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    },
    [isSpacePressed, setIsSpacePressed]
  );

  const handleKeyUp = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    },
    [setIsSpacePressed, setIsPanning]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
