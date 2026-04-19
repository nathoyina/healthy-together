"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { GoalType } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { WeeklyBar } from "@/components/goals/WeeklyBar";
import { StreakBadge } from "@/components/goals/StreakBadge";
import {
  setDailyBinaryDone,
  setCountForDate,
  adjustCountForDate,
} from "@/app/(app)/dashboard/entry-actions";

export type DashboardGoal = {
  id: string;
  title: string;
  type: GoalType;
  target_per_period: number | null;
  icon: string | null;
};

export function CheckInControl({
  goal,
  todayStr,
  doneToday,
  todayCount,
  weekTotal,
  streakDays,
}: {
  goal: DashboardGoal;
  todayStr: string;
  doneToday: boolean;
  todayCount: number;
  weekTotal: number;
  streakDays: number;
}) {
  const [pending, start] = useTransition();

  if (goal.type === "daily_binary") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <StreakBadge days={streakDays} />
        </div>
        <Button
          size="lg"
          variant={doneToday ? "secondary" : "default"}
          disabled={pending}
          className="min-w-[8rem] shrink-0"
          onClick={() =>
            start(async () => {
              try {
                await setDailyBinaryDone(goal.id, todayStr, !doneToday);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not update");
              }
            })
          }
        >
          {doneToday ? "Undo" : "Done today"}
        </Button>
      </div>
    );
  }

  const target = goal.target_per_period ?? 1;

  if (goal.type === "weekly_count" || goal.type === "daily_count") {
    const label =
      goal.type === "weekly_count" ? "This week’s habit" : "Today’s total";

    return (
      <div className="space-y-4">
        {goal.type === "weekly_count" ? (
          <WeeklyBar current={weekTotal} target={target} label={label} />
        ) : (
          <div className="text-xs text-muted-foreground">
            Target today: <span className="font-medium text-foreground">{target}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={pending || todayCount <= 0}
            aria-label="Decrease"
            onClick={() =>
              start(async () => {
                try {
                  await adjustCountForDate(goal.id, todayStr, -1);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not update");
                }
              })
            }
          >
            −
          </Button>
          <div className="text-center">
            <p className="text-2xl font-semibold tabular-nums">{todayCount}</p>
            <p className="text-xs text-muted-foreground">
              {goal.type === "weekly_count" ? "sessions today" : "logged today"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={pending}
            aria-label="Increase"
            onClick={() =>
              start(async () => {
                try {
                  await adjustCountForDate(goal.id, todayStr, 1);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not update");
                }
              })
            }
          >
            +
          </Button>
        </div>
        {goal.type === "daily_count" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            disabled={pending || todayCount <= 0}
            onClick={() =>
              start(async () => {
                try {
                  await setCountForDate(goal.id, todayStr, 0);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not update");
                }
              })
            }
          >
            Clear today
          </Button>
        ) : null}
      </div>
    );
  }

  return null;
}
