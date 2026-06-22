import { auth } from "@/auth";
import { FloatingNavbar } from "@/components/landing/floating-navbar";

export function PublicNavbarFallback() {
  return <FloatingNavbar />;
}

export async function PublicNavbar() {
  const session = await auth();

  return <FloatingNavbar isAuthenticated={!!session?.user} />;
}
