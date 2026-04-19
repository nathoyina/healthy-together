/**
 * Supabase password auth requires an email. We map username → a stable synthetic
 * address. Default is `@supabase.co` because GoTrue’s validator DNS-checks most
 * domains (MX / blocklists); `*.supabase.co` is treated as valid in upstream tests.
 *
 * Override with NEXT_PUBLIC_LOGIN_EMAIL_HOST if you use your own verified domain.
 */
function loginEmailHost() {
  const raw =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_LOGIN_EMAIL_HOST) ||
    "supabase.co";
  return raw.replace(/^@/, "").trim().toLowerCase() || "supabase.co";
}

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidUsernameShape(username: string) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

export function usernameToLoginEmail(username: string) {
  const u = normalizeUsername(username);
  return `${u}@${loginEmailHost()}`;
}
