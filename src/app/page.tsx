import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HomePage() {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.username || !profile?.onboarding_completed_at) {
        redirect("/onboarding");
      }
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border/80 bg-gradient-to-b from-muted/40 to-background px-4 py-20 md:py-28">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary">Healthy Together</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Track health goals with the people who keep you honest.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground md:text-lg">
            Simple daily and weekly health habits — check in from one screen, see streaks
            and weekly progress, and stay accountable with friends and small groups.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
              Get started
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-lg font-semibold tracking-tight">
          Starter habits you can turn on
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
          Enable them during signup or any time from Habits — each one becomes a personal
          tracker you check in on daily or weekly.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base">Core & mobility</CardTitle>
              <CardDescription>
                Daily yes/no when you finish core or mobility work — streaks keep motivation
                high.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base">Strength sessions</CardTitle>
              <CardDescription>
                Weekly count for studio or home strength sessions with a clear Mon–Sun
                target.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base">Runs this week</CardTitle>
              <CardDescription>
                Log each run through Sunday — great for solo training or a running crew.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
