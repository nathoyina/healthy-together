"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const usernameSchema = z.string().min(3).max(20);

export async function sendFriendRequest(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const raw = String(formData.get("username") ?? "").trim().toLowerCase();
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Enter a valid username (3–20 characters)." };
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data)
    .maybeSingle();

  if (!target) return { error: "No user with that username." };
  if (target.id === user.id) return { error: "You cannot add yourself." };

  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status, requester_id, addressee_id")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`,
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted") return { error: "You are already friends." };
    if (existing.status === "pending") return { error: "A request is already pending." };
    if (existing.status === "blocked") return { error: "Cannot send request." };
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: target.id,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/friends");
  return null;
}

export async function respondToFriendship(
  friendshipId: string,
  status: "accepted" | "declined",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("friendships")
    .update({ status })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/friends");
}
