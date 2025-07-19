"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/src/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import { textStore } from "@/src/store/textStore";
import { useSnapshot } from "valtio";
import { useGetSpecificGoogleFont } from "@/src/hooks/useGetSpecificGoogleFont";
import { Font, create } from "fontkit";
import { createTextSVGItems } from "@/src/store/textSVGStore";
import { stepStore } from "@/src/store/stepStore";
import { Step } from "@/src/domain/step";

export function NextButton() {
  const { text, selectedFont, selectedFontWeight } = useSnapshot(textStore);
  const { data: fontBuffer } = useGetSpecificGoogleFont({
    fontUrl: selectedFont?.files[selectedFontWeight] || "",
    fontFamily: selectedFont?.family,
  });

  const handleClick = async () => {
    if (!fontBuffer) return;
    const buffer = Buffer.from(fontBuffer);
    const font = create(buffer) as Font;

    const run = font.layout(text);
    const paths = run.glyphs.map((g) => g.path);

    createTextSVGItems(paths);
    stepStore.currentStep = Step.EDIT;
  };

  return (
    <Button
      className={cn(
        "absolute bottom-64 left-1/2 -translate-x-1/2 z-9",
        "bg-blue-500 text-white hover:bg-blue-600",
        "cursor-pointer shadow-md"
      )}
      onClick={handleClick}
    >
      Next
      <ArrowRightIcon />
    </Button>
  );
}
