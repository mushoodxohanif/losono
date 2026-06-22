import { auth } from "@/auth";
import { FloatingNavbar } from "@/components/landing/floating-navbar";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <FloatingNavbar isAuthenticated={!!session?.user} />
      {children}
    </>
  );
}
