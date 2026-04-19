import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  goalTrackingCadenceShort,
  templateEmoji,
} from "@/lib/goal-tracking-copy";
import type { GoalType } from "@/lib/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArchiveGoalButton } from "./archive-goal-button";
import { CloneTemplateButton } from "./clone-template-button";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mine } = await supabase
    .from("goals")
    .select("id, title, type, target_per_period, archived_at, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: templates, error: templatesError } = await supabase
    .from("goals")
    .select("id, title, description, type, target_per_period, icon")
    .eq("is_template", true)
    .order("title");

  const active = (mine ?? []).filter((g) => !g.archived_at);
  const archived = (mine ?? []).filter((g) => g.archived_at);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your habits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track workouts, recovery, and routines — clone a starter or build your own.
          </p>
        </div>
        <Link href="/goals/new" className={cn(buttonVariants())}>
          New habit
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Active</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing active yet. Add a habit from templates below or create a custom tracker.
          </p>
        ) : (
          <ul className="space-y-2">
            {active.map((g) => (
              <li key={g.id}>
                <Card className="border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base">
                        <Link
                          href={`/goals/${g.id}#friend-leaderboard`}
                          className="hover:underline"
                        >
                          {g.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {goalTrackingCadenceShort(
                          g.type as GoalType,
                          g.target_per_period,
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/goals/${g.id}#friend-leaderboard`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Open
                      </Link>
                      <ArchiveGoalButton goalId={g.id} mode="archive" />
                    </div>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Starter habits (templates)
        </h2>
        <p className="text-xs text-muted-foreground">
          Curated examples — one tap adds a copy to your active habits.
        </p>
        {templatesError ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Could not load templates: {templatesError.message}
          </p>
        ) : null}
        {(templates ?? []).length === 0 && !templatesError ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">No template rows found</CardTitle>
              <CardDescription className="text-foreground/80">
                Your project is missing the seeded goals with{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  is_template = true
                </code>
                . In the Supabase SQL Editor, run{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  supabase/migrations/0005_seed_template_goals_if_missing.sql
                </code>{" "}
                (or apply migrations with the Supabase CLI), then refresh this page.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        <ul className="grid gap-3 sm:grid-cols-2">
          {(templates ?? []).map((t) => {
            const emoji = templateEmoji(t.icon);
            return (
            <li key={t.id}>
              <Card className="h-full border-border/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {emoji ? <span aria-hidden>{emoji}</span> : null}
                    {t.title}
                  </CardTitle>
                  {t.description ? (
                    <CardDescription>{t.description}</CardDescription>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {goalTrackingCadenceShort(t.type as GoalType, t.target_per_period)}
                  </p>
                </CardHeader>
                <CardContent>
                  <CloneTemplateButton templateId={t.id} />
                </CardContent>
              </Card>
            </li>
            );
          })}
        </ul>
      </section>

      {archived.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Archived</h2>
          <ul className="space-y-2">
            {archived.map((g) => (
              <li key={g.id}>
                <Card className="border-dashed opacity-90">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{g.title}</CardTitle>
                      <Badge variant="outline">Archived</Badge>
                    </div>
                    <ArchiveGoalButton goalId={g.id} mode="unarchive" />
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
