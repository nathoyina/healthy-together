import type { GoalType } from "@/lib/types/database";

/** Emoji for template `goals.icon` keys from the DB seed. */
const TEMPLATE_ICON_EMOJI: Record<string, string> = {
  flame: "🔥",
  dumbbell: "🏋️",
  footprints: "👟",
  heart: "❤️",
  droplet: "💧",
  moon: "🌙",
};

export function templateEmoji(icon: string | null | undefined): string | null {
  if (!icon) return null;
  return TEMPLATE_ICON_EMOJI[icon] ?? null;
}

/** One line for cards and dashboard (health / habit framing). */
export function goalTrackingCadenceShort(
  type: GoalType,
  targetPerPeriod: number | null,
): string {
  switch (type) {
    case "daily_binary":
      return "Daily habit · mark when you’ve done it";
    case "weekly_count":
      return targetPerPeriod != null
        ? `Weekly habit · ${targetPerPeriod} logs Mon–Sun`
        : "Weekly habit · Mon–Sun";
    case "daily_count":
      return targetPerPeriod != null
        ? `Daily count · target ${targetPerPeriod} today`
        : "Daily count";
    default: {
      const _exhaustive: never = type;
      return String(_exhaustive);
    }
  }
}

/** Slightly longer helper text for onboarding and empty states. */
export function goalTrackingCadenceHint(
  type: GoalType,
  targetPerPeriod: number | null,
): string {
  switch (type) {
    case "daily_binary":
      return "One check-in per calendar day — great for routines you want to keep streaks on.";
    case "weekly_count": {
      const t = targetPerPeriod;
      if (t != null) {
        return `Log each session through Sunday. Aim for ${t} this week — perfect for workouts or runs.`;
      }
      return "Log each session through Sunday; your target is set on the goal.";
    }
    case "daily_count":
      return "Add up multiple small wins in a day (e.g. glasses of water, sets, or walks).";
    default: {
      const _exhaustive: never = type;
      return String(_exhaustive);
    }
  }
}
