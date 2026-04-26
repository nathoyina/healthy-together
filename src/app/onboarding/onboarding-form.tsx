"use client";

import { useActionState } from "react";
import { Activity } from "lucide-react";
import { completeOnboarding } from "./actions";
import { signOut } from "./sign-out-action";
import {
  goalTrackingCadenceHint,
  goalTrackingCadenceShort,
  templateEmoji,
} from "@/lib/goal-tracking-copy";
import type { GoalType } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TemplateRow = {
  id: string;
  title: string;
  description: string | null;
  type: GoalType;
  target_per_period: number | null;
  icon: string | null;
  color: string | null;
};

export function OnboardingForm({
  templates,
  hasUsername,
  templateLoadError,
}: {
  templates: TemplateRow[];
  hasUsername: boolean;
  templateLoadError?: string | null;
}) {
  const [state, formAction, pending] = useActionState(completeOnboarding, null as
    | { error?: string }
    | null);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-16">
      <Card className="border-primary/20 shadow-sm ring-1 ring-primary/10">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <Activity className="size-5" aria-hidden />
            </span>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Health tracking
            </p>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Join company goals
          </CardTitle>
          <CardDescription>
            {hasUsername
              ? "Pick shared goals to join with colleagues. You can join or leave more anytime."
              : "Choose a username, then pick shared company goals to join with colleagues."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {state?.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            {!hasUsername ? (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  required
                  autoComplete="username"
                  placeholder="your_handle"
                  pattern="[a-z0-9_]{3,20}"
                  title="3–20 characters: letters, numbers, underscores"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and underscores. This is how friends
                  find you.
                </p>
              </div>
            ) : null}
            <div className="space-y-3">
              <Label>Company goals to join</Label>
              {templateLoadError ? (
                <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  Could not load company goals: {templateLoadError}
                </p>
              ) : null}
              {templates.length === 0 && !templateLoadError ? (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-3 text-sm text-foreground">
                  <p className="font-medium text-amber-950 dark:text-amber-100">
                    No company goals in your database yet
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Your company has not published any goals yet. Ask your company
                    admin to create public goals in Settings or from the Habits page.
                    You can still continue now and join later.
                  </p>
                </div>
              ) : null}
              {templates.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Uncheck goals you do not want to join right now.
                </p>
              ) : null}
              <ul className="space-y-3">
                {templates.map((t) => {
                  const emoji = templateEmoji(t.icon);
                  return (
                    <li
                      key={t.id}
                      className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/20 p-3"
                    >
                      <input
                        type="checkbox"
                        name="template"
                        value={t.id}
                        defaultChecked
                        className="mt-1 size-4 rounded border-input"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="flex items-center gap-2 font-medium leading-snug">
                          {emoji ? (
                            <span className="text-lg leading-none" aria-hidden>
                              {emoji}
                            </span>
                          ) : null}
                          {t.title}
                        </p>
                        {t.description ? (
                          <p className="text-sm text-muted-foreground">{t.description}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {goalTrackingCadenceShort(t.type, t.target_per_period)}
                        </p>
                        <p className="text-xs text-muted-foreground/90">
                          {goalTrackingCadenceHint(t.type, t.target_per_period)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending
                ? "Saving…"
                : templates.length > 0
                  ? "Join selected goals"
                  : "Continue without joining"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <form action={signOut}>
        <Button type="submit" variant="ghost" className="w-full text-muted-foreground">
          Sign out
        </Button>
      </form>
    </div>
  );
}
