"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  isValidUsernameShape,
  normalizeUsername,
  usernameToLoginEmail,
} from "@/lib/auth/synthetic-email";
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
import { toast } from "sonner";
import { toastAuthError, toastAuthUnexpected } from "@/lib/auth/auth-toast";

export function RegisterForm() {
  const [username, setUsername] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const u = normalizeUsername(username);
    const code = companyCode.trim().toUpperCase();
    if (!isValidUsernameShape(u)) {
      toast.error(
        "Username must be 3–20 characters: lowercase letters, numbers, underscores.",
      );
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!code) {
      toast.error("Company code is required.");
      return;
    }

    setLoading(true);
    const email = usernameToLoginEmail(u);
    try {
      const { data: companyExists, error: codeError } = await supabase.rpc(
        "company_code_exists",
        { p_code: code },
      );
      if (codeError) {
        toast.error(codeError.message);
        return;
      }
      if (!companyExists) {
        toast.error("Invalid company code.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: u,
            company_code: code,
          },
        },
      });

      if (error) {
        toastAuthError(error);
        return;
      }

      if (data.session) {
        router.push("/onboarding");
        router.refresh();
        return;
      }

      toast("Check your email", {
        description:
          "Email confirmation is on in Supabase. Disable it under Auth → Email for instant sign-up in development.",
      });
    } catch (error) {
      toastAuthUnexpected(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Create account
        </CardTitle>
        <CardDescription>
          Username, company code, and password. No separate email field — we use a
          private login address behind the scenes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_handle"
              pattern="[a-z0-9_]{3,20}"
              title="3–20 characters: letters, numbers, underscores"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_code">Company code</Label>
            <Input
              id="company_code"
              name="company_code"
              required
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              placeholder="ACME2026"
              autoCapitalize="characters"
            />
            <p className="text-xs text-muted-foreground">
              Ask your company admin for the join code.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Sign up"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
