"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCustomGoal } from "../actions";
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

export function NewGoalForm() {
  const [state, formAction, pending] = useActionState(createCustomGoal, null as
    | { error?: string }
    | null);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>New habit</CardTitle>
        <CardDescription>
          Pick a name and how often you want to log — daily yes/no, weekly counts, or a
          daily total. You can archive anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required maxLength={120} placeholder="Morning stretch" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" name="description" maxLength={500} placeholder="Short note" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tracking style</Label>
            <select
              id="type"
              name="type"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              defaultValue="daily_binary"
            >
              <option value="daily_binary">Once per day (done / not done)</option>
              <option value="weekly_count">Count per week (Mon–Sun)</option>
              <option value="daily_count">Count per day</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_per_period">Target (weekly / daily count)</Label>
            <Input
              id="target_per_period"
              name="target_per_period"
              type="number"
              min={1}
              max={999}
              defaultValue={3}
            />
            <p className="text-xs text-muted-foreground">
              Used for weekly and daily count goals. Ignored for simple daily done.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create goal"}
            </Button>
            <Link href="/goals" className={cn(buttonVariants({ variant: "outline" }))}>
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
