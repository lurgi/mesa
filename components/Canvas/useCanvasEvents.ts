import React from "react";
import { CONSTRAIN_CANVAS_SIZE, type CanvasTransform } from "@/src/domain/canvas";
import { useState, useEffect, useCallback } from "react";

const ZOOM_IN_RATIO = 1.05;
const ZOOM_OUT_RATIO = 2 - ZOOM_IN_RATIO;
const MAX_ZOOM = 2;
const MIN_ZOOM = 0.5;

export function useCanvasEvents({
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM,
  onTransformChange,
}: {
  minZoom?: number;
  maxZoom?: number;
  onTransformChange?: (transform: CanvasTransform) => void;
}) {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [transform, setTransform] = useState<CanvasTransform>({
    x: -CONSTRAIN_CANVAS_SIZE.WIDTH / 2,
    y: -CONSTRAIN_CANVAS_SIZE.HEIGHT / 2,
    scale: 1,
  });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const constrainTransform = useCallback((newTransform: CanvasTransform) => {
    if (!canvasRef.current) return newTransform;

    const rect = canvasRef.current.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    const canvasWidth = CONSTRAIN_CANVAS_SIZE.WIDTH;
    const canvasHeight = CONSTRAIN_CANVAS_SIZE.HEIGHT;

    const scaledCanvasWidth = canvasWidth * newTransform.scale;
    const scaledCanvasHeight = canvasHeight * newTransform.scale;

    const minX = viewportWidth - scaledCanvasWidth;
    const maxX = 0;
    const minY = viewportHeight - scaledCanvasHeight;
    const maxY = 0;

    return {
      ...newTransform,
      x: Math.min(Math.max(newTransform.x, minX), maxX),
      y: Math.min(Math.max(newTransform.y, minY), maxY),
    };
  }, []);

  const setTransformWithConstraints = useCallback(
    (newTransform: CanvasTransform | ((prev: CanvasTransform) => CanvasTransform)) => {
      setTransform((prev) => {
        const next = typeof newTransform === "function" ? newTransform(prev) : newTransform;
        return constrainTransform(next);
      });
    },
    [constrainTransform]
  );

  const { feedbackMessage, handleZoomIn, handleZoomOut, handleWheel, handleResetZoom, isMinZoom, isMaxZoom } =
    useCanvasZoomEvents({
      minZoom,
      maxZoom,
      transform,
      setTransform: setTransformWithConstraints,
      canvasRef,
    });

  useCanvasKeyEvents({
    isSpacePressed,
    setIsSpacePressed,
    setIsPanning,
  });

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useCanvasMouseEvents({
    isSpacePressed,
    isPanning,
    setIsPanning,
    lastMousePos,
    setLastMousePos,
    setTransform: setTransformWithConstraints,
  });

  useEffect(() => {
    onTransformChange?.(transform);
  }, [transform, onTransformChange]);

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
    minZoom,
    maxZoom,
  };
}

function useCanvasMouseEvents({
  isSpacePressed,
  isPanning,
  setIsPanning,
  lastMousePos,
  setLastMousePos,
  setTransform,
}: {
  isSpacePressed: boolean;
  isPanning: boolean;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  lastMousePos: { x: number; y: number };
  setLastMousePos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setTransform: React.Dispatch<React.SetStateAction<CanvasTransform>>;
}) {
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (isSpacePressed) {
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    },
    [isSpacePressed, setIsPanning, setLastMousePos]
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
    [isPanning, isSpacePressed, lastMousePos, setTransform, setLastMousePos]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsPanning(false);
  }, [setIsPanning]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}

function useCanvasZoomEvents({
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM,
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
    [handleZoomIn, handleZoomOut, canvasRef]
  );

  const handleResetZoom = useCallback(() => {
    setTransform({
      x: -CONSTRAIN_CANVAS_SIZE.WIDTH / 2,
      y: -CONSTRAIN_CANVAS_SIZE.HEIGHT / 2,
      scale: 1,
    });
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
