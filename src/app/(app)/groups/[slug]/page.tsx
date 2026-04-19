import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateString, isoWeekRangeForDate } from "@/lib/week";
import type { GoalType } from "@/lib/types/database";
import {
  GroupLeaderboard,
  type LeaderboardGoal,
  type LeaderRow,
} from "@/components/groups/GroupLeaderboard";
import { GroupRealtime } from "../group-realtime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, slug, invite_code, created_by")
    .eq("slug", slug)
    .maybeSingle();

  if (!group) notFound();

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) notFound();

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("user_id, profiles ( username )")
    .eq("group_id", group.id);

  const usernameByUserId = new Map<string, string | null>();
  for (const row of memberRows ?? []) {
    const raw = row.profiles as
      | { username: string | null }
      | { username: string | null }[]
      | null;
    const p = raw == null ? null : Array.isArray(raw) ? raw[0] : raw;
    usernameByUserId.set(row.user_id, p?.username ?? null);
  }

  const { data: ggRows } = await supabase
    .from("group_goals")
    .select(
      `
      goal_id,
      goals (
        id,
        title,
        type,
        target_per_period
      )
    `,
    )
    .eq("group_id", group.id);

  type SharedGoal = {
    id: string;
    title: string;
    type: GoalType;
    target_per_period: number | null;
  };

  const sharedGoals: SharedGoal[] = (ggRows ?? [])
    .map((r) => {
      const g = r.goals as SharedGoal | SharedGoal[] | null;
      if (!g) return null;
      return Array.isArray(g) ? g[0] : g;
    })
    .filter((g): g is SharedGoal => !!g);

  const goalIds = sharedGoals.map((g) => g.id);

  const today = new Date();
  const { start, end } = isoWeekRangeForDate(today);
  const weekStart = formatDateString(start);
  const weekEnd = formatDateString(end);

  const leaderboardGoals: LeaderboardGoal[] = [];

  for (const g of sharedGoals) {
    const { data: parts } = await supabase
      .from("goal_participants")
      .select("user_id")
      .eq("goal_id", g.id);

    const userIds = [...new Set((parts ?? []).map((p) => p.user_id))];

    const rows: LeaderRow[] = [];

    for (const uid of userIds) {
      const { data: entries } = await supabase
        .from("goal_entries")
        .select("entry_date, value")
        .eq("goal_id", g.id)
        .eq("user_id", uid)
        .gte("entry_date", weekStart)
        .lte("entry_date", weekEnd);

      const weekTotal = (entries ?? []).reduce((s, e) => s + e.value, 0);
      const daysHitThisWeek = new Set(
        (entries ?? []).filter((e) => e.value > 0).map((e) => e.entry_date),
      ).size;

      rows.push({
        userId: uid,
        username: usernameByUserId.get(uid) ?? null,
        weekTotal,
        daysHitThisWeek,
      });
    }

    leaderboardGoals.push({
      id: g.id,
      title: g.title,
      type: g.type,
      target_per_period: g.target_per_period,
      rows,
    });
  }

  const inviteUrl = `/groups/join?code=${encodeURIComponent(group.invite_code)}`;

  return (
    <div className="space-y-8">
      <GroupRealtime goalIds={goalIds} />
      <Link
        href="/groups"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← All groups
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Invite code</p>
        <p className="mt-1 font-mono text-lg font-semibold tracking-wider">
          {group.invite_code}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={inviteUrl}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Open join link
          </Link>
        </div>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Leaderboard</CardTitle>
          <CardDescription>
            Live totals for this week (Mon–Sun, your local server date uses UTC on
            first paint — check-ins use your device date on the dashboard).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GroupLeaderboard goals={leaderboardGoals} />
        </CardContent>
      </Card>
    </div>
  );
}
