import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateString, isoWeekRangeForDate } from "@/lib/week";
import { dailyBinaryStreakFromSet } from "@/lib/streaks";
import type { GoalType } from "@/lib/types/database";
import { CheckInControl } from "@/components/goals/CheckInControl";
import { DashboardRealtime } from "./dashboard-realtime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { subDays } from "date-fns";
import { goalTrackingCadenceShort } from "@/lib/goal-tracking-copy";

type GoalRow = {
  id: string;
  title: string;
  type: GoalType;
  target_per_period: number | null;
  icon: string | null;
  color: string | null;
  archived_at: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = formatDateString(new Date());
  const { start, end } = isoWeekRangeForDate(new Date());
  const weekStart = formatDateString(start);
  const weekEnd = formatDateString(end);
  const streakLookback = formatDateString(subDays(new Date(), 120));

  const { data: parts } = await supabase
    .from("goal_participants")
    .select(
      `
      goals (
        id,
        title,
        type,
        target_per_period,
        icon,
        color,
        archived_at
      )
    `,
    )
    .eq("user_id", user.id);

  const goals: GoalRow[] = (parts ?? [])
    .map((p) => {
      const g = p.goals as GoalRow | GoalRow[] | null;
      if (!g) return null;
      return Array.isArray(g) ? g[0] : g;
    })
    .filter((g): g is GoalRow => !!g && !g.archived_at);

  const goalIds = goals.map((g) => g.id);

  const { data: weekEntries } =
    goalIds.length > 0
      ? await supabase
          .from("goal_entries")
          .select("goal_id, entry_date, value")
          .eq("user_id", user.id)
          .in("goal_id", goalIds)
          .gte("entry_date", weekStart)
          .lte("entry_date", weekEnd)
      : { data: [] as { goal_id: string; entry_date: string; value: number }[] };

  const binaryGoalIds = goals
    .filter((g) => g.type === "daily_binary")
    .map((g) => g.id);

  const { data: streakEntries } =
    binaryGoalIds.length > 0
      ? await supabase
          .from("goal_entries")
          .select("goal_id, entry_date, value")
          .eq("user_id", user.id)
          .in("goal_id", binaryGoalIds)
          .gte("entry_date", streakLookback)
          .lte("entry_date", today)
      : { data: [] as { goal_id: string; entry_date: string; value: number }[] };

  return (
    <div className="space-y-8">
      <DashboardRealtime goalIds={goalIds} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today’s check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log {today} for each habit below. Friends and groups see progress when you save.
        </p>
      </div>

      {goals.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No habits to track yet</CardTitle>
            <CardDescription>
              Add a starter habit from templates or define your own — then your check-ins
              and streaks show up here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/goals/new" className={cn(buttonVariants())}>
              New habit
            </Link>
            <Link
              href="/goals"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Browse templates
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {goals.map((g) => {
            const wk = (weekEntries ?? []).filter((e) => e.goal_id === g.id);
            const weekTotal = wk.reduce((s, e) => s + e.value, 0);
            const todayRow = wk.find((e) => e.entry_date === today);
            const todayCount = todayRow?.value ?? 0;
            const doneToday =
              g.type === "daily_binary"
                ? wk.some((e) => e.entry_date === today && e.value > 0)
                : false;

            const doneDates = new Set(
              (streakEntries ?? [])
                .filter((e) => e.goal_id === g.id && e.value > 0)
                .map((e) => e.entry_date),
            );
            const streakDays =
              g.type === "daily_binary"
                ? dailyBinaryStreakFromSet(doneDates, today)
                : 0;

            return (
              <li key={g.id}>
                <Card className="overflow-hidden border-border/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-lg">
                          <Link
                            href={`/goals/${g.id}#friend-leaderboard`}
                            className="hover:underline"
                          >
                            {g.title}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          {goalTrackingCadenceShort(g.type, g.target_per_period)}
                        </CardDescription>
                      </div>
                      <Link
                        href={`/goals/${g.id}#friend-leaderboard`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "shrink-0",
                        )}
                      >
                        Leaderboard
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CheckInControl
                      goal={{
                        id: g.id,
                        title: g.title,
                        type: g.type,
                        target_per_period: g.target_per_period,
                        icon: g.icon,
                      }}
                      todayStr={today}
                      doneToday={doneToday}
                      todayCount={todayCount}
                      weekTotal={weekTotal}
                      streakDays={streakDays}
                    />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
