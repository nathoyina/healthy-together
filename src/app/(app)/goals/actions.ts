"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { GoalType } from "@/lib/types/database";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  type: z.enum(["daily_binary", "weekly_count", "daily_count"]),
  target_per_period: z.coerce.number().int().min(1).max(999).optional(),
  visibility: z.enum(["private", "public"]).default("private"),
});

export async function createCustomGoal(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    target_per_period: formData.get("target_per_period") || undefined,
    visibility: formData.get("visibility") || "private",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.flatten().formErrors.join(" ") || "Invalid form.",
    };
  }

  const needsTarget =
    parsed.data.type === "weekly_count" || parsed.data.type === "daily_count";
  const target = needsTarget ? (parsed.data.target_per_period ?? 3) : null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.company_id) {
    return { error: "Company not found for this user." };
  }

  const { data: goal, error } = await supabase
    .from("goals")
    .insert({
      owner_id: user.id,
      company_id: profile.company_id,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      type: parsed.data.type as GoalType,
      target_per_period: target,
      is_template: false,
      is_public: parsed.data.visibility === "public",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/goals");
  redirect(`/goals/${goal.id}`);
}

export async function archiveGoal(goalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("goals")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", goalId)
    .eq("owner_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/goals");
}

export async function unarchiveGoal(goalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("goals")
    .update({ archived_at: null })
    .eq("id", goalId)
    .eq("owner_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/goals");
}

export async function joinCompanyGoal(goalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goal } = await supabase
    .from("goals")
    .select("id, is_template, is_public, owner_id")
    .eq("id", goalId)
    .maybeSingle();

  if (!goal || (!goal.is_template && !goal.is_public)) {
    return { error: "This goal is not joinable." };
  }

  if (goal.owner_id === user.id) {
    return { error: "You already own this goal." };
  }

  const { error } = await supabase.from("goal_participants").insert({
    goal_id: goal.id,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "You already joined this goal." };
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/goals");
  redirect(`/goals/${goal.id}`);
}
