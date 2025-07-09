import { CanvasLayout } from "@/components/Canvas/CanvasLayout";
import Sidebar from "@/components/SIdebar/Sidebar";

export default function TypographyEditor() {
  return (
    <div className="flex h-screen w-screen bg-background">
      <CanvasLayout />
      <Sidebar />
    </div>
  );
}
