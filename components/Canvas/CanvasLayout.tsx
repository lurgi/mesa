import { Canvas } from "@/components/Canvas/Canvas";
import { NextButton } from "@/components/Canvas/NextButton";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export function CanvasLayout() {
  return (
    <div className="relative flex h-full w-full bg-background">
      <Button variant={"outline"} size="icon" className="absolute top-4 left-4 z-9 cursor-pointer">
        <ArrowLeftIcon />
      </Button>
      <Canvas />
      <NextButton />
    </div>
  );
}
