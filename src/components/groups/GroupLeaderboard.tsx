import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WeeklyBar } from "@/components/goals/WeeklyBar";
import type { GoalType } from "@/lib/types/database";

export type LeaderRow = {
  userId: string;
  username: string | null;
  weekTotal: number;
  daysHitThisWeek: number;
};

export type LeaderboardGoal = {
  id: string;
  title: string;
  type: GoalType;
  target_per_period: number | null;
  rows: LeaderRow[];
};

export function GroupLeaderboard({ goals }: { goals: LeaderboardGoal[] }) {
  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No goals shared with this group yet. Members can share a goal from its
        detail page.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {goals.map((g) => {
        const target =
          g.type === "daily_binary"
            ? 7
            : g.target_per_period ?? Math.max(1, ...g.rows.map((r) => r.weekTotal), 1);

        return (
          <Card key={g.id} className="border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{g.title}</CardTitle>
              <CardDescription className="capitalize">
                {g.type.replace(/_/g, " ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {g.rows
                  .slice()
                  .sort((a, b) => {
                    const av =
                      g.type === "daily_binary" ? a.daysHitThisWeek : a.weekTotal;
                    const bv =
                      g.type === "daily_binary" ? b.daysHitThisWeek : b.weekTotal;
                    return bv - av;
                  })
                  .map((r) => (
                    <li key={r.userId} className="space-y-1 rounded-md border border-border/60 p-3">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">@{r.username ?? "unknown"}</span>
                        {g.type === "daily_binary" ? (
                          <span className="text-muted-foreground tabular-nums">
                            {r.daysHitThisWeek} / 7 days this week
                          </span>
                        ) : (
                          <span className="text-muted-foreground tabular-nums">
                            {r.weekTotal} this week
                          </span>
                        )}
                      </div>
                      {g.type !== "daily_binary" ? (
                        <WeeklyBar
                          current={r.weekTotal}
                          target={g.target_per_period ?? target}
                        />
                      ) : (
                        <WeeklyBar
                          current={r.daysHitThisWeek}
                          target={7}
                          label="Week consistency"
                        />
                      )}
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
