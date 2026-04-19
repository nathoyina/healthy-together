"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9_]+$/, "Use letters, numbers, and underscores only.");

export async function completeOnboarding(
  _state: { error?: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  const selectedTemplates = formData.getAll("template").map(String);

  const existingUsername = profile?.username?.trim() || null;
  const raw = String(formData.get("username") ?? "").trim().toLowerCase();

  let usernameToSave: string;
  if (existingUsername) {
    usernameToSave = existingUsername;
  } else {
    const parsed = usernameSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.flatten().formErrors[0] ?? "Invalid username." };
    }
    usernameToSave = parsed.data;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username: usernameToSave,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    if (profileError.code === "23505") {
      return { error: "That username is already taken." };
    }
    return { error: profileError.message };
  }

  for (const tid of selectedTemplates) {
    const { data: template } = await supabase
      .from("goals")
      .select("*")
      .eq("id", tid)
      .eq("is_template", true)
      .maybeSingle();

    if (!template) continue;

    const { error: insertErr } = await supabase.from("goals").insert({
      owner_id: user.id,
      title: template.title,
      description: template.description,
      type: template.type,
      target_per_period: template.target_per_period,
      icon: template.icon,
      color: template.color,
      is_template: false,
    });

    if (insertErr) {
      return { error: insertErr.message };
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
