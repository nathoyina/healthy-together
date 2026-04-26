"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import type { GoalType } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { WeeklyBar } from "@/components/goals/WeeklyBar";
import { StreakBadge } from "@/components/goals/StreakBadge";
import { setDailyBinaryDone, setCountForDate } from "@/app/(app)/dashboard/entry-actions";

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
  const [optimisticDoneToday, setOptimisticDoneToday] = useState(doneToday);
  const [optimisticTodayCount, setOptimisticTodayCount] = useState(todayCount);
  const [optimisticWeekTotal, setOptimisticWeekTotal] = useState(weekTotal);

  useEffect(() => {
    setOptimisticDoneToday(doneToday);
  }, [doneToday]);

  useEffect(() => {
    setOptimisticTodayCount(todayCount);
  }, [todayCount]);

  useEffect(() => {
    setOptimisticWeekTotal(weekTotal);
  }, [weekTotal]);

  if (goal.type === "daily_binary") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <StreakBadge days={streakDays} />
        </div>
        <Button
          size="lg"
          variant={optimisticDoneToday ? "secondary" : "default"}
          disabled={pending}
          className="min-w-[8rem] shrink-0 rounded-full"
          onClick={() =>
            start(async () => {
              const next = !optimisticDoneToday;
              setOptimisticDoneToday(next);
              try {
                await setDailyBinaryDone(goal.id, todayStr, next);
              } catch (e) {
                setOptimisticDoneToday(!next);
                toast.error(e instanceof Error ? e.message : "Could not update");
              }
            })
          }
        >
          {optimisticDoneToday ? "Undo" : "Done today"}
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
          <WeeklyBar current={optimisticWeekTotal} target={target} label={label} />
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
            disabled={pending || optimisticTodayCount <= 0}
            aria-label="Decrease"
            onClick={() =>
              start(async () => {
                const nextCount = Math.max(0, optimisticTodayCount - 1);
                const delta = nextCount - optimisticTodayCount;
                setOptimisticTodayCount(nextCount);
                if (goal.type === "weekly_count") {
                  setOptimisticWeekTotal((prev) => Math.max(0, prev + delta));
                }
                try {
                  await setCountForDate(goal.id, todayStr, nextCount);
                } catch (e) {
                  setOptimisticTodayCount(todayCount);
                  setOptimisticWeekTotal(weekTotal);
                  toast.error(e instanceof Error ? e.message : "Could not update");
                }
              })
            }
          >
            −
          </Button>
          <div className="text-center">
            <p className="text-2xl font-semibold tabular-nums">{optimisticTodayCount}</p>
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
                const nextCount = optimisticTodayCount + 1;
                const delta = nextCount - optimisticTodayCount;
                setOptimisticTodayCount(nextCount);
                if (goal.type === "weekly_count") {
                  setOptimisticWeekTotal((prev) => prev + delta);
                }
                try {
                  await setCountForDate(goal.id, todayStr, nextCount);
                } catch (e) {
                  setOptimisticTodayCount(todayCount);
                  setOptimisticWeekTotal(weekTotal);
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
            disabled={pending || optimisticTodayCount <= 0}
            onClick={() =>
              start(async () => {
                const previous = optimisticTodayCount;
                setOptimisticTodayCount(0);
                if (goal.type === "weekly_count") {
                  setOptimisticWeekTotal((prev) => Math.max(0, prev - previous));
                }
                try {
                  await setCountForDate(goal.id, todayStr, 0);
                } catch (e) {
                  setOptimisticTodayCount(todayCount);
                  setOptimisticWeekTotal(weekTotal);
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
