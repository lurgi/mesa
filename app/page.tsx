import { Canvas } from "@/components/Canvas/Canvas";
import Sidebar from "@/components/SIdebar/Sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export default function TypographyEditor() {
  return (
    <div className="relative flex h-screen bg-background">
      <Button variant={"outline"} size="icon" className="absolute top-4 left-4 z-9 ">
        <ArrowLeftIcon />
      </Button>
      <Canvas />
      <Sidebar />
    </div>
  );
}
