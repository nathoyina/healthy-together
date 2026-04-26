import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppNavMobile } from "./app-nav-mobile";

const links = [
  { href: "/dashboard", label: "Check-in" },
  { href: "/goals", label: "Habits" },
  { href: "/friends", label: "Friends" },
  { href: "/groups", label: "Groups" },
] as const;

export async function AppNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-14 max-w-3xl items-center justify-between gap-4 px-4 md:max-w-4xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground hover:opacity-90"
        >
          <span aria-hidden>🌈</span>
          <span className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
            Healthy Together
          </span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/settings"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Settings
          </Link>
        </nav>
        <AppNavMobile />
        <div className="hidden text-right text-xs text-muted-foreground sm:block">
          <span className="font-medium text-foreground">
            @{profile?.username ?? "…"}
          </span>
        </div>
      </div>
    </header>
  );
}
