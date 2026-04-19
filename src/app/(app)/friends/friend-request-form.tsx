"use client";

import { useActionState } from "react";
import { sendFriendRequest } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FriendRequestForm() {
  const [state, formAction, pending] = useActionState(sendFriendRequest, null as
    | { error?: string }
    | null);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="username">Find by username</Label>
        <Input
          id="username"
          name="username"
          placeholder="friend_handle"
          autoComplete="off"
          required
        />
        {state?.error ? (
          <p className="text-xs text-destructive">{state.error}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending} className="sm:mb-0.5">
        {pending ? "Sending…" : "Send request"}
      </Button>
    </form>
  );
}
