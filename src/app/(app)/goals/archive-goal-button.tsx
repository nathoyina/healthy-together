"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { archiveGoal, unarchiveGoal } from "./actions";

export function ArchiveGoalButton({
  goalId,
  mode,
}: {
  goalId: string;
  mode: "archive" | "unarchive";
}) {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            if (mode === "archive") await archiveGoal(goalId);
            else await unarchiveGoal(goalId);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not update goal");
          }
        })
      }
    >
      {mode === "archive" ? "Archive" : "Restore"}
    </Button>
  );
}
