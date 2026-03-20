export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="text-[var(--foreground)]">
      <div className="flex flex-col">
        <div className="flex">{children}</div>
      </div>
    </div>
  );
}
