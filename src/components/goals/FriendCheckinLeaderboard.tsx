import Link from "next/link";
import type { FriendLeaderRow } from "@/lib/friend-goal-leaderboard";
import { displayNameForLeader } from "@/lib/friend-goal-leaderboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function rankStyle(rank: number) {
  if (rank === 1) return "bg-amber-500/15 text-amber-950 dark:text-amber-100";
  if (rank === 2) return "bg-muted text-foreground";
  if (rank === 3) return "bg-orange-950/10 text-foreground dark:bg-orange-500/15";
  return "bg-muted/40 text-muted-foreground";
}

export function FriendCheckinLeaderboard({
  rows,
  id,
  participantCount,
}: {
  rows: FriendLeaderRow[];
  id?: string;
  /** Participants on this goal (including you). */
  participantCount: number;
}) {
  return (
    <Card id={id} className="scroll-mt-24 border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Company leaderboard</CardTitle>
        <CardDescription>
          Ranking by total check-ins on this habit (sum of every log). Everyone who
          joins this goal is listed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {participantCount <= 1 ? (
          <p className="rounded-md border border-dashed border-border/80 bg-muted/30 p-3 text-sm text-muted-foreground">
            Invite colleagues to join this goal from{" "}
            <Link href="/goals" className="font-medium text-primary underline">
              Habits
            </Link>{" "}
            to see a richer leaderboard. For now, you are the only participant.
          </p>
        ) : null}
        {rows.length > 0 && rows.every((r) => r.checkIns === 0) ? (
          <p className="rounded-md border border-dashed border-border/80 bg-muted/30 p-3 text-sm text-muted-foreground">
            Participants are joined, but no one has checked in yet.
          </p>
        ) : null}
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.userId}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                r.isYou
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/80 bg-muted/15",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                  rankStyle(r.rank),
                )}
              >
                {r.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium leading-tight">
                  {displayNameForLeader(r)}
                  {r.isYou ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (you)
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">Total check-ins</p>
              </div>
              <p className="shrink-0 text-lg font-semibold tabular-nums">{r.checkIns}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
