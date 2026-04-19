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
  friendCount,
}: {
  rows: FriendLeaderRow[];
  id?: string;
  /** Accepted friends (not including you); for empty-state copy */
  friendCount: number;
}) {
  return (
    <Card id={id} className="scroll-mt-24 border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Friend leaderboard</CardTitle>
        <CardDescription>
          Ranking by total check-ins on this habit (sum of every log). Only you and
          accepted friends who can see this habit are listed — invite friends to join
          as participants so their counts show up here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {friendCount === 0 ? (
          <p className="rounded-md border border-dashed border-border/80 bg-muted/30 p-3 text-sm text-muted-foreground">
            Add friends from{" "}
            <Link href="/friends" className="font-medium text-primary underline">
              Friends
            </Link>{" "}
            to see how your check-ins compare. Until then, only your own total appears.
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
