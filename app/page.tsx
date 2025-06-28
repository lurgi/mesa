import { Canvas } from "@/components/Canvas/Canvas";
import Sidebar from "@/components/SIdebar/Sidebar";

export default function TypographyEditor() {
  return (
    <div className="flex h-screen bg-background">
      <Canvas />
      <Sidebar />
    </div>
  );
}
