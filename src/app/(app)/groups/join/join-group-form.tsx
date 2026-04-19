"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { joinGroupByCode } from "../actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function JoinGroupForm() {
  const searchParams = useSearchParams();
  const preset = searchParams.get("code") ?? "";

  const [state, formAction, pending] = useActionState(joinGroupByCode, null as
    | { error?: string }
    | null);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Join a group</CardTitle>
        <CardDescription>
          Paste the invite code you received (letters and numbers).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="code">Invite code</Label>
            <JoinCodeInput defaultValue={preset} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Joining…" : "Join group"}
            </Button>
            <Link
              href="/groups"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function JoinCodeInput({ defaultValue }: { defaultValue: string }) {
  return (
    <Input
      id="code"
      name="code"
      required
      autoComplete="off"
      defaultValue={defaultValue}
      className="font-mono uppercase"
    />
  );
}
