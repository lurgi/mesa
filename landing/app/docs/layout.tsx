import { Leftbar } from "@/components/leftbar";

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex items-start gap-8 w-[86vw] mx-auto">
      <Leftbar key="leftbar" />
      <div className="flex-[5.25]">{children}</div>
    </div>
  );
}
