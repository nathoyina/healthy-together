import { addDays, parseISO } from "date-fns";
import { formatDateString } from "@/lib/week";

/** Walk backward from `anchorDate` (yyyy-MM-dd) while each day exists in `doneDates`. */
export function dailyBinaryStreakFromSet(
  doneDates: Set<string>,
  anchorDate: string,
): number {
  let d = parseISO(anchorDate);
  let streak = 0;
  while (doneDates.has(formatDateString(d))) {
    streak += 1;
    d = addDays(d, -1);
  }
  return streak;
}

export function hasEntryOn(
  entries: { entry_date: string; value: number }[],
  dateStr: string,
) {
  return entries.some((e) => e.entry_date === dateStr && e.value > 0);
}

export function todayLocalDateString() {
  return formatDateString(new Date());
}
