"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type SidebarAgent = {
  id: string;
  name: string;
};

type DashboardShellProps = {
  agents: SidebarAgent[];
  header: ReactNode;
  children: ReactNode;
};

export function DashboardShell({
  agents,
  header,
  children,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar agents={agents} />
      <SidebarInset className="min-h-svh">
        {header}
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
