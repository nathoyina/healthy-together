import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateString, isoWeekRangeForDate } from "@/lib/week";
import { dailyBinaryStreakFromSet } from "@/lib/streaks";
import type { GoalType } from "@/lib/types/database";
import { CheckInControl } from "@/components/goals/CheckInControl";
import { FriendCheckinLeaderboard } from "@/components/goals/FriendCheckinLeaderboard";
import { buildFriendLeaderboardRows } from "@/lib/friend-goal-leaderboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareGoalForm } from "./share-goal-form";
import { subDays } from "date-fns";

function uniqueIds(ids: (string | null | undefined)[]): string[] {
  return [...new Set(ids.filter((x): x is string => !!x))];
}

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!goal) notFound();

  const today = formatDateString(new Date());
  const { start, end } = isoWeekRangeForDate(new Date());
  const weekStart = formatDateString(start);
  const weekEnd = formatDateString(end);
  const streakLookback = formatDateString(subDays(new Date(), 120));

  const { data: weekEntries } = await supabase
    .from("goal_entries")
    .select("goal_id, entry_date, value")
    .eq("user_id", user.id)
    .eq("goal_id", id)
    .gte("entry_date", weekStart)
    .lte("entry_date", weekEnd);

  const { data: streakEntries } =
    goal.type === "daily_binary"
      ? await supabase
          .from("goal_entries")
          .select("entry_date, value")
          .eq("user_id", user.id)
          .eq("goal_id", id)
          .gte("entry_date", streakLookback)
          .lte("entry_date", today)
      : { data: [] as { entry_date: string; value: number }[] };

  const wk = weekEntries ?? [];
  const weekTotal = wk.reduce((s, e) => s + e.value, 0);
  const todayRow = wk.find((e) => e.entry_date === today);
  const todayCount = todayRow?.value ?? 0;
  const doneToday =
    goal.type === "daily_binary"
      ? wk.some((e) => e.entry_date === today && e.value > 0)
      : false;

  const doneDates = new Set(
    (streakEntries ?? [])
      .filter((e) => e.value > 0)
      .map((e) => e.entry_date),
  );
  const streakDays =
    goal.type === "daily_binary"
      ? dailyBinaryStreakFromSet(doneDates, today)
      : 0;

  const { data: history } = await supabase
    .from("goal_entries")
    .select("entry_date, value, created_at")
    .eq("goal_id", id)
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .limit(42);

  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const acceptedFriendIds: string[] = [];
  for (const f of friendships ?? []) {
    if (f.status !== "accepted") continue;
    const other = f.requester_id === user.id ? f.addressee_id : f.requester_id;
    acceptedFriendIds.push(other);
  }

  const rankUserIds = uniqueIds([user.id, goal.owner_id, ...acceptedFriendIds]);

  const { data: leaderboardEntries } = goal.is_template
    ? { data: [] as { user_id: string; value: number }[] }
    : await supabase
        .from("goal_entries")
        .select("user_id, value")
        .eq("goal_id", id)
        .in("user_id", rankUserIds);

  const { data: leaderboardProfiles } =
    !goal.is_template && rankUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", rankUserIds)
      : { data: [] as { id: string; username: string | null; display_name: string | null }[] };

  const profileMap = new Map(
    (leaderboardProfiles ?? []).map((p) => [
      p.id,
      { username: p.username, display_name: p.display_name },
    ]),
  );

  const leaderboardRows = goal.is_template
    ? []
    : buildFriendLeaderboardRows(
        user.id,
        goal.owner_id,
        acceptedFriendIds,
        leaderboardEntries ?? [],
        profileMap,
      );

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups ( id, name )")
    .eq("user_id", user.id);

  const groups = ((memberships ?? [])
    .map((m) => {
      const g = m.groups as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null;
      if (!g) return null;
      return Array.isArray(g) ? g[0] : g;
    })
    .filter((g): g is { id: string; name: string } => !!g));

  const { data: shares } = await supabase
    .from("group_goals")
    .select("group_id")
    .eq("goal_id", id);

  const sharedGroupIds = (shares ?? []).map((s) => s.group_id);

  const isOwner = goal.owner_id === user.id;

  return (
    <div className="space-y-8">
      <Link
        href="/goals"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← All habits
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{goal.title}</h1>
          {goal.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{goal.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">
              {goal.type.replace(/_/g, " ")}
            </Badge>
            {goal.archived_at ? <Badge variant="outline">Archived</Badge> : null}
            {goal.is_template ? <Badge variant="outline">Template</Badge> : null}
          </div>
        </div>
      </div>

      {!goal.archived_at ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Check in</CardTitle>
            <CardDescription>Your progress for this goal.</CardDescription>
          </CardHeader>
          <CardContent>
            <CheckInControl
              goal={{
                id: goal.id,
                title: goal.title,
                type: goal.type as GoalType,
                target_per_period: goal.target_per_period,
                icon: goal.icon,
              }}
              todayStr={today}
              doneToday={doneToday}
              todayCount={todayCount}
              weekTotal={weekTotal}
              streakDays={streakDays}
            />
          </CardContent>
        </Card>
      ) : null}

      {!goal.is_template ? (
        <FriendCheckinLeaderboard
          id="friend-leaderboard"
          rows={leaderboardRows}
          friendCount={acceptedFriendIds.length}
        />
      ) : (
        <Card className="border-dashed border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">Friend leaderboard</CardTitle>
            <CardDescription>
              After you add this habit to your list, you and accepted friends can compare
              total check-ins on the same habit.{" "}
              <Link href="/goals" className="font-medium text-foreground underline">
                Browse habits
              </Link>{" "}
              to clone it.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isOwner && !goal.archived_at ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Groups</CardTitle>
            <CardDescription>
              Share this goal with a group so members see a shared leaderboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShareGoalForm
              goalId={goal.id}
              groups={groups}
              sharedGroupIds={sharedGroupIds}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent log</CardTitle>
          <CardDescription>Your last entries (newest first).</CardDescription>
        </CardHeader>
        <CardContent>
          {(history ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <ul className="divide-y divide-border/80 rounded-md border border-border/80">
              {(history ?? []).map((h) => (
                <li
                  key={`${h.entry_date}-${h.created_at}`}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{h.entry_date}</span>
                  <span className="font-medium tabular-nums">{h.value}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
