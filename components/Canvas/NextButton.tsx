"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/src/lib/utils";
import { textStore } from "@/src/store/textStore";
import { ArrowRightIcon } from "lucide-react";
import { useSnapshot } from "valtio";

export function NextButton() {
  const { text } = useSnapshot(textStore);

  const handleClick = () => {
    console.log(`TODO: textToVector: ${text}`);
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
