"use client";

import { TypeSidebar } from "./TypeSidebar";
import { EditSidebar } from "./EditSidebar";
import { useSnapshot } from "valtio";
import { stepStore } from "@/src/store/stepStore";
import { Step } from "@/src/domain/step";

export default function Sidebar() {
  const { currentStep } = useSnapshot(stepStore);

  return (
    <div className="w-80 border-l bg-muted/30 h-full overflow-y-auto">
      <div className="p-6">
        {currentStep === Step.TYPE && <TypeSidebar />}
        {currentStep === Step.EDIT && <EditSidebar />}
      </div>
    </div>
  );
}
