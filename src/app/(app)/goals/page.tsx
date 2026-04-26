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

type JoinedGoal = {
  id: string;
  title: string;
  type: GoalType;
  target_per_period: number | null;
  archived_at: string | null;
  owner_id: string | null;
  is_template: boolean;
  is_public: boolean;
};

type CompanyGoal = {
  id: string;
  title: string;
  description: string | null;
  type: GoalType;
  target_per_period: number | null;
  icon: string | null;
  owner_id: string | null;
  is_template?: boolean;
  is_public?: boolean;
};

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

  const { data: joinedParts } = await supabase
    .from("goal_participants")
    .select(
      "goal_id, goals(id, title, type, target_per_period, archived_at, owner_id, is_template, is_public)",
    )
    .eq("user_id", user.id);

  const { data: templates, error: templatesError } = await supabase
    .from("goals")
    .select("id, title, description, type, target_per_period, icon, owner_id, is_template, is_public")
    .eq("is_template", true)
    .order("title");

  const { data: publicGoals, error: publicGoalsError } = await supabase
    .from("goals")
    .select("id, title, description, type, target_per_period, icon, owner_id, is_template, is_public")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const active = (mine ?? []).filter((g) => !g.archived_at);
  const archived = (mine ?? []).filter((g) => g.archived_at);
  const joined = (joinedParts ?? [])
    .map((p) => {
      const g = p.goals as JoinedGoal | null | JoinedGoal[];
      if (!g) return null;
      return Array.isArray(g) ? g[0] : g;
    })
    .filter((g): g is JoinedGoal => !!g && !g.archived_at && g.owner_id !== user.id);
  const joinedGoalIds = new Set(joined.map((g) => g.id));
  const companyGoalsById = new Map<string, CompanyGoal>();
  for (const goal of [...(templates ?? []), ...(publicGoals ?? [])]) {
    if (!goal) continue;
    companyGoalsById.set(goal.id, goal as CompanyGoal);
  }
  const companyGoals = [...companyGoalsById.values()].filter(
    (g) => g.owner_id !== user.id && !joinedGoalIds.has(g.id),
  );
  const companyGoalsError =
    templatesError?.message ?? publicGoalsError?.message ?? null;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your habits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create private or public habits, and join company goals with colleagues.
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
            Nothing active yet. Join a company goal below or create your own private habit.
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

      {joined.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Joined company goals</h2>
          <ul className="space-y-2">
            {joined.map((g) => (
              <li key={g.id}>
                <Card className="border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base">
                        <Link href={`/goals/${g.id}#friend-leaderboard`} className="hover:underline">
                          {g.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {goalTrackingCadenceShort(g.type as GoalType, g.target_per_period)}
                      </CardDescription>
                    </div>
                    <Link
                      href={`/goals/${g.id}#friend-leaderboard`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Open
                    </Link>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Company goals
        </h2>
        <p className="text-xs text-muted-foreground">
          Shared goals for the workplace. Join once, then your check-ins contribute to team momentum.
        </p>
        {companyGoalsError ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Could not load company goals: {companyGoalsError}
          </p>
        ) : null}
        {companyGoals.length === 0 && !companyGoalsError ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">No joinable company goals right now</CardTitle>
              <CardDescription className="text-foreground/80">
                You may have already joined every available company goal. Ask a colleague to
                create a public goal.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        <ul className="grid gap-3 sm:grid-cols-2">
          {companyGoals.map((t) => {
            const emoji = templateEmoji(t.icon);
            return (
            <li key={t.id}>
              <Card className="h-full border-border/80">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      <Link href={`/goals/${t.id}`} className="inline-flex items-center gap-2 hover:underline">
                        {emoji ? <span aria-hidden>{emoji}</span> : null}
                        {t.title}
                      </Link>
                    </CardTitle>
                    <Link
                      href={`/goals/${t.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      View
                    </Link>
                  </div>
                  {t.description ? <CardDescription>{t.description}</CardDescription> : null}
                  <p className="text-xs text-muted-foreground">
                    {goalTrackingCadenceShort(t.type as GoalType, t.target_per_period)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/goals/${t.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Open goal
                    </Link>
                    <CloneTemplateButton templateId={t.id} />
                  </div>
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
