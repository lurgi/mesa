"use client";

import React from "react";
import { BaseCanvas } from "./BaseCanvas";
import { CanvasElement } from "./CanvasElement";
import { CONSTRAIN_CANVAS_SIZE } from "@/src/domain/canvas";
import { TextInput } from "../Text/TextInput";

export function Canvas() {
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const [midWidth, setMidWidth] = React.useState<number>(0);
  const [midHeight, setMidHeight] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    const canvasSize = canvasRef.current?.getBoundingClientRect();
    const midWidth = CONSTRAIN_CANVAS_SIZE.WIDTH / 2 + (canvasSize?.width ?? 0) / 2;
    const midHeight = CONSTRAIN_CANVAS_SIZE.HEIGHT / 2 + (canvasSize?.height ?? 0) / 2;
    setMidWidth(midWidth);
    setMidHeight(midHeight);
  }, []);

  return (
    <BaseCanvas ref={canvasRef}>
      <CanvasElement x={midWidth} y={midHeight}>
        <TextInput />
      </CanvasElement>
    </BaseCanvas>
  );
}
