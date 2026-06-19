import { FloatingNavbar } from "@/components/landing/floating-navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FloatingNavbar />
      {children}
    </>
  );
}
