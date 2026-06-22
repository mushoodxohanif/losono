import { Suspense } from "react";
import {
  PublicNavbar,
  PublicNavbarFallback,
} from "@/components/landing/public-navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<PublicNavbarFallback />}>
        <PublicNavbar />
      </Suspense>
      {children}
    </>
  );
}
