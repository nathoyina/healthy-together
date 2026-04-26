"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function setDailyBinaryDone(
  goalId: string,
  dateStr: string,
  done: boolean,
) {
  const { supabase, user } = await requireUser();

  if (done) {
    const { error } = await supabase.from("goal_entries").upsert(
      {
        goal_id: goalId,
        user_id: user.id,
        entry_date: dateStr,
        value: 1,
      },
      { onConflict: "goal_id,user_id,entry_date" },
    );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("goal_entries")
      .delete()
      .match({ goal_id: goalId, user_id: user.id, entry_date: dateStr });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/goals/${goalId}`);
}

export async function setCountForDate(
  goalId: string,
  dateStr: string,
  value: number,
) {
  const { supabase, user } = await requireUser();

  if (value <= 0) {
    const { error } = await supabase
      .from("goal_entries")
      .delete()
      .match({ goal_id: goalId, user_id: user.id, entry_date: dateStr });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("goal_entries").upsert(
      {
        goal_id: goalId,
        user_id: user.id,
        entry_date: dateStr,
        value,
      },
      { onConflict: "goal_id,user_id,entry_date" },
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/goals/${goalId}`);
}

export async function adjustCountForDate(
  goalId: string,
  dateStr: string,
  delta: number,
) {
  const { supabase, user } = await requireUser();

  const { data: row } = await supabase
    .from("goal_entries")
    .select("value")
    .match({ goal_id: goalId, user_id: user.id, entry_date: dateStr })
    .maybeSingle();

  const next = Math.max(0, (row?.value ?? 0) + delta);
  await setCountForDate(goalId, dateStr, next);
}
