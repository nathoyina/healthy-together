import { Suspense } from "react";
import Link from "next/link";
import { JoinGroupForm } from "./join-group-form";

export default function JoinGroupPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/groups"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Groups
      </Link>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <JoinGroupForm />
      </Suspense>
    </div>
  );
}
