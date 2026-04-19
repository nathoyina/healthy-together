"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { respondToFriendship } from "./actions";

export function IncomingRequests({
  rows,
}: {
  rows: {
    id: string;
    requester: { username: string | null; display_name: string | null };
  }[];
}) {
  const [pending, start] = useTransition();

  if (rows.length === 0) return null;

  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 px-3 py-2"
        >
          <div>
            <p className="text-sm font-medium">
              @{r.requester.username ?? "unknown"}
            </p>
            {r.requester.display_name ? (
              <p className="text-xs text-muted-foreground">{r.requester.display_name}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  try {
                    await respondToFriendship(r.id, "accepted");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not accept");
                  }
                })
              }
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  try {
                    await respondToFriendship(r.id, "declined");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not decline");
                  }
                })
              }
            >
              Decline
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
