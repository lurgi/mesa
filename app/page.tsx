"use client";
import React from "react";

import { CanvasLayout } from "@/components/Canvas/CanvasLayout";
import Sidebar from "@/components/SIdebar/Sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function TypographyEditor() {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen bg-background">
        <CanvasLayout />
        <Sidebar />
      </div>
    </QueryClientProvider>
  );
}
