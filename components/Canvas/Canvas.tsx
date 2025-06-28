"use client";

import type React from "react";
import { BaseCanvas } from "./BaseCanvas";
import { CanvasElement } from "./CanvasElement";

export function Canvas() {
  return (
    <BaseCanvas
      minZoom={0.25}
      maxZoom={4}
      onTransformChange={(transform) => {
        console.log("Transform changed:", transform);
      }}
    >
      <CanvasElement x={400} y={300}>
        <div className="w-32 h-32 bg-blue-500 rounded-lg shadow-lg flex items-center justify-center text-white font-semibold">
          Blue Box
        </div>
      </CanvasElement>

      <CanvasElement x={600} y={200}>
        <div className="w-40 h-20 bg-green-500 rounded-lg shadow-lg flex items-center justify-center text-white font-semibold">
          Green Rectangle
        </div>
      </CanvasElement>

      <CanvasElement x={300} y={500}>
        <div className="w-24 h-24 bg-red-500 rounded-full shadow-lg flex items-center justify-center text-white font-semibold text-sm">
          Red Circle
        </div>
      </CanvasElement>

      <CanvasElement x={800} y={400}>
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-2">Text Element</h3>
          <p className="text-gray-600 text-sm">
            이것은 캔버스에 주입된
            <br />
            텍스트 요소입니다.
          </p>
        </div>
      </CanvasElement>
    </BaseCanvas>
  );
}
