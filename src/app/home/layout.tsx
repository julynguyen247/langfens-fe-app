import LangfensHeader from "@/components/LangfensHeader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen text-gray-900 ">
      <LangfensHeader />
      <div className=" bg-gray-100 shadow sm:rounded-lg flex flex-col ">
        <div className="flex h-screen">{children}</div>
      </div>
    </div>
  );
}
