"use client";

import React from "react";
import { textStore } from "@/src/store/textStore";
import { useSnapshot } from "valtio";
import { cn } from "@/src/lib/utils";

export function TextInput({ ref }: { ref: React.Ref<HTMLInputElement> }) {
  const { text, selectedFont, selectedFontWeight, fontSlant } = useSnapshot(textStore);
  const [localText, setLocalText] = React.useState(text);
  const [isComposing, setIsComposing] = React.useState(false);

  React.useEffect(() => {
    if (!isComposing) {
      setLocalText(text);
    }
  }, [text, isComposing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalText(value);

    if (!isComposing) {
      textStore.text = value;
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const value = e.currentTarget.value;
    setLocalText(value);
    textStore.text = value;
  };

  return (
    <div
      className={cn(
        "rounded-sm",
        "border-2 border-slate-300",
        "hover:border-blue-400",
        "focus-within:border-blue-400",
        "focus-within:ring-2 focus-within:ring-blue-400/20",
        "transition-all duration-200 ease-in-out"
      )}
    >
      <input
        ref={ref}
        name="text"
        type="text"
        value={localText}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder="Type your text here!"
        className={cn("py-4 text-4xl min-w-md text-center", "focus:outline-none")}
        style={{
          fontFamily: selectedFont?.family,
          fontWeight: selectedFontWeight,
          transform: `skewX(${-fontSlant}deg)`,
        }}
      />
    </div>
  );
}
