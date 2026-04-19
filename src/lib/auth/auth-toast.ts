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
