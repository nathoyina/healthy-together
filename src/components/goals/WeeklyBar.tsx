import { Progress } from "@/components/ui/progress";

export function WeeklyBar({
  current,
  target,
  label,
}: {
  current: number;
  target: number;
  label?: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="space-y-1">
      {label ? (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span>
            {current} / {target} this week
          </span>
        </div>
      ) : (
        <div className="text-right text-xs text-muted-foreground">
          {current} / {target} this week
        </div>
      )}
      <Progress value={pct} className="h-2" />
    </div>
  );
}
