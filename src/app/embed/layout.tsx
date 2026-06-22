export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <style>{`
        html,
        body {
          background: transparent !important;
          background-color: transparent !important;
        }
        body {
          min-height: 0 !important;
          height: 100%;
          overflow: hidden;
        }
      `}</style>
      {children}
    </>
  );
}
