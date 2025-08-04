import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

const PlaygroundLayout = ({ children }: { children: React.ReactNode }) => {
  return <SidebarProvider>{children}</SidebarProvider>;
};

export default PlaygroundLayout;
