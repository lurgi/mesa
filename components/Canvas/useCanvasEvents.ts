import { useState, useRef, useEffect, useCallback } from "react";
import type { CanvasTransform } from "@/src/domain/canvas";

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
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [transform, setTransform] = useState<CanvasTransform>({
    x: 0,
    y: 0,
    scale: 1,
    ...initialTransform,
  });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showZoomFeedback = useCallback((message: string) => {
    setFeedbackMessage(message);
    // 3초 후에 feedback message를 리셋
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  }, []);

  useEffect(() => {
    onTransformChange?.(transform);
  }, [transform, onTransformChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    },
    [isSpacePressed]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      setIsSpacePressed(false);
      setIsPanning(false);
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isSpacePressed) {
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    },
    [isSpacePressed]
  );

  const handleMouseMove = useCallback(
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
    [isPanning, isSpacePressed, lastMousePos]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom관련 함수
  const handleZoomIn = useCallback(
    (centerX?: number, centerY?: number) => {
      const newScale = Math.min(maxZoom, transform.scale * 1.2);
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
    [transform, maxZoom, showZoomFeedback]
  );

  const handleZoomOut = useCallback(
    (centerX?: number, centerY?: number) => {
      const newScale = Math.max(minZoom, transform.scale * 0.8);
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
    [transform, minZoom, showZoomFeedback]
  );

  const handleWheel = useCallback(
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

  const handleResetZoom = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const isMinZoom = transform.scale <= minZoom;
  const isMaxZoom = transform.scale >= maxZoom;

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
