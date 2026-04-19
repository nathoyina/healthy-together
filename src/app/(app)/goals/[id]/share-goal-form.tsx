"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shareGoalWithGroup, unshareGoalFromGroup } from "@/app/(app)/groups/actions";

export function ShareGoalForm({
  goalId,
  groups,
  sharedGroupIds,
}: {
  goalId: string;
  groups: { id: string; name: string }[];
  sharedGroupIds: string[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending || groups.length === 0}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Share with group
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {groups.map((g) => (
            <DropdownMenuItem
              key={g.id}
              disabled={sharedGroupIds.includes(g.id)}
              onClick={() =>
                start(async () => {
                  const res = await shareGoalWithGroup(goalId, g.id);
                  if (res?.error) toast.error(res.error);
                  else router.refresh();
                })
              }
            >
              {g.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {sharedGroupIds.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={pending}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Manage shares
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {groups
              .filter((g) => sharedGroupIds.includes(g.id))
              .map((g) => (
                <DropdownMenuItem
                  key={g.id}
                  onClick={() =>
                    start(async () => {
                      const res = await unshareGoalFromGroup(goalId, g.id);
                      if (res?.error) toast.error(res.error);
                      else router.refresh();
                    })
                  }
                >
                  Stop sharing in {g.name}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
