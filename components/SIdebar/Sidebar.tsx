import React from "react";
import { TypeSidebar } from "./TypeSidebar";
import { EditSidebar } from "./EditSidebar";

export default function Sidebar() {
  return (
    <div className="w-80 border-l bg-muted/30 h-full overflow-y-auto">
      <div className="p-6">
        <TypeSidebar />
        <EditSidebar />
      </div>
    </div>
  );
}
