import {
  endOfISOWeek,
  format,
  parseISO,
  startOfISOWeek,
  eachDayOfInterval,
} from "date-fns";

/** Monday–Sunday ISO week range for a calendar date. */
export function isoWeekRangeForDate(d: Date) {
  const start = startOfISOWeek(d);
  const end = endOfISOWeek(d);
  return { start, end };
}

export function formatDateString(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function parseDateString(s: string) {
  return parseISO(s);
}

export function daysInIsoWeek(d: Date) {
  const { start, end } = isoWeekRangeForDate(d);
  return eachDayOfInterval({ start, end });
}
