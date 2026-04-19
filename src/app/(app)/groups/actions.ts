"use server";

import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { makeGroupSlug } from "@/lib/slug";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const nameSchema = z.string().min(2).max(80);

export async function createGroup(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = nameSchema.safeParse(String(formData.get("name") ?? "").trim());
  if (!parsed.success) {
    return { error: "Enter a group name (2–80 characters)." };
  }

  const invite_code = randomBytes(4).toString("hex").toUpperCase();
  const slug = makeGroupSlug(parsed.data);

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      name: parsed.data,
      slug,
      invite_code,
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (error) {
    return { error: error.message };
  }

  const { error: memErr } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "owner",
  });

  if (memErr) {
    return { error: memErr.message };
  }

  revalidatePath("/groups");
  redirect(`/groups/${group.slug}`);
}

export async function joinGroupByCode(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "Enter an invite code." };

  const { data: groupId, error } = await supabase.rpc("join_group_by_code", {
    p_code: code,
  });

  if (error) {
    return { error: error.message };
  }

  const { data: group } = await supabase
    .from("groups")
    .select("slug")
    .eq("id", groupId as string)
    .maybeSingle();

  if (!group?.slug) {
    return { error: "Joined, but could not load the group." };
  }

  revalidatePath("/groups");
  redirect(`/groups/${group.slug}`);
}

export async function shareGoalWithGroup(goalId: string, groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("group_goals").insert({
    group_id: groupId,
    goal_id: goalId,
  });

  if (error) return { error: error.message };

  revalidatePath("/groups");
  revalidatePath(`/goals/${goalId}`);
  return { ok: true as const };
}

export async function unshareGoalFromGroup(goalId: string, groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("group_goals")
    .delete()
    .match({ group_id: groupId, goal_id: goalId });

  if (error) return { error: error.message };

  revalidatePath("/groups");
  revalidatePath(`/goals/${goalId}`);
  return { ok: true as const };
}
