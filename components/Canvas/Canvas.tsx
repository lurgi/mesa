"use client";

import React from "react";
import { BaseCanvas } from "./BaseCanvas";
import { CanvasElement } from "./CanvasElement";
import { CONSTRAIN_CANVAS_SIZE } from "@/src/domain/canvas";
import { TextInput } from "../Text/TextInput";
import { useSnapshot } from "valtio";
import { stepStore } from "@/src/store/stepStore";
import { Step } from "@/src/domain/step";
import { FontGlyphRenderer } from "./FontGlyphRenderer";

export function Canvas() {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const textInputRef = React.useRef<HTMLInputElement>(null);
  const rect = textInputRef.current?.getBoundingClientRect();

  const { currentStep } = useSnapshot(stepStore);

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
      {currentStep === Step.TYPE && (
        <CanvasElement x={midWidth - (rect?.width ?? 0) / 2} y={midHeight - (rect?.height ?? 0) / 2}>
          <TextInput ref={textInputRef} />
        </CanvasElement>
      )}
      {currentStep === Step.EDIT && (
        <CanvasElement x={midWidth - (rect?.width ?? 0) / 2} y={midHeight - (rect?.height ?? 0) / 2}>
          <FontGlyphRenderer />
        </CanvasElement>
      )}
    </BaseCanvas>
  );
}
