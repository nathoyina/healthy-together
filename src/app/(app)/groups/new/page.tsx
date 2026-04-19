import Link from "next/link";
import { NewGroupForm } from "./new-group-form";

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/groups"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Groups
      </Link>
      <NewGroupForm />
    </div>
  );
}
