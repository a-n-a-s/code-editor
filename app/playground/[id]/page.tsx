"use client";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { usePlayground } from "@/features/playground/hooks/usePlayground";
import { useParams } from "next/navigation";
import React from "react";

const Page = () => {
  const { id } = useParams<{ id: string }>();
  const { playground, templateData, isLoading, error } = usePlayground(id);
  return (
    <div>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center gap-2">
            <div className="flex flex-col flex-1">
              {playground?.name || "Code playground"}
            </div>
          </div>
        </header>
      </SidebarInset>
    </div>
  );
};

export default Page;
