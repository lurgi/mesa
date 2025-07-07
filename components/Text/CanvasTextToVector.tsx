"use client";

import React, { useRef, useEffect, useState } from "react";
import { textStore } from "@/src/store/textStore";
import { useSnapshot } from "valtio";
import { cn } from "@/src/lib/utils";

export function CanvasTextToVector() {
  const { fontFamily, fontWeight } = useSnapshot(textStore);
  const [inputText, setInputText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setInputText(newText);
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 60;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = `600 40px "${fontFamily}"`;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (inputText) {
      ctx.fillText(inputText, canvas.width / 2, canvas.height / 2);
    } else {
      ctx.fillText("텍스트를 입력하세요", canvas.width / 2, canvas.height / 2);
    }
  }, [inputText, fontFamily, fontWeight]);

  return (
    <div
      className={cn(
        "relative border-1 rounded-sm border-transparent",
        "hover:border-blue-400 transition-colors duration-200",
        isEditing && "border-blue-400"
      )}
    >
      <canvas
        ref={canvasRef}
        className={cn("cursor-text")}
        style={{ width: "400px", height: "60px" }}
        onClick={() => inputRef.current?.focus()}
      />

      <input
        ref={inputRef}
        type="text"
        value={inputText}
        onChange={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="absolute inset-0 opacity-0 cursor-text"
      />
    </div>
  );
}
