export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>
      {children}
    </>
  );
}
