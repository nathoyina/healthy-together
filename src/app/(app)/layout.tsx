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
          <div className="rounded-3xl border border-border/70 bg-card/65 p-3 shadow-[0_8px_40px_-24px_color-mix(in_oklab,var(--primary)_55%,transparent)] backdrop-blur-sm md:p-4">
          {children}
          </div>
        </div>
      </main>
    </div>
  );
}
