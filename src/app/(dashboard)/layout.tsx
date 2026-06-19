import { type ReactNode, Suspense } from "react";
import {
  DashboardHeaderFallback,
  DashboardHeaderSlot,
  DashboardSidebarFallback,
  DashboardSidebarSlot,
} from "@/components/dashboard/dashboard-chrome";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Suspense fallback={<DashboardSidebarFallback />}>
        <DashboardSidebarSlot />
      </Suspense>
      <SidebarInset className="min-h-svh">
        <Suspense fallback={<DashboardHeaderFallback />}>
          <DashboardHeaderSlot />
        </Suspense>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
