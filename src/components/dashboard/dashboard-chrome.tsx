import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SignOutDropdownItem } from "@/components/dashboard/sign-out-dropdown-item";
import { listAgentsForUser } from "@/lib/db/queries/agents";

export function DashboardSidebarFallback() {
  return <AppSidebar agents={[]} />;
}

export function DashboardHeaderFallback() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="h-4 w-32 animate-pulse rounded bg-muted/60" />
    </header>
  );
}

export async function DashboardSidebarSlot() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const agents = await listAgentsForUser(session.user.id);

  return (
    <AppSidebar
      agents={agents.map((agent) => ({ id: agent.id, name: agent.name }))}
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      logout={<SignOutDropdownItem />}
    />
  );
}

export async function DashboardHeaderSlot() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return <DashboardHeader />;
}
