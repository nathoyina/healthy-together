"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function GroupRealtime({ goalIds }: { goalIds: string[] }) {
  const router = useRouter();

  useEffect(() => {
    if (goalIds.length === 0) return;
    const supabase = createClient();
    const filter = `goal_id=in.(${goalIds.join(",")})`;
    const channel = supabase
      .channel(`group_goal_entries_${goalIds.join("_")}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goal_entries",
          filter,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [goalIds, router]);

  return null;
}
