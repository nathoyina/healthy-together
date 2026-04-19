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
  });

  if (!parsed.success) {
    return {
      error: parsed.error.flatten().formErrors.join(" ") || "Invalid form.",
    };
  }

  const needsTarget =
    parsed.data.type === "weekly_count" || parsed.data.type === "daily_count";
  const target = needsTarget ? (parsed.data.target_per_period ?? 3) : null;

  const { data: goal, error } = await supabase
    .from("goals")
    .insert({
      owner_id: user.id,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      type: parsed.data.type as GoalType,
      target_per_period: target,
      is_template: false,
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

export async function cloneTemplateGoal(templateId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: template } = await supabase
    .from("goals")
    .select("*")
    .eq("id", templateId)
    .eq("is_template", true)
    .maybeSingle();

  if (!template) {
    return { error: "Template not found." };
  }

  const { data: goal, error } = await supabase
    .from("goals")
    .insert({
      owner_id: user.id,
      title: template.title,
      description: template.description,
      type: template.type,
      target_per_period: template.target_per_period,
      icon: template.icon,
      color: template.color,
      is_template: false,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/goals");
  redirect(`/goals/${goal.id}`);
}
