import { toast } from "sonner";

/** Maps common Supabase Auth errors to clearer guidance. */
export function toastAuthError(error: { message: string }) {
  const m = error.message.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many")) {
    toast.error("Too many emails from Supabase Auth", {
      description:
        "Turn off “Confirm email” for the Email provider (Auth → Providers → Email) so sign-up does not send mail, or wait for the limit to reset. For production, add Custom SMTP in Auth settings.",
    });
    return;
  }
  toast.error(error.message);
}

/** Handles thrown (non-Supabase) auth errors like network/env misconfig. */
export function toastAuthUnexpected(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Could not reach auth service.";
  const m = message.toLowerCase();

  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed")
  ) {
    toast.error("Could not connect to Supabase Auth", {
      description:
        "Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (or Vercel env vars) and restart the app.",
    });
    return;
  }

  toast.error(message);
}
