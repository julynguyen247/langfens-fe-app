export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className=" text-gray-900  ">
      <div className=" bg-gray-100 shadow sm:rounded-lg flex flex-col  ">
        <div className="flex">{children}</div>
      </div>
    </div>
  );
}
