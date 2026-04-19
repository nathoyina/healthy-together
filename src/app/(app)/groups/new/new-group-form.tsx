"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createGroup } from "../actions";
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

export function NewGroupForm() {
  const [state, formAction, pending] = useActionState(createGroup, null as
    | { error?: string }
    | null);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>New group</CardTitle>
        <CardDescription>
          You will get an invite code to share with friends.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">Group name</Label>
            <Input id="name" name="name" required minLength={2} maxLength={80} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create group"}
            </Button>
            <Link href="/groups" className={cn(buttonVariants({ variant: "outline" }))}>
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
