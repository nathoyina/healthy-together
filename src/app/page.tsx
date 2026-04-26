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
            Company goals that teams commit to together.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground md:text-lg">
            Join shared workplace goals, check in daily, and see company leaderboards in
            real time. Everyone in the company can join and progress together.
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
          How company goals work
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
          Create goals as public for the company or private for yourself. Colleagues join
          public goals and appear on the same leaderboard.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base">Join company goals</CardTitle>
              <CardDescription>
                Browse shared goals and join in one tap. No friend requests needed —
                everyone in the company can participate.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base">Check in daily</CardTitle>
              <CardDescription>
                Log progress with simple daily/weekly check-ins. Habits support done/not
                done, daily counts, and weekly counts.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base">See company leaderboard</CardTitle>
              <CardDescription>
                Each goal has a shared leaderboard across all participants, making progress
                visible and motivating.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
