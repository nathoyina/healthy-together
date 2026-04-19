import { AppNav } from "@/components/layout/app-nav";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppNav />
      <main className="flex-1 pb-16">
        <div className="container max-w-lg px-4 py-6 md:mx-auto md:max-w-2xl md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
