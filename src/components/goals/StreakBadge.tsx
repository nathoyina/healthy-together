import { Badge } from "@/components/ui/badge";

export function StreakBadge({ days }: { days: number }) {
  if (days <= 0) return null;
  return (
    <Badge variant="secondary" className="font-normal tabular-nums">
      {days}-day streak
    </Badge>
  );
}
