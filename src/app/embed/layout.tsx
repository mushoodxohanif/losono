import { EmbedChromeFix } from "@/components/embed/embed-chrome-fix";

export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <EmbedChromeFix />
      {children}
    </>
  );
}
