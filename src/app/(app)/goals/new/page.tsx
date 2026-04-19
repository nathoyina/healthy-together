import Link from "next/link";
import { NewGoalForm } from "./new-goal-form";

export default function NewGoalPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/goals"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to habits
      </Link>
      <NewGoalForm />
    </div>
  );
}
